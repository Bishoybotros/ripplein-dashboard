/**
 * Setup.gs — تشغيل مرة واحدة.
 *
 * 1) installDatabase()  ← ينشئ كل الجداول والأعمدة والإعدادات والتصنيفات والفرق.
 * 2) seedSampleData()   ← بيانات تجريبية للاختبار فقط (احذفها قبل المؤتمر).
 * 3) setAdminSecret()   ← اقرأ التعليمات بداخلها.
 * 4) resetTransactions()← تفريغ النقاط قبل بدء المؤتمر.
 */

function installDatabase() {
  var book = book_();
  Object.keys(HEADERS).forEach(function (name) {
    var sh = book.getSheetByName(name) || book.insertSheet(name);
    var headers = HEADERS[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#0A0A0A').setFontColor('#FFC400');
    sh.setFrozenRows(1);
    if (sh.getMaxColumns() > headers.length) {
      sh.deleteColumns(headers.length + 1, sh.getMaxColumns() - headers.length);
    }
  });

  var blank = book.getSheetByName('Sheet1') || book.getSheetByName('ورقة1');
  if (blank && book.getSheets().length > 1) book.deleteSheet(blank);

  // الإعدادات الافتراضية (بدون الكتابة فوق قيم موجودة)
  var settings = getSettings_();
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    if (settings[k] === undefined || settings[k] === '') setSetting_(k, DEFAULT_SETTINGS[k]);
  });

  // التصنيفات
  if (readTable_(SHEETS.CATEGORIES, false).length === 0) {
    DEFAULT_CATEGORIES.forEach(function (c) {
      appendRow_(SHEETS.CATEGORIES, {
        id: c[0], name: c[1], nameAr: c[2], description: c[3],
        defaultPoints: c[4], icon: c[5], type: c[6], active: c[7]
      });
    });
  }

  // الفرق
  if (readTable_(SHEETS.TEAMS, false).length === 0) {
    DEFAULT_TEAMS.forEach(function (t) {
      appendRow_(SHEETS.TEAMS, {
        id: t[0], name: t[1], code: t[2], description: t[3], logoUrl: t[4],
        color: t[5], totalPoints: 0, memberCount: 0, createdAt: now_()
      });
    });
  }

  // أدمن افتراضي (كلمة السر نفسها تعيش في Script Properties وليس هنا)
  if (readTable_(SHEETS.ADMINS, false).length === 0) {
    appendRow_(SHEETS.ADMINS, {
      id: 'ADMIN-01', username: 'admin', displayName: 'مدير النظام', role: 'SUPER_ADMIN', active: true
    });
  }

  invalidateAll_();
  var secret = prop_('ADMIN_SECRET');
  Logger.log('تم تجهيز قاعدة البيانات.' + (secret ? '' : ' ⚠️ لم يتم ضبط ADMIN_SECRET بعد — شغّل setAdminSecret().'));
  return 'RIPPLEIN_DATABASE جاهزة.';
}

/**
 * اضبط كلمة سر الأدمن.
 * الطريقة الآمنة: Project Settings ← Script Properties ← Add property
 *    ADMIN_SECRET = كلمة السر
 * أو غيّر القيمة بالأسفل، شغّل الدالة مرة واحدة، ثم امسح القيمة من الكود واحفظ.
 */
function setAdminSecret() {
  var secret = 'CHANGE_ME_THEN_CLEAR';
  if (secret === 'CHANGE_ME_THEN_CLEAR') {
    throw new Error('غيّر قيمة secret داخل الدالة أولًا، أو اضبط ADMIN_SECRET من Script Properties.');
  }
  PropertiesService.getScriptProperties().setProperty('ADMIN_SECRET', secret);
  return 'تم الحفظ. امسح القيمة من الكود الآن.';
}

