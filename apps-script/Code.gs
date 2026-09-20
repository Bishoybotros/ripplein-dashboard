/**
 * Code.gs — نقطة الدخول للـ Web App (doGet / doPost) + المصادقة + كل الـ actions.
 *
 * الاستجابة دائمًا:
 *   { ok: true,  data: ... }
 *   { ok: false, error: { code, message } }
 */

function ApiError(code, message) { this.code = code; this.message = message; }
ApiError.prototype = Object.create(Error.prototype);

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) { return json_({ ok: true, data: data, v: API_VERSION }); }

function fail_(e) {
  var code = e && e.code ? e.code : 'INTERNAL';
  var msg = e && e.message ? e.message : 'خطأ غير متوقع';
  if (code === 'INTERNAL') console.error(e);
  return json_({ ok: false, error: { code: code, message: msg } });
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    return ok_(route_(String(p.action || 'ping'), p, 'GET'));
  } catch (err) { return fail_(err); }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); }
      catch (parseErr) { throw new ApiError('BAD_JSON', 'صيغة الطلب غير صحيحة.'); }
    }
    if (e && e.parameter) for (var k in e.parameter) if (body[k] === undefined) body[k] = e.parameter[k];
    return ok_(route_(String(body.action || ''), body, 'POST'));
  } catch (err) { return fail_(err); }
}

/* ============================ ROUTER ============================ */

function route_(action, p, method) {
  switch (action) {
    /* ---- عام (بدون توكن) ---- */
    case 'ping': return { pong: true, time: now_() };
    case 'getBootstrap': return handleBootstrap_();
    case 'getSettings': return publicSettings_();
    case 'getLeaderboard': return handleLeaderboard_(p);
    case 'getTeams': return { teams: buildTeams_() };
    case 'getTeam': return handleTeam_(p);
    case 'getStats': return handleStats_();
    case 'getCategories': return { categories: activeCategories_() };

    /* ---- يتطلب توكن ---- */
    case 'getParticipant': return handleParticipant_(p);
    case 'getTransactions': return handleTransactions_(p);
    case 'getMyButterfly': return handleMyButterfly_(p);

    /* ---- أدمن ---- */
    case 'adminGetParticipants': return { participants: adminParticipants_(auth_(p, 'admin')) };
    case 'adminGetTransactions': return adminTransactions_(p);
    case 'adminGetActivity': return { activity: adminActivity_(p) };
    case 'adminGetButterfly': return { moments: adminButterfly_(p) };

    /* ---- كتابة (POST فقط) ---- */
    case 'login': return post_(method) && handleLogin_(p);
    case 'adminLogin': return post_(method) && handleAdminLogin_(p);
    case 'logout': return post_(method) && handleLogout_(p);
    case 'addTransaction': return post_(method) && handleAddTransaction_(p);
    case 'addTransactionBulk': return post_(method) && handleAddTransactionBulk_(p);
    case 'reverseTransaction': return post_(method) && handleReverse_(p);
    case 'submitButterflyMoment': return post_(method) && handleButterflySubmit_(p);
    case 'updateParticipant': return post_(method) && handleUpdateParticipant_(p);
    case 'createParticipant': return post_(method) && handleCreateParticipant_(p);
    case 'createTeam': return post_(method) && handleCreateTeam_(p);
    case 'updateSettings': return post_(method) && handleUpdateSettings_(p);
    case 'recalculate': return post_(method) && handleRecalculate_(p);

    default:
      throw new ApiError('UNKNOWN_ACTION', 'هذا الإجراء غير معروف: ' + action);
  }
}

function post_(method) {
  if (method !== 'POST') throw new ApiError('METHOD', 'هذا الإجراء يحتاج طلب POST.');
  return true;
}

/* ============================ AUTH ============================ */

function makeToken_(role, sub, displayName) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().slice(0, 8);
  var session = { role: role, sub: sub, name: displayName, issuedAt: now_() };
  cache_().put('tok_' + token, JSON.stringify(session), CACHE_TTL.SESSION);
  return { token: token, session: session, expiresInSeconds: CACHE_TTL.SESSION };
}

