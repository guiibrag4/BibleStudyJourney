/**
 * Catálogo canônico dos 66 livros.
 *
 * - `usfm`: código padrão (GEN, JHN...), usado nos arquivos de dados e na YouVersion.
 * - `abbrev`: abreviação que o frontend já usa (herdada da antiga A Bíblia Digital).
 * - `aliases`: outras abreviações aceitas na URL (ex.: "jó", "fm", "hc").
 */
const BOOKS = [
  ['GEN', 'gn', 'Gênesis', 'Pentateuco'],
  ['EXO', 'ex', 'Êxodo', 'Pentateuco'],
  ['LEV', 'lv', 'Levítico', 'Pentateuco'],
  ['NUM', 'nm', 'Números', 'Pentateuco'],
  ['DEU', 'dt', 'Deuteronômio', 'Pentateuco'],
  ['JOS', 'js', 'Josué', 'Históricos'],
  ['JDG', 'jz', 'Juízes', 'Históricos'],
  ['RUT', 'rt', 'Rute', 'Históricos'],
  ['1SA', '1sm', '1 Samuel', 'Históricos'],
  ['2SA', '2sm', '2 Samuel', 'Históricos'],
  ['1KI', '1rs', '1 Reis', 'Históricos'],
  ['2KI', '2rs', '2 Reis', 'Históricos'],
  ['1CH', '1cr', '1 Crônicas', 'Históricos'],
  ['2CH', '2cr', '2 Crônicas', 'Históricos'],
  ['EZR', 'ed', 'Esdras', 'Históricos'],
  ['NEH', 'ne', 'Neemias', 'Históricos'],
  ['EST', 'et', 'Ester', 'Históricos'],
  ['JOB', 'job', 'Jó', 'Poéticos', ['jó']],
  ['PSA', 'sl', 'Salmos', 'Poéticos'],
  ['PRO', 'pv', 'Provérbios', 'Poéticos'],
  ['ECC', 'ec', 'Eclesiastes', 'Poéticos'],
  ['SNG', 'ct', 'Cânticos', 'Poéticos'],
  ['ISA', 'is', 'Isaías', 'Profetas maiores'],
  ['JER', 'jr', 'Jeremias', 'Profetas maiores'],
  ['LAM', 'lm', 'Lamentações', 'Profetas maiores'],
  ['EZK', 'ez', 'Ezequiel', 'Profetas maiores'],
  ['DAN', 'dn', 'Daniel', 'Profetas maiores'],
  ['HOS', 'os', 'Oseias', 'Profetas menores'],
  ['JOL', 'jl', 'Joel', 'Profetas menores'],
  ['AMO', 'am', 'Amós', 'Profetas menores'],
  ['OBA', 'ob', 'Obadias', 'Profetas menores'],
  ['JON', 'jn', 'Jonas', 'Profetas menores'],
  ['MIC', 'mq', 'Miqueias', 'Profetas menores'],
  ['NAM', 'na', 'Naum', 'Profetas menores'],
  ['HAB', 'hc', 'Habacuque', 'Profetas menores'],
  ['ZEP', 'sf', 'Sofonias', 'Profetas menores'],
  ['HAG', 'ag', 'Ageu', 'Profetas menores'],
  ['ZEC', 'zc', 'Zacarias', 'Profetas menores'],
  ['MAL', 'ml', 'Malaquias', 'Profetas menores'],
  ['MAT', 'mt', 'Mateus', 'Evangelhos'],
  ['MRK', 'mc', 'Marcos', 'Evangelhos'],
  ['LUK', 'lc', 'Lucas', 'Evangelhos'],
  ['JHN', 'jo', 'João', 'Evangelhos'],
  ['ACT', 'at', 'Atos', 'Históricos'],
  ['ROM', 'rm', 'Romanos', 'Cartas paulinas'],
  ['1CO', '1co', '1 Coríntios', 'Cartas paulinas'],
  ['2CO', '2co', '2 Coríntios', 'Cartas paulinas'],
  ['GAL', 'gl', 'Gálatas', 'Cartas paulinas'],
  ['EPH', 'ef', 'Efésios', 'Cartas paulinas'],
  ['PHP', 'fp', 'Filipenses', 'Cartas paulinas'],
  ['COL', 'cl', 'Colossenses', 'Cartas paulinas'],
  ['1TH', '1ts', '1 Tessalonicenses', 'Cartas paulinas'],
  ['2TH', '2ts', '2 Tessalonicenses', 'Cartas paulinas'],
  ['1TI', '1tm', '1 Timóteo', 'Cartas paulinas'],
  ['2TI', '2tm', '2 Timóteo', 'Cartas paulinas'],
  ['TIT', 'tt', 'Tito', 'Cartas paulinas'],
  ['PHM', 'fm', 'Filemom', 'Cartas paulinas', ['fl']],
  ['HEB', 'hb', 'Hebreus', 'Cartas gerais'],
  ['JAS', 'tg', 'Tiago', 'Cartas gerais'],
  ['1PE', '1pe', '1 Pedro', 'Cartas gerais'],
  ['2PE', '2pe', '2 Pedro', 'Cartas gerais'],
  ['1JN', '1jo', '1 João', 'Cartas gerais'],
  ['2JN', '2jo', '2 João', 'Cartas gerais'],
  ['3JN', '3jo', '3 João', 'Cartas gerais'],
  ['JUD', 'jd', 'Judas', 'Cartas gerais'],
  ['REV', 'ap', 'Apocalipse', 'Profético'],
].map(([usfm, abbrev, name, group, aliases = []], index) => ({
  usfm,
  abbrev,
  name,
  group,
  order: index + 1,
  testament: index < 39 ? 'VT' : 'NT',
  aliases,
}));

const byKey = new Map();
for (const book of BOOKS) {
  byKey.set(book.usfm.toLowerCase(), book);
  byKey.set(book.abbrev, book);
  for (const alias of book.aliases) byKey.set(alias, book);
}

/** Resolve "gn", "GEN", "jó", "fl"... para o livro canônico, ou null. */
function findBook(key) {
  if (!key) return null;
  return byKey.get(String(key).trim().toLowerCase()) || null;
}

module.exports = { BOOKS, findBook };
