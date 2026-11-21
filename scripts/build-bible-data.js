/**
 * Gera os arquivos backend/data/bible/<versao>.json.gz a partir da
 * Free Use Bible API (https://bible.helloao.org — sem chave e sem limite).
 *
 * Uso: node scripts/build-bible-data.js            (todas as versões)
 *      node scripts/build-bible-data.js blivre kjv (só algumas)
 *
 * Só precisa rodar de novo para adicionar versões; os arquivos gerados
 * ficam versionados no repositório e o servidor não acessa a internet.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { VERSIONS } = require('../backend/services/bible/versions');
const { BOOKS } = require('../backend/services/bible/books');

const OUT_DIR = path.join(__dirname, '..', 'backend', 'data', 'bible');
const API = 'https://bible.helloao.org/api';

/** Junta o conteúdo de um versículo (texto, palavras de Jesus, poesia), ignorando notas. */
function flattenVerse(content) {
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part.text === 'string') return part.text;
      if (part && part.lineBreak) return ' ';
      return '';
    })
    .join(' ')
    .replace(/¶/g, '') // marcas de parágrafo da KJV
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function convertChapter(chapter) {
  return chapter.chapter.content
    .filter((item) => item.type === 'verse')
    .map((item) => [item.number, flattenVerse(item.content)])
    .filter(([, text]) => text.length > 0);
}

async function buildVersion(version) {
  const url = `${API}/${version.source}/complete.json`;
  console.log(`⬇️  ${version.id}: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${version.id}: HTTP ${response.status}`);
  const data = await response.json();

  const sourceBooks = new Map(data.books.map((book) => [book.id, book]));
  const books = {};
  let verseCount = 0;

  for (const book of BOOKS) {
    const source = sourceBooks.get(book.usfm);
    if (!source) throw new Error(`${version.id}: livro ${book.usfm} ausente na fonte`);
    books[book.usfm] = source.chapters.map(convertChapter);
    verseCount += books[book.usfm].reduce((sum, chapter) => sum + chapter.length, 0);
  }

  const output = { id: version.id, source: version.source, generatedAt: new Date().toISOString(), books };
  const file = path.join(OUT_DIR, `${version.id}.json.gz`);
  fs.writeFileSync(file, zlib.gzipSync(JSON.stringify(output), { level: 9 }));
  const sizeMb = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
  console.log(`✅ ${version.id}: ${verseCount} versículos → ${path.relative(process.cwd(), file)} (${sizeMb} MB)`);
}

async function main() {
  const wanted = process.argv.slice(2);
  const selected = wanted.length ? VERSIONS.filter((v) => wanted.includes(v.id)) : VERSIONS;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const version of selected) await buildVersion(version);
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