/** يتحقق من التوكن ويعيد الجلسة. role اختياري: 'admin' أو 'participant'. */
function auth_(p, role) {
  var token = p.token || '';
  if (!token) throw new ApiError('NO_TOKEN', 'يجب تسجيل الدخول أولًا.');
  var raw = cache_().get('tok_' + token);
  if (!raw) throw new ApiError('SESSION_EXPIRED', 'انتهت الجلسة. سجّل الدخول مرة أخرى.');
  var session = JSON.parse(raw);
  if (role && session.role !== role) throw new ApiError('FORBIDDEN', 'لا تملك صلاحية لهذا الإجراء.');
  cache_().put('tok_' + token, raw, CACHE_TTL.SESSION); // تمديد الجلسة
  session.token = token;
  return session;
}

function handleLogin_(p) {
  var employeeId = String(p.employeeId || '').trim().toUpperCase();
  var pin = String(p.pin || '').trim();
  if (!employeeId || !pin) throw new ApiError('BAD_INPUT', 'أدخل رقم الموظف والرقم السري.');

  var found = null;
  readTable_(SHEETS.PARTICIPANTS).forEach(function (r) {
    if (String(r.employeeId || r.id).toUpperCase() === employeeId) found = r;
  });
  if (!found) throw new ApiError('BAD_CREDENTIALS', 'رقم الموظف أو الرقم السري غير صحيح.');
  if (String(found.pin) !== pin) throw new ApiError('BAD_CREDENTIALS', 'رقم الموظف أو الرقم السري غير صحيح.');
  if (String(found.status || 'ACTIVE').toUpperCase() === 'INACTIVE') {
    throw new ApiError('INACTIVE', 'هذا الحساب غير مفعّل. كلّم فريق التنظيم.');
  }

  var t = makeToken_('participant', String(found.id), found.displayName || found.name);
  return { token: t.token, role: 'participant', employeeId: String(found.employeeId || found.id), name: t.session.name };
}

function handleAdminLogin_(p) {
  var username = String(p.username || '').trim();
  var secret = String(p.secret || '');
  if (!username || !secret) throw new ApiError('BAD_INPUT', 'أدخل اسم المستخدم وكلمة السر.');

  var admin = null;
  readTable_(SHEETS.ADMINS).forEach(function (r) {
    if (String(r.username).toLowerCase() === username.toLowerCase()) admin = r;
  });
  if (!admin || admin.active === false) throw new ApiError('BAD_CREDENTIALS', 'بيانات الدخول غير صحيحة.');

  var personal = prop_('ADMIN_SECRET_' + String(admin.username).toUpperCase());
  var shared = prop_('ADMIN_SECRET');
  var expected = personal || shared;
  if (!expected) throw new ApiError('NOT_CONFIGURED', 'لم يتم ضبط ADMIN_SECRET في إعدادات السكربت.');
  if (secret !== expected) throw new ApiError('BAD_CREDENTIALS', 'بيانات الدخول غير صحيحة.');

  var t = makeToken_('admin', String(admin.id), admin.displayName || admin.username);
  logActivity_('ADMIN_LOGIN', admin.id, '', { username: admin.username });
  return { token: t.token, role: 'admin', adminId: String(admin.id), name: t.session.name, adminRole: admin.role };
}

function handleLogout_(p) {
  if (p.token) cache_().remove('tok_' + p.token);
  return { loggedOut: true };
}

/* ============================ READ HANDLERS ============================ */

function publicSettings_() {
  var s = getSettings_();
  return {
    conferenceName: s.conferenceName,
    conferenceYear: s.conferenceYear,
    companyName: s.companyName,
    currentDay: Number(s.currentDay || 1),
    isScoringOpen: String(s.isScoringOpen) !== 'false',
    butterflyOpen: String(s.butterflyOpen) !== 'false',
    leaderboardRefreshSeconds: Number(s.leaderboardRefreshSeconds || 8),
    maxTop10: Number(s.maxTop10 || 10),
    levels: getLevels_()
  };
}

/** استدعاء واحد يجلب كل ما تحتاجه الواجهة عند الإقلاع. */
function handleBootstrap_() {
  return {
    settings: publicSettings_(),
    categories: activeCategories_(),
    teams: buildTeams_(),
    stats: handleStats_()
  };
}

function activeCategories_() {
  return readTable_(SHEETS.CATEGORIES)
    .filter(function (c) { return c.active !== false; })
    .map(function (c) {
      return {
        id: c.id, name: c.name, nameAr: c.nameAr || c.name, description: c.description,
        defaultPoints: Number(c.defaultPoints || 0), icon: c.icon || '🌊', type: c.type || 'BONUS'
      };
    });
}

