/**
 * Data.gs — طبقة الوصول إلى Google Sheets.
 * كل القراءات تمر من هنا، وكل الكتابات محميّة بـ LockService.
 */

function prop_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function book_() {
  var id = prop_('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

function sheet_(name) {
  var sh = book_().getSheetByName(name);
  if (!sh) throw new ApiError('SHEET_MISSING', 'الجدول ' + name + ' غير موجود. شغّل installDatabase().');
  return sh;
}

function cache_() { return CacheService.getScriptCache(); }

/** قراءة جدول كامل كمصفوفة كائنات (مع كاش قصير). */
function readTable_(name, useCache) {
  var key = 'tbl_' + name;
  if (useCache !== false) {
    var hit = cache_().get(key);
    if (hit) { try { return JSON.parse(hit); } catch (e) { /* ignore */ } }
  }
  var values = sheet_(name).getDataRange().getValues();
  var headers = HEADERS[name];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row.join('') === '') continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = normalize_(row[c]);
    obj._row = r + 1;
    rows.push(obj);
  }
  if (useCache !== false) {
    try { cache_().put(key, JSON.stringify(rows), CACHE_TTL.SHORT); } catch (e) { /* too big */ }
  }
  return rows;
}

function normalize_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), "yyyy-MM-dd'T'HH:mm:ss");
  if (v === 'TRUE' || v === true) return true;
  if (v === 'FALSE' || v === false) return false;
  return v;
}

function tz_() { return Session.getScriptTimeZone() || 'Africa/Cairo'; }

function now_() {
  return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm:ss");
}

function appendRow_(name, obj) {
  var headers = HEADERS[name];
  var row = headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  sheet_(name).appendRow(row);
  invalidate_(name);
}

/** كتابة عدة صفوف دفعة واحدة — أسرع بكتير من appendRow في حلقة. */
function appendRows_(name, objects) {
  if (!objects.length) return;
  var headers = HEADERS[name];
  var rows = objects.map(function (obj) {
    return headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  });
  var sh = sheet_(name);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  invalidate_(name);
}

function updateCell_(name, rowIndex, column, value) {
  var col = HEADERS[name].indexOf(column) + 1;
  if (col < 1) throw new ApiError('BAD_COLUMN', 'عمود غير معروف: ' + column);
  sheet_(name).getRange(rowIndex, col).setValue(value);
  invalidate_(name);
}

/** كتابة عدة أعمدة في صف واحد دفعة واحدة. */
function updateRow_(name, rowIndex, patch) {
  var headers = HEADERS[name];
  var sh = sheet_(name);
  var current = sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  for (var k in patch) {
    var i = headers.indexOf(k);
    if (i >= 0) current[i] = patch[k];
  }
  sh.getRange(rowIndex, 1, 1, headers.length).setValues([current]);
  invalidate_(name);
}

function invalidate_(name) {
  var keys = ['tbl_' + name, 'leaderboard', 'stats', 'teams_calc'];
  try { cache_().removeAll(keys); } catch (e) { /* ignore */ }
}

function invalidateAll_() {
  var keys = ['leaderboard', 'stats', 'teams_calc'];
  for (var k in SHEETS) keys.push('tbl_' + SHEETS[k]);
  try { cache_().removeAll(keys); } catch (e) { /* ignore */ }
}

/** قفل الكتابة — يمنع تضارب أدمنين يضيفان نقاطًا في نفس اللحظة. */
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    throw new ApiError('BUSY', 'النظام مشغول بعملية أخرى. حاول مرة أخرى بعد لحظات.');
  }
  try { return fn(); } finally { lock.releaseLock(); }
}

/** رقم تسلسلي متزايد: TX-00001 */
function nextId_(name, prefix, pad) {
  var rows = readTable_(name, false);
  var max = 0;
  rows.forEach(function (r) {
    var m = String(r.id || '').match(/(\d+)\s*$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  var n = String(max + 1);
  while (n.length < pad) n = '0' + n;
  return prefix + n;
}

/* ---------- Settings ---------- */

function getSettings_() {
  var rows = readTable_(SHEETS.SETTINGS);
  var out = {};
  rows.forEach(function (r) { if (r.key) out[r.key] = r.value; });
  return out;
}

function setSetting_(key, value) {
  var rows = readTable_(SHEETS.SETTINGS, false);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].key === key) { updateCell_(SHEETS.SETTINGS, rows[i]._row, 'value', value); return; }
  }
  appendRow_(SHEETS.SETTINGS, { key: key, value: value });
}

function getLevels_() {
  var raw = getSettings_().levels;
  try {
    var parsed = JSON.parse(raw);
    if (parsed && parsed.length) return parsed.sort(function (a, b) { return a.min - b.min; });
  } catch (e) { /* fall through */ }
  return JSON.parse(DEFAULT_SETTINGS.levels);
}

function levelFor_(points, levels) {
  var lv = levels[0];
  for (var i = 0; i < levels.length; i++) if (points >= levels[i].min) lv = levels[i];
  var idx = levels.indexOf(lv);
  var next = levels[idx + 1] || null;
  return {
    code: lv.code,
    name: lv.name,
    index: idx + 1,
    min: lv.min,
    nextCode: next ? next.code : null,
    nextName: next ? next.name : null,
    nextMin: next ? next.min : null,
    remaining: next ? Math.max(0, next.min - points) : 0,
    progress: next ? Math.min(1, (points - lv.min) / Math.max(1, next.min - lv.min)) : 1
  };
}