/** بيانات تجريبية — أسماء وهمية، للاختبار فقط. */
function seedSampleData() {
  if (readTable_(SHEETS.PARTICIPANTS, false).length > 0) {
    throw new Error('يوجد مشاركون بالفعل. امسحهم يدويًا قبل تشغيل البيانات التجريبية.');
  }
  var teams = readTable_(SHEETS.TEAMS, false);
  var sample = [
    ['RPL-0001', 'مشارك تجريبي ١'], ['RPL-0002', 'مشارك تجريبي ٢'],
    ['RPL-0003', 'مشارك تجريبي ٣'], ['RPL-0004', 'مشارك تجريبي ٤'],
    ['RPL-0005', 'مشارك تجريبي ٥'], ['RPL-0006', 'مشارك تجريبي ٦'],
    ['RPL-0007', 'مشارك تجريبي ٧'], ['RPL-0008', 'مشارك تجريبي ٨'],
    ['RPL-0009', 'مشارك تجريبي ٩'], ['RPL-0010', 'مشارك تجريبي ١٠'],
    ['RPL-0011', 'مشارك تجريبي ١١'], ['RPL-0012', 'مشارك تجريبي ١٢']
  ];
  sample.forEach(function (s, i) {
    var team = teams[i % teams.length];
    appendRow_(SHEETS.PARTICIPANTS, {
      id: s[0], employeeId: s[0], name: s[1], displayName: s[1],
      teamId: team.id, teamName: team.name, avatarUrl: '', phone: '', email: '',
      pin: String(1000 + i * 111), totalPoints: 0, level: 'DROP', status: 'ACTIVE',
      createdAt: now_(), updatedAt: now_()
    });
  });

  var cats = ['SESSION', 'PARTICIPATION', 'HELP_TEAM', 'ENCOURAGEMENT', 'SERVICE', 'CHALLENGE', 'IMPACT_MISSION'];
  var pts = [10, 20, 25, 30, 50, 100, 100];
  sample.forEach(function (s, i) {
    var howMany = (i % 5) + 1;
    for (var j = 0; j < howMany; j++) {
      var c = (i + j) % cats.length;
      appendRow_(SHEETS.TRANSACTIONS, {
        id: nextId_(SHEETS.TRANSACTIONS, 'TX-', 5),
        participantId: s[0], employeeId: s[0], participantName: s[1],
        teamId: teams[i % teams.length].id, teamName: teams[i % teams.length].name,
        type: 'BONUS', category: cats[c], points: pts[c],
        reason: 'بيانات تجريبية', adminId: 'ADMIN-01', createdAt: now_(),
        reversed: false, reversedAt: '', reversedBy: '', metadata: '{}'
      });
    }
  });

  invalidateAll_();
  syncCachedTotals_();
  return 'تمت إضافة بيانات تجريبية. أرقام الدخول السرية تبدأ من 1000 وتزيد 111.';
}

/** تفريغ كل النقاط قبل بدء المؤتمر — المشاركون والفرق تبقى كما هي. */
function resetTransactions() {
  var sh = sheet_(SHEETS.TRANSACTIONS);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  var log = sheet_(SHEETS.ACTIVITY);
  if (log.getLastRow() > 1) log.deleteRows(2, log.getLastRow() - 1);
  invalidateAll_();
  syncCachedTotals_();
  return 'تم تصفير كل النقاط.';
}

/** أعد حساب كل شيء من المعاملات — شغّلها لو عدّلت الشيت يدويًا. */
function recalculateEverything() {
  invalidateAll_();
  syncCachedTotals_();
  return JSON.stringify(handleStats_());
}

/** اختبار سريع للمنطق قبل النشر — يظهر في Execution log. */
function selfTest() {
  var out = [];
  out.push('settings: ' + JSON.stringify(publicSettings_()).slice(0, 120));
  out.push('categories: ' + activeCategories_().length);
  out.push('teams: ' + buildTeams_().length);
  out.push('leaderboard: ' + buildLeaderboard_().length);
  out.push('stats: ' + JSON.stringify(handleStats_()));
  var levels = getLevels_();
  out.push('level(0)=' + levelFor_(0, levels).code + ' level(99)=' + levelFor_(99, levels).code +
    ' level(100)=' + levelFor_(100, levels).code + ' level(1200)=' + levelFor_(1200, levels).code);
  out.push('admin secret set: ' + (prop_('ADMIN_SECRET') ? 'yes' : 'NO ⚠️'));
  Logger.log(out.join('\n'));
  return out.join('\n');
}