function handleLeaderboard_(p) {
  var board = buildLeaderboard_();
  var limit = Number(p.limit || 0);
  return { leaderboard: limit > 0 ? board.slice(0, limit) : board, total: board.length };
}

function handleTeam_(p) {
  var id = String(p.id || '');
  var team = null;
  buildTeams_().forEach(function (t) { if (t.id === id) team = t; });
  if (!team) throw new ApiError('NOT_FOUND', 'هذا الفريق غير موجود.');
  team.members = buildLeaderboard_().filter(function (m) { return m.teamId === id; });
  return { team: team };
}

function handleStats_() {
  var cached = cache_().get('stats');
  if (cached) { try { return JSON.parse(cached); } catch (e) { /* ignore */ } }
  var board = buildLeaderboard_();
  var teams = buildTeams_();
  var txs = readTable_(SHEETS.TRANSACTIONS);
  var valid = txs.filter(function (t) { return t.reversed !== true; });
  var stats = {
    participants: board.length,
    totalPoints: board.reduce(function (s, p) { return s + p.points; }, 0),
    transactions: valid.length,
    reversedTransactions: txs.length - valid.length,
    activeTeams: teams.filter(function (t) { return t.memberCount > 0; }).length,
    topParticipant: board[0] || null,
    topTeam: teams[0] || null,
    lastTransactionAt: valid.length ? valid[valid.length - 1].createdAt : null
  };
  try { cache_().put('stats', JSON.stringify(stats), CACHE_TTL.SHORT); } catch (e) { /* ignore */ }
  return stats;
}

/** يمنع رؤية بيانات شخص آخر بمجرد تغيير الـ id في الرابط. */
function handleParticipant_(p) {
  var session = auth_(p);
  var wanted = String(p.id || '').toUpperCase();
  var board = buildLeaderboard_();

  var record = null;
  readTable_(SHEETS.PARTICIPANTS).forEach(function (r) {
    if (String(r.id).toUpperCase() === wanted || String(r.employeeId).toUpperCase() === wanted) record = r;
  });
  if (!record && session.role === 'participant') {
    readTable_(SHEETS.PARTICIPANTS).forEach(function (r) { if (String(r.id) === session.sub) record = r; });
  }
  if (!record) throw new ApiError('NOT_FOUND', 'هذا المشارك غير موجود.');
  if (session.role !== 'admin' && String(record.id) !== String(session.sub)) {
    throw new ApiError('FORBIDDEN', 'تقدر تشوف ملفك أنت فقط.');
  }

  var row = null;
  board.forEach(function (b) { if (b.id === String(record.id)) row = b; });
  if (!row) throw new ApiError('NOT_FOUND', 'هذا المشارك غير مفعّل.');

  var mine = readTable_(SHEETS.TRANSACTIONS).filter(function (t) {
    return String(t.participantId) === String(record.id);
  });
  var valid = mine.filter(function (t) { return t.reversed !== true; });

  return {
    participant: {
      id: row.id, employeeId: row.employeeId, name: row.name,
      teamId: row.teamId, teamName: row.teamName, avatarUrl: row.avatarUrl,
      points: row.points, rank: row.rank, level: row.level,
      transactionCount: valid.length,
      totalParticipants: board.length
    },
    recent: valid.slice(-12).reverse(),
    story: buildStory_(valid),
    badges: buildBadges_(valid, row)
  };
}

function handleTransactions_(p) {
  var session = auth_(p);
  var pid = String(p.participantId || session.sub);
  if (session.role !== 'admin' && pid !== String(session.sub)) {
    throw new ApiError('FORBIDDEN', 'تقدر تشوف سجلك أنت فقط.');
  }
  var list = readTable_(SHEETS.TRANSACTIONS).filter(function (t) {
    return String(t.participantId) === pid;
  }).reverse();
  return { transactions: list };
}

/* ============================ WRITE HANDLERS ============================ */

