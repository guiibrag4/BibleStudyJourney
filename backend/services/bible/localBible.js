/**
 * Bíblia local: lê os arquivos backend/data/bible/<versao>.json.gz e responde
 * no mesmo formato da antiga A Bíblia Digital, para o frontend não mudar.
 *
 * Cada versão é carregada na primeira vez que é pedida e fica em memória
 * (cerca de 31 mil versículos por versão).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { BOOKS, findBook } = require('./books');
const { DEFAULT_VERSION, resolveVersion } = require('./versions');
const FEATURED_VERSES = require('../../data/versiculos-destaque');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'bible');
const MAX_SEARCH_RESULTS = 1000;

const loaded = new Map(); // id da versão → { books, searchIndex }

class BibleError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function loadVersion(versionId) {
  const version = resolveVersion(versionId);
  if (!version) throw new BibleError(404, `Versão "${versionId}" não disponível.`);
  if (!loaded.has(version.id)) {
    const file = path.join(DATA_DIR, `${version.id}.json.gz`);
    const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
    loaded.set(version.id, { books: data.books, searchIndex: null });
  }
  return { version, data: loaded.get(version.id) };
}

function requireBook(bookKey) {
  const book = findBook(bookKey);
  if (!book) throw new BibleError(404, `Livro "${bookKey}" não encontrado.`);
  return book;
}

function bookSummary(book, version) {
  return {
    abbrev: { pt: book.abbrev, en: book.usfm.toLowerCase() },
    name: book.name,
    group: book.group,
    testament: book.testament,
    version: version.id,
  };
}

function toVerse(book, version, chapter, [number, text]) {
  return { book: bookSummary(book, version), chapter, number, text };
}

/** GET /verses/:version/:book/:chapter */
function getChapter(versionId, bookKey, chapterNumber) {
  const { version, data } = loadVersion(versionId);
  const book = requireBook(bookKey);
  const chapter = Number.parseInt(chapterNumber, 10);
  const verses = data.books[book.usfm][chapter - 1];
  if (!verses) throw new BibleError(404, `${book.name} não tem o capítulo ${chapterNumber}.`);

  return {
    book: bookSummary(book, version),
    chapter: { number: chapter, verses: verses.length },
    verses: verses.map(([number, text]) => ({ number, text })),
    copyright: version.copyright,
  };
}

/** GET /books/:book */
function getBook(bookKey) {
  const book = requireBook(bookKey);
  const { data } = loadVersion(DEFAULT_VERSION);
  return {
    abbrev: { pt: book.abbrev, en: book.usfm.toLowerCase() },
    name: book.name,
    group: book.group,
    testament: book.testament,
    chapters: data.books[book.usfm].length,
  };
}

/** Lista todos os versículos de uma versão como [livro, capítulo, versículo]. */
function* allVerses(books) {
  for (const book of BOOKS) {
    const chapters = books[book.usfm];
    for (let c = 0; c < chapters.length; c++) {
      for (const verse of chapters[c]) yield [book, c + 1, verse];
    }
  }
}

/** GET /verses/:version/random — sorteia entre versículos que fazem sentido sozinhos. */
function getRandomVerse(versionId) {
  const { version, data } = loadVersion(versionId);
  const [bookKey, chapter, number] = FEATURED_VERSES[Math.floor(Math.random() * FEATURED_VERSES.length)];
  const book = requireBook(bookKey);
  const verse = (data.books[book.usfm][chapter - 1] || []).find(([n]) => n === number);
  if (!verse) throw new BibleError(404, `Versículo ${book.name} ${chapter}:${number} ausente em ${version.id}.`);
  return toVerse(book, version, chapter, verse);
}

/** Minúsculas e sem acentos, para a busca ignorar "Jesus"/"jesus" e "fé"/"fe". */
function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectMatches(index, matches, version) {
  const verses = [];
  let occurrence = 0;
  for (const [haystack, [book, chapter, verse]] of index) {
    if (!matches(haystack)) continue;
    occurrence++;
    if (verses.length < MAX_SEARCH_RESULTS) verses.push(toVerse(book, version, chapter, verse));
  }
  return { occurrence, version: version.id, verses };
}

/**
 * POST /verses/search — sem diferenciar maiúsculas e acentos.
 * Procura primeiro a palavra/frase inteira ("fé" não traz "fez"); se não achar nada,
 * aceita o termo como parte de uma palavra.
 */
function search(versionId, term) {
  const { version, data } = loadVersion(versionId);
  if (!data.searchIndex) {
    data.searchIndex = Array.from(allVerses(data.books), (entry) => [normalize(entry[2][1]), entry]);
  }

  const needle = normalize(term.trim()).replace(/\s+/g, ' ');
  const wholeWord = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(needle)}(?![\\p{L}\\p{N}])`, 'u');
  const exact = collectMatches(data.searchIndex, (text) => wholeWord.test(text), version);
  if (exact.occurrence > 0) return exact;
  return collectMatches(data.searchIndex, (text) => text.includes(needle), version);
}

/** Texto de um trecho (ex.: Lc 15:11-32) — usado pelo devocional. */
function getPassage(versionId, bookKey, chapterNumber, fromVerse, toVerse) {
  const chapter = getChapter(versionId, bookKey, chapterNumber);
  const verses = chapter.verses.filter((v) => v.number >= fromVerse && v.number <= toVerse);
  if (verses.length === 0) throw new BibleError(404, 'Trecho não encontrado.');
  const last = verses[verses.length - 1].number;
  return {
    reference: `${chapter.book.name} ${chapterNumber}:${fromVerse}${last !== fromVerse ? `-${last}` : ''}`,
    verses,
    text: verses.map((v) => `${v.number} ${v.text}`).join(' '),
  };
}

module.exports = { getChapter, getBook, getRandomVerse, search, getPassage, BibleError };