/* ---------- الحساب من المعاملات (مصدر الحقيقة) ---------- */

/** مجموع النقاط لكل مشارك من المعاملات غير المعكوسة. */
function pointsByParticipant_() {
  var txs = readTable_(SHEETS.TRANSACTIONS);
  var sums = {}, counts = {};
  txs.forEach(function (t) {
    if (t.reversed === true) return;
    var pid = String(t.participantId || '');
    if (!pid) return;
    sums[pid] = (sums[pid] || 0) + Number(t.points || 0);
    counts[pid] = (counts[pid] || 0) + 1;
  });
  return { sums: sums, counts: counts };
}

/** لوحة الترتيب محسوبة ديناميكيًا — لا ترتيب مكتوب يدويًا. */
function buildLeaderboard_() {
  var cached = cache_().get('leaderboard');
  if (cached) { try { return JSON.parse(cached); } catch (e) { /* ignore */ } }

  var levels = getLevels_();
  var agg = pointsByParticipant_();
  var list = readTable_(SHEETS.PARTICIPANTS)
    .filter(function (p) { return String(p.status || 'ACTIVE').toUpperCase() !== 'INACTIVE'; })
    .map(function (p) {
      var pts = agg.sums[String(p.id)] || 0;
      var lv = levelFor_(pts, levels);
      return {
        id: String(p.id),
        employeeId: String(p.employeeId || p.id),
        name: p.displayName || p.name,
        teamId: p.teamId || '',
        teamName: p.teamName || '',
        avatarUrl: p.avatarUrl || '',
        points: pts,
        transactions: agg.counts[String(p.id)] || 0,
        level: lv
      };
    });

  list.sort(function (a, b) {
    if (b.points !== a.points) return b.points - a.points;
    return String(a.name).localeCompare(String(b.name), 'ar');
  });

  var rank = 0, prev = null, seen = 0;
  list.forEach(function (p) {
    seen++;
    if (p.points !== prev) { rank = seen; prev = p.points; }
    p.rank = rank;
  });

  try { cache_().put('leaderboard', JSON.stringify(list), CACHE_TTL.SHORT); } catch (e) { /* ignore */ }
  return list;
}

function buildTeams_() {
  var board = buildLeaderboard_();
  var teams = readTable_(SHEETS.TEAMS).map(function (t) {
    var members = board.filter(function (p) { return p.teamId === t.id; });
    var total = members.reduce(function (s, p) { return s + p.points; }, 0);
    return {
      id: t.id,
      name: t.name,
      code: t.code,
      description: t.description,
      color: t.color || '#1769FF',
      logoUrl: t.logoUrl || '',
      totalPoints: total,
      memberCount: members.length,
      averagePoints: members.length ? Math.round(total / members.length) : 0,
      topMembers: members.slice(0, 5)
    };
  });
  teams.sort(function (a, b) { return b.totalPoints - a.totalPoints; });
  teams.forEach(function (t, i) { t.rank = i + 1; });
  return teams;
}

/** تحديث القيم المخزّنة (cached) في الشيت — للعرض داخل Google Sheets فقط. */
function syncCachedTotals_() {
  var board = buildLeaderboard_();
  var participants = readTable_(SHEETS.PARTICIPANTS, false);
  var byId = {};
  board.forEach(function (b) { byId[b.id] = b; });

  var sh = sheet_(SHEETS.PARTICIPANTS);
  var headers = HEADERS.Participants;
  var colPoints = headers.indexOf('totalPoints') + 1;
  var colLevel = headers.indexOf('level') + 1;
  participants.forEach(function (p) {
    var b = byId[String(p.id)];
    if (!b) return;
    if (Number(p.totalPoints) !== b.points) sh.getRange(p._row, colPoints).setValue(b.points);
    if (p.level !== b.level.code) sh.getRange(p._row, colLevel).setValue(b.level.code);
  });

  var teams = buildTeams_();
  var tsh = sheet_(SHEETS.TEAMS);
  var trows = readTable_(SHEETS.TEAMS, false);
  var tById = {};
  teams.forEach(function (t) { tById[t.id] = t; });
  var cP = HEADERS.Teams.indexOf('totalPoints') + 1;
  var cM = HEADERS.Teams.indexOf('memberCount') + 1;
  trows.forEach(function (t) {
    var calc = tById[t.id];
    if (!calc) return;
    tsh.getRange(t._row, cP).setValue(calc.totalPoints);
    tsh.getRange(t._row, cM).setValue(calc.memberCount);
  });
  invalidateAll_();
}

function logActivity_(action, adminId, target, details) {
  try {
    appendRow_(SHEETS.ACTIVITY, {
      id: nextId_(SHEETS.ACTIVITY, 'LOG-', 6),
      action: action,
      adminId: adminId || '',
      targetParticipantId: target || '',
      details: typeof details === 'string' ? details : JSON.stringify(details || {}),
      createdAt: now_()
    });
  } catch (e) { /* السجل لا يجب أن يُفشل العملية */ }
}