function handleAddTransaction_(p) {
  var session = auth_(p, 'admin');
  var settings = getSettings_();
  if (String(settings.isScoringOpen) === 'false') {
    throw new ApiError('SCORING_CLOSED', 'تسجيل النقاط مقفول حاليًا من الإعدادات.');
  }

  var wanted = String(p.participantId || '').trim().toUpperCase();
  var categoryId = String(p.category || '').trim().toUpperCase();
  var points = Number(p.points);
  var reason = String(p.reason || '').trim();

  if (!wanted) throw new ApiError('BAD_INPUT', 'اختر المشارك أولًا.');
  if (!isFinite(points) || points === 0) throw new ApiError('BAD_POINTS', 'عدد النقاط غير صحيح.');
  if (Math.abs(points) > 5000) throw new ApiError('BAD_POINTS', 'الحد الأقصى للمعاملة الواحدة هو 5000 نقطة.');
  if (reason.length > 300) throw new ApiError('BAD_INPUT', 'السبب طويل جدًا.');

  var category = null;
  activeCategories_().forEach(function (c) { if (c.id === categoryId) category = c; });
  if (!category) throw new ApiError('BAD_CATEGORY', 'هذا التصنيف غير موجود أو غير مفعّل.');

  var participant = null;
  readTable_(SHEETS.PARTICIPANTS).forEach(function (r) {
    if (String(r.id).toUpperCase() === wanted || String(r.employeeId).toUpperCase() === wanted) participant = r;
  });
  if (!participant) throw new ApiError('NOT_FOUND', 'هذا المشارك غير موجود.');

  var levels = getLevels_();
  var before = 0;
  buildLeaderboard_().forEach(function (b) { if (b.id === String(participant.id)) before = b.points; });
  var levelBefore = levelFor_(before, levels);

  var tx = withLock_(function () {
    var record = {
      id: nextId_(SHEETS.TRANSACTIONS, 'TX-', 5),
      participantId: String(participant.id),
      employeeId: String(participant.employeeId || participant.id),
      participantName: participant.displayName || participant.name,
      teamId: participant.teamId || '',
      teamName: participant.teamName || '',
      type: points < 0 ? 'PENALTY' : (category.type || 'BONUS'),
      category: category.id,
      points: points,
      reason: reason,
      adminId: session.sub,
      createdAt: now_(),
      reversed: false,
      reversedAt: '',
      reversedBy: '',
      metadata: JSON.stringify({ categoryName: category.nameAr, day: getSettings_().currentDay })
    };
    appendRow_(SHEETS.TRANSACTIONS, record);
    invalidateAll_();
    return record;
  });

  logActivity_('ADD_TRANSACTION', session.sub, tx.participantId,
    { tx: tx.id, points: points, category: category.id });

  var board = buildLeaderboard_();
  var after = null;
  board.forEach(function (b) { if (b.id === String(participant.id)) after = b; });
  var levelAfter = levelFor_(after ? after.points : before, levels);

  return {
    transaction: tx,
    participant: after,
    levelUp: levelAfter.code !== levelBefore.code && (after ? after.points : 0) > before ? levelAfter : null,
    enteredTop10: after && after.rank <= 10 ? after.rank : null
  };
}

/**
 * تسجيل نفس التأثير لأكثر من مشارك في عملية واحدة.
 * معاملة مستقلة لكل شخص (السجل يفضل دقيق)، لكن كتابة واحدة وقفل واحد.
 */
