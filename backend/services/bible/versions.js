/**
 * Versões bíblicas servidas localmente (licença aberta ou domínio público).
 *
 * `source` é o id na Free Use Bible API (https://bible.helloao.org), usado
 * apenas pelo script scripts/build-bible-data.js para gerar os arquivos.
 * `legacy` lista as versões antigas da A Bíblia Digital redirecionadas para esta.
 */
const VERSIONS = [
  {
    id: 'blivre',
    name: 'Bíblia Livre',
    language: 'pt',
    source: 'por_blj',
    license: 'CC BY 4.0',
    copyright: 'Bíblia Livre © 2018 Diego Santos, Mario Sérgio e Marco Teles — CC BY 4.0',
    legacy: ['nvi', 'acf', 'ra', 'arc', 'aa'],
  },
  {
    id: 'nbv',
    name: 'Nova Bíblia Viva (Biblica Open)',
    language: 'pt',
    source: 'por_onbv',
    license: 'CC BY-SA 4.0',
    copyright: 'Biblica® Open Nova Bíblia Viva © 2007, 2010 Biblica, Inc. — CC BY-SA 4.0',
    legacy: [],
  },
  {
    id: 'bpm',
    name: 'Bíblia Portuguesa Mundial',
    language: 'pt',
    source: 'por_bsl',
    license: 'Domínio público',
    copyright: 'Bíblia Portuguesa Mundial — domínio público',
    legacy: [],
  },
  {
    id: 'kjv',
    name: 'King James Version',
    language: 'en',
    source: 'eng_kjv',
    license: 'Domínio público',
    copyright: 'King James Version — domínio público',
    legacy: [],
  },
  {
    id: 'bsb',
    name: 'Berean Standard Bible',
    language: 'en',
    source: 'BSB',
    license: 'Domínio público',
    copyright: 'Berean Standard Bible — domínio público',
    legacy: ['bbe'],
  },
  {
    id: 'rvr',
    name: 'Reina-Valera 1909',
    language: 'es',
    source: 'spa_r09',
    license: 'Domínio público',
    copyright: 'Santa Biblia Reina-Valera 1909 — domínio público',
    legacy: ['apee'],
  },
];

const DEFAULT_VERSION = 'blivre';

const byId = new Map();
for (const version of VERSIONS) {
  byId.set(version.id, version);
  for (const legacy of version.legacy) byId.set(legacy, version);
}

/** Resolve o id pedido (inclusive os antigos, como "nvi") para uma versão disponível. */
function resolveVersion(id) {
  return byId.get(String(id || DEFAULT_VERSION).trim().toLowerCase()) || null;
}

module.exports = { VERSIONS, DEFAULT_VERSION, resolveVersion };
