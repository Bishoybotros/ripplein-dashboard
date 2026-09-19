// محاكاة خدمات Google Apps Script لاختبار المنطق في Node.
const vm = require('vm');
const fs = require('fs');

class Range {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sheet.cell(this.r + i, this.c + j));
      out.push(row);
    }
    return out;
  }
  setValues(vals) {
    vals.forEach((row, i) => row.forEach((v, j) => this.sheet.set(this.r + i, this.c + j, v)));
    return this;
  }
  setValue(v) { this.sheet.set(this.r, this.c, v); return this; }
  setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; }
}

class Sheet {
  constructor(name) { this.name = name; this.data = []; }
  cell(r, c) { return (this.data[r - 1] || [])[c - 1] ?? ''; }
  set(r, c, v) {
    while (this.data.length < r) this.data.push([]);
    const row = this.data[r - 1];
    while (row.length < c) row.push('');
    row[c - 1] = v;
  }
  getDataRange() {
    const rows = this.data.length || 1;
    const cols = Math.max(1, ...this.data.map((r) => r.length));
    return new Range(this, 1, 1, rows, cols);
  }
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
  appendRow(vals) { this.data.push(vals.slice()); }
  getLastRow() { return this.data.length; }
  getMaxColumns() { return Math.max(1, ...this.data.map((r) => r.length), 20); }
  deleteColumns() { }
  deleteRows(start, count) { this.data.splice(start - 1, count); }
  setFrozenRows() { }
}

class Book {
  constructor() { this.sheets = {}; }
  getSheetByName(n) { return this.sheets[n] || null; }
  insertSheet(n) { this.sheets[n] = new Sheet(n); return this.sheets[n]; }
  getSheets() { return Object.values(this.sheets); }
  deleteSheet(s) { delete this.sheets[s.name]; }
}

const book = new Book();
const store = {};
const cache = {};
let uuid = 0;

const ctx = {
  console,
  SpreadsheetApp: { getActive: () => book, openById: () => book },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (k) => (k in store ? store[k] : null),
      setProperty: (k, v) => { store[k] = v; },
    }),
  },
  CacheService: {
    getScriptCache: () => ({
      get: (k) => (k in cache ? cache[k] : null),
      put: (k, v) => { cache[k] = v; },
      remove: (k) => { delete cache[k]; },
      removeAll: (ks) => ks.forEach((k) => delete cache[k]),
    }),
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => { } }) },
  Utilities: {
    getUuid: () => `uuid-${++uuid}-abcdef01-2345-6789-abcdef012345`,
    formatDate: (d) => new Date(d).toISOString().slice(0, 19),
    formatString: (f, n) => String(n),
  },
  Session: { getScriptTimeZone: () => 'Africa/Cairo' },
  Logger: { log: (m) => console.log('[log]', m) },
  ContentService: {
    MimeType: { JSON: 'json' },
    createTextOutput: (t) => ({ _t: t, setMimeType() { return this; }, getContent() { return this._t; } }),
  },
};
vm.createContext(ctx);
['Config.gs', 'Data.gs', 'Code.gs', 'Setup.gs'].forEach((f) => {
  vm.runInContext(fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
});
module.exports = { ctx, store, cache };