function handleAddTransactionBulk_(p) {
  var session = auth_(p, 'admin');
  if (String(getSettings_().isScoringOpen) === 'false') {
    throw new ApiError('SCORING_CLOSED', 'تسجيل النقاط مقفول حاليًا من الإعدادات.');
  }

  var ids = p.participantIds;
  if (typeof ids === 'string') { try { ids = JSON.parse(ids); } catch (e) { ids = String(ids).split(','); } }
  if (!ids || !ids.length) throw new ApiError('BAD_INPUT', 'اختر مشاركًا واحدًا على الأقل.');
  if (ids.length > 200) throw new ApiError('TOO_MANY', 'الحد الأقصى 200 مشارك في العملية الواحدة.');

  var points = Number(p.points);
  var reason = String(p.reason || '').trim();
  var categoryId = String(p.category || '').trim().toUpperCase();
  if (!isFinite(points) || points === 0) throw new ApiError('BAD_POINTS', 'عدد النقاط غير صحيح.');
  if (Math.abs(points) > 5000) throw new ApiError('BAD_POINTS', 'الحد الأقصى للمعاملة الواحدة هو 5000 نقطة.');
  if (reason.length > 300) throw new ApiError('BAD_INPUT', 'السبب طويل جدًا.');

  var category = null;
  activeCategories_().forEach(function (c) { if (c.id === categoryId) category = c; });
  if (!category) throw new ApiError('BAD_CATEGORY', 'هذا التصنيف غير موجود أو غير مفعّل.');

  // فهرس المشاركين مرة واحدة + تنقية التكرار
  var index = {};
  readTable_(SHEETS.PARTICIPANTS).forEach(function (r) {
    index[String(r.id).toUpperCase()] = r;
    index[String(r.employeeId || r.id).toUpperCase()] = r;
  });

  var levels = getLevels_();
  var beforeById = {};
  buildLeaderboard_().forEach(function (b) { beforeById[b.id] = b.points; });

  var targets = [], skipped = [], seen = {};
  ids.forEach(function (raw) {
    var key = String(raw || '').trim().toUpperCase();
    if (!key) return;
    var found = index[key];
    if (!found) { skipped.push({ id: key, reason: 'غير موجود' }); return; }
    if (String(found.status || 'ACTIVE').toUpperCase() === 'INACTIVE') {
      skipped.push({ id: key, reason: 'موقوف' });
      return;
    }
    if (seen[String(found.id)]) return;
    seen[String(found.id)] = true;
    targets.push(found);
  });
  if (!targets.length) throw new ApiError('NOT_FOUND', 'مفيش أي مشارك صالح في التحديد.');

  var created = withLock_(function () {
    var start = 0;
    readTable_(SHEETS.TRANSACTIONS, false).forEach(function (t) {
      var m = String(t.id || '').match(/(\d+)\s*$/);
      if (m) start = Math.max(start, parseInt(m[1], 10));
    });
    var day = getSettings_().currentDay;
    var stamp = now_();

    var rows = targets.map(function (participant, i) {
      var n = String(start + i + 1);
      while (n.length < 5) n = '0' + n;
      return {
        id: 'TX-' + n,
        participantId: String(participant.id),
        employeeId: String(participant.employeeId || participant.id),
        participantName: participant.displayName || participant.name,
        teamId: participant.teamId || '',
        teamName: participant.teamName || '',
        type: points < 0 ? 'PENALTY' : (category.type || 'BONUS'),
        category: category.id,
        points: points,
        reason: reason,
        adminId: session.sub,
        createdAt: stamp,
        reversed: false,
        reversedAt: '',
        reversedBy: '',
        metadata: JSON.stringify({ categoryName: category.nameAr, day: day, batch: true })
      };
    });
    appendRows_(SHEETS.TRANSACTIONS, rows);
    invalidateAll_();
    return rows;
  });

  logActivity_('ADD_TRANSACTION_BULK', session.sub, '',
    { count: created.length, points: points, category: category.id, ids: created.map(function (r) { return r.employeeId; }) });

  // مين صعد مستوى ومين دخل Top 10 بعد العملية
  var board = buildLeaderboard_();
  var levelUps = [], enteredTop10 = [];
  targets.forEach(function (t) {
    var id = String(t.id);
    var after = null;
    board.forEach(function (b) { if (b.id === id) after = b; });
    if (!after) return;
    var before = beforeById[id] || 0;
    if (after.points <= before) return;
    if (levelFor_(after.points, levels).code !== levelFor_(before, levels).code) {
      levelUps.push({ name: after.name, employeeId: after.employeeId, level: after.level });
    }
    if (after.rank <= 10) enteredTop10.push({ name: after.name, rank: after.rank });
  });

  return {
    created: created.length,
    pointsEach: points,
    totalPoints: points * created.length,
    category: category.id,
    transactions: created,
    skipped: skipped,
    levelUps: levelUps,
    enteredTop10: enteredTop10
  };
}

function handleReverse_(p) {
  var session = auth_(p, 'admin');
  var id = String(p.transactionId || p.id || '').trim();
  if (!id) throw new ApiError('BAD_INPUT', 'حدّد المعاملة المطلوب التراجع عنها.');

  var result = withLock_(function () {
    var rows = readTable_(SHEETS.TRANSACTIONS, false);
    var target = null;
    rows.forEach(function (t) { if (String(t.id) === id) target = t; });
    if (!target) throw new ApiError('NOT_FOUND', 'هذه المعاملة غير موجودة.');
    if (target.reversed === true) throw new ApiError('ALREADY_REVERSED', 'تم التراجع عن هذه المعاملة من قبل.');

    updateRow_(SHEETS.TRANSACTIONS, target._row, {
      reversed: true, reversedAt: now_(), reversedBy: session.sub
    });
    invalidateAll_();
    return target;
  });

  logActivity_('REVERSE_TRANSACTION', session.sub, result.participantId, { tx: id, points: result.points });
  return { reversed: true, transactionId: id, participantId: result.participantId, points: result.points };
}

function handleButterflySubmit_(p) {
  var session = auth_(p, 'participant');
  var answer = String(p.answer || '').trim();
  if (!answer) throw new ApiError('BAD_INPUT', 'اكتب إجابتك أولًا.');
  if (answer.length > 1000) throw new ApiError('BAD_INPUT', 'الإجابة طويلة جدًا (الحد 1000 حرف).');
  if (String(getSettings_().butterflyOpen) === 'false') {
    throw new ApiError('CLOSED', 'تسجيل لحظة الفراشة مقفول حاليًا.');
  }

  var visibility = String(p.visibility || 'private').toLowerCase() === 'public' ? 'public' : 'private';
  var participant = null;
  readTable_(SHEETS.PARTICIPANTS).forEach(function (r) { if (String(r.id) === String(session.sub)) participant = r; });
  if (!participant) throw new ApiError('NOT_FOUND', 'المشارك غير موجود.');

  var record = withLock_(function () {
    var rows = readTable_(SHEETS.BUTTERFLY, false);
    var existing = null;
    rows.forEach(function (b) { if (String(b.participantId) === String(session.sub)) existing = b; });
    var payload = {
      id: existing ? existing.id : nextId_(SHEETS.BUTTERFLY, 'BM-', 5),
      participantId: String(session.sub),
      employeeId: String(participant.employeeId || participant.id),
      answer: answer,
      createdAt: now_(),
      visibility: visibility
    };
    if (existing) updateRow_(SHEETS.BUTTERFLY, existing._row, payload);
    else appendRow_(SHEETS.BUTTERFLY, payload);
    return payload;
  });

  return { moment: record };
}

function handleMyButterfly_(p) {
  var session = auth_(p, 'participant');
  var mine = null;
  readTable_(SHEETS.BUTTERFLY).forEach(function (b) {
    if (String(b.participantId) === String(session.sub)) mine = b;
  });
  return { moment: mine ? { id: mine.id, answer: mine.answer, createdAt: mine.createdAt, visibility: mine.visibility } : null };
}

function handleCreateParticipant_(p) {
  var session = auth_(p, 'admin');
  var name = String(p.name || '').trim();
  if (!name) throw new ApiError('BAD_INPUT', 'اكتب اسم المشارك.');

  var record = withLock_(function () {
    var rows = readTable_(SHEETS.PARTICIPANTS, false);
    var employeeId = String(p.employeeId || '').trim().toUpperCase() || nextId_(SHEETS.PARTICIPANTS, 'RPL-', 4);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].employeeId).toUpperCase() === employeeId) {
        throw new ApiError('DUPLICATE', 'رقم الموظف ' + employeeId + ' مستخدم بالفعل.');
      }
    }
    var team = null;
    readTable_(SHEETS.TEAMS).forEach(function (t) { if (t.id === String(p.teamId || '')) team = t; });
    var payload = {
      id: employeeId,
      employeeId: employeeId,
      name: name,
      displayName: String(p.displayName || name).trim(),
      teamId: team ? team.id : '',
      teamName: team ? team.name : '',
      avatarUrl: String(p.avatarUrl || ''),
      phone: String(p.phone || ''),
      email: String(p.email || ''),
      pin: String(p.pin || Math.floor(1000 + Math.random() * 9000)),
      totalPoints: 0,
      level: getLevels_()[0].code,
      status: 'ACTIVE',
      createdAt: now_(),
      updatedAt: now_()
    };
    appendRow_(SHEETS.PARTICIPANTS, payload);
    invalidateAll_();
    return payload;
  });

  logActivity_('CREATE_PARTICIPANT', session.sub, record.id, { name: record.name });
  return { participant: record };
}

function handleUpdateParticipant_(p) {
  var session = auth_(p, 'admin');
  var wanted = String(p.participantId || p.id || '').toUpperCase();
  var allowed = ['name', 'displayName', 'teamId', 'avatarUrl', 'phone', 'email', 'pin', 'status'];

  var updated = withLock_(function () {
    var rows = readTable_(SHEETS.PARTICIPANTS, false);
    var target = null;
    rows.forEach(function (r) {
      if (String(r.id).toUpperCase() === wanted || String(r.employeeId).toUpperCase() === wanted) target = r;
    });
    if (!target) throw new ApiError('NOT_FOUND', 'هذا المشارك غير موجود.');

    var patch = { updatedAt: now_() };
    allowed.forEach(function (k) { if (p[k] !== undefined) patch[k] = String(p[k]); });
    if (patch.teamId !== undefined) {
      var team = null;
      readTable_(SHEETS.TEAMS).forEach(function (t) { if (t.id === patch.teamId) team = t; });
      patch.teamName = team ? team.name : '';
    }
    updateRow_(SHEETS.PARTICIPANTS, target._row, patch);

    // اسم الفريق مخزّن داخل المعاملات القديمة أيضًا — نبقيه كما هو للحفاظ على سجل تاريخي دقيق.
    invalidateAll_();
    return Object.assign({}, target, patch);
  });

  logActivity_('UPDATE_PARTICIPANT', session.sub, updated.id, { fields: Object.keys(p) });
  return { participant: { id: updated.id, employeeId: updated.employeeId, name: updated.name, status: updated.status } };
}

function handleCreateTeam_(p) {
  var session = auth_(p, 'admin');
  var name = String(p.name || '').trim();
  if (!name) throw new ApiError('BAD_INPUT', 'اكتب اسم الفريق.');
  var record = withLock_(function () {
    var payload = {
      id: nextId_(SHEETS.TEAMS, 'TEAM-', 2),
      name: name,
      code: String(p.code || '').trim(),
      description: String(p.description || ''),
      logoUrl: String(p.logoUrl || ''),
      color: String(p.color || '#1769FF'),
      totalPoints: 0,
      memberCount: 0,
      createdAt: now_()
    };
    appendRow_(SHEETS.TEAMS, payload);
    invalidateAll_();
    return payload;
  });
  logActivity_('CREATE_TEAM', session.sub, '', { team: record.id });
  return { team: record };
}

function handleUpdateSettings_(p) {
  var session = auth_(p, 'admin');
  var patch = p.settings || {};
  var allowed = ['conferenceName', 'conferenceYear', 'companyName', 'currentDay',
    'isScoringOpen', 'butterflyOpen', 'leaderboardRefreshSeconds', 'maxTop10', 'levels'];
  withLock_(function () {
    allowed.forEach(function (k) {
      if (patch[k] === undefined) return;
      var value = k === 'levels' && typeof patch[k] !== 'string' ? JSON.stringify(patch[k]) : String(patch[k]);
      setSetting_(k, value);
    });
    invalidateAll_();
  });
  logActivity_('UPDATE_SETTINGS', session.sub, '', { keys: Object.keys(patch) });
  return publicSettings_();
}

function handleRecalculate_(p) {
  var session = auth_(p, 'admin');
  withLock_(function () { invalidateAll_(); syncCachedTotals_(); });
  logActivity_('RECALCULATE', session.sub, '', {});
  return { done: true, stats: handleStats_() };
}

/* ============================ ADMIN READS ============================ */

function adminParticipants_() {
  var board = buildLeaderboard_();
  var byId = {};
  board.forEach(function (b) { byId[b.id] = b; });
  return readTable_(SHEETS.PARTICIPANTS).map(function (r) {
    var b = byId[String(r.id)];
    return {
      id: String(r.id), employeeId: String(r.employeeId || r.id), name: r.name,
      displayName: r.displayName || r.name, teamId: r.teamId, teamName: r.teamName,
      phone: r.phone, email: r.email, pin: String(r.pin), status: r.status || 'ACTIVE',
      avatarUrl: r.avatarUrl || '',
      points: b ? b.points : 0, rank: b ? b.rank : null,
      level: b ? b.level : levelFor_(0, getLevels_())
    };
  });
}

function adminTransactions_(p) {
  auth_(p, 'admin');
  var list = readTable_(SHEETS.TRANSACTIONS).slice().reverse();
  if (p.participantId) {
    var pid = String(p.participantId).toUpperCase();
    list = list.filter(function (t) {
      return String(t.participantId).toUpperCase() === pid || String(t.employeeId).toUpperCase() === pid;
    });
  }
  if (p.teamId) list = list.filter(function (t) { return String(t.teamId) === String(p.teamId); });
  if (p.category) list = list.filter(function (t) { return String(t.category) === String(p.category); });
  if (p.from) list = list.filter(function (t) { return String(t.createdAt) >= String(p.from); });
  if (p.to) list = list.filter(function (t) { return String(t.createdAt) <= String(p.to) + 'T23:59:59'; });
  var limit = Number(p.limit || 300);
  return { transactions: list.slice(0, limit), total: list.length };
}

function adminActivity_(p) {
  auth_(p, 'admin');
  return readTable_(SHEETS.ACTIVITY).slice(-200).reverse();
}

function adminButterfly_(p) {
  auth_(p, 'admin');
  var names = {};
  readTable_(SHEETS.PARTICIPANTS).forEach(function (r) { names[String(r.id)] = r.displayName || r.name; });
  return readTable_(SHEETS.BUTTERFLY).slice().reverse().map(function (b) {
    return {
      id: b.id, employeeId: b.employeeId, name: names[String(b.participantId)] || b.employeeId,
      answer: b.answer, createdAt: b.createdAt, visibility: b.visibility
    };
  });
}

/* ============================ حكايات وشارات (محسوبة، بدون AI خارجي) ============================ */

function buildStory_(valid) {
  if (!valid.length) return { steps: [], summary: '', biggest: null, topCategory: null };
  var running = 0;
  var steps = valid.map(function (t) {
    running += Number(t.points || 0);
    return { at: t.createdAt, points: Number(t.points || 0), total: running, category: t.category };
  });
  var biggest = valid.slice().sort(function (a, b) { return Number(b.points) - Number(a.points); })[0];
  var byCat = {};
  valid.forEach(function (t) {
    if (Number(t.points) <= 0) return;
    byCat[t.category] = (byCat[t.category] || 0) + Number(t.points);
  });
  var topCategory = null, best = -1;
  for (var c in byCat) if (byCat[c] > best) { best = byCat[c]; topCategory = c; }

  var summaries = {
    ENCOURAGEMENT: 'تأثيرك بيبان أكتر وإنت بتشجّع غيرك.',
    SERVICE: 'إنت بتصنع تأثيرك من خلال الخدمة.',
    HELP_TEAM: 'فريقك بيلاقيك جنبه لما يحتاج.',
    IMPACT_MISSION: 'إنت بتنهي المهام لحد آخرها.',
    SECRET_RIPPLE: 'أغلب تأثيرك بيحصل وإنت ساكت.',
    CHALLENGE: 'إنت بتتحرك أول ما يبان تحدي.',
    PARTICIPATION: 'حضورك نفسه بيفرق في المكان.',
    SESSION: 'الالتزام عندك عادة مش استثناء.'
  };
  return {
    steps: steps.slice(-20),
    biggest: biggest ? { points: Number(biggest.points), category: biggest.category, at: biggest.createdAt } : null,
    topCategory: topCategory,
    summary: (summaries[topCategory] || 'تأثيرك متنوّع — مش محصور في حتة واحدة.') +
      ' (ملخص مرح مبني على أنشطتك داخل المؤتمر.)'
  };
}

function buildBadges_(valid, row) {
  var has = function (cat) { return valid.some(function (t) { return t.category === cat; }); };
  var countCat = function (cat) { return valid.filter(function (t) { return t.category === cat; }).length; };
  var badges = [
    { id: 'FIRST_DROP', icon: '💧', name: 'أول قطرة', earned: valid.length >= 1 },
    { id: 'FIRST_RIPPLE', icon: '🌊', name: 'أول ريبل', earned: row.points >= 100 },
    { id: 'WAVE_MAKER', icon: '🌊', name: 'صانع موجة', earned: row.points >= 250 },
    { id: 'IMPACT', icon: '⚡', name: 'تأثير', earned: row.points >= 500 },
    { id: 'RIPPLE_MAKER', icon: '♾️', name: 'صانع تأثير', earned: row.points >= 1000 },
    { id: 'BUTTERFLY', icon: '🦋', name: 'لحظة الفراشة', earned: has('SECRET_RIPPLE') },
    { id: 'CONNECTOR', icon: '🤝', name: 'الرابط', earned: countCat('HELP_TEAM') >= 2 },
    { id: 'ENCOURAGER', icon: '❤️', name: 'المشجّع', earned: countCat('ENCOURAGEMENT') >= 2 },
    { id: 'COURAGE', icon: '🔥', name: 'الشجاعة', earned: has('CHALLENGE') },
    { id: 'MULTIPLIER', icon: '🌱', name: 'المضاعِف', earned: countCat('IMPACT_MISSION') >= 2 }
  ];
  return badges;
}
