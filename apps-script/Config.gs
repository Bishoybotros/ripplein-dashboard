/**
 * RIPPLEIN LTD. — IMPACT MANAGEMENT SYSTEM
 * Config.gs — الثوابت وهيكل قاعدة البيانات.
 *
 * كل الأسرار تُقرأ من Script Properties ولا تُكتب هنا إطلاقًا.
 *   SPREADSHEET_ID   (اختياري إذا كان السكربت مرتبطًا بالشيت)
 *   ADMIN_SECRET     (إجباري) كلمة سر الأدمن المشتركة
 *   ADMIN_SECRET_<USERNAME> (اختياري) كلمة سر خاصة بأدمن معيّن
 */

var SHEETS = {
  PARTICIPANTS: 'Participants',
  TEAMS: 'Teams',
  TRANSACTIONS: 'Transactions',
  CATEGORIES: 'Categories',
  ADMINS: 'Admins',
  SETTINGS: 'Settings',
  ACTIVITY: 'ActivityLog',
  BUTTERFLY: 'ButterflyMoments'
};

/** ترتيب الأعمدة = العقد بين الشيت والكود. لا تغيّر الترتيب يدويًا. */
var HEADERS = {
  Participants: ['id', 'employeeId', 'name', 'displayName', 'teamId', 'teamName',
    'avatarUrl', 'phone', 'email', 'pin', 'totalPoints', 'level', 'status',
    'createdAt', 'updatedAt'],
  Teams: ['id', 'name', 'code', 'description', 'logoUrl', 'color', 'totalPoints',
    'memberCount', 'createdAt'],
  Transactions: ['id', 'participantId', 'employeeId', 'participantName', 'teamId',
    'teamName', 'type', 'category', 'points', 'reason', 'adminId', 'createdAt',
    'reversed', 'reversedAt', 'reversedBy', 'metadata'],
  Categories: ['id', 'name', 'nameAr', 'description', 'defaultPoints', 'icon', 'type', 'active'],
  Admins: ['id', 'username', 'displayName', 'role', 'active'],
  Settings: ['key', 'value'],
  ActivityLog: ['id', 'action', 'adminId', 'targetParticipantId', 'details', 'createdAt'],
  ButterflyMoments: ['id', 'participantId', 'employeeId', 'answer', 'createdAt', 'visibility']
};

/** القيم الافتراضية لجدول Settings (تُكتب مرة واحدة عند التنصيب). */
var DEFAULT_SETTINGS = {
  conferenceName: 'RIPPLE 2026',
  conferenceYear: '2026',
  companyName: 'شركة الريبلين المحدودة',
  leaderboardRefreshSeconds: '8',
  maxTop10: '10',
  currentDay: '1',
  isScoringOpen: 'true',
  butterflyOpen: 'true',
  levels: JSON.stringify([
    { code: 'DROP', name: 'قطرة', min: 0 },
    { code: 'RIPPLE', name: 'ريبل', min: 100 },
    { code: 'WAVE', name: 'موجة', min: 250 },
    { code: 'IMPACT', name: 'تأثير', min: 500 },
    { code: 'RIPPLE_MAKER', name: 'صانع تأثير', min: 1000 }
  ])
};

var DEFAULT_CATEGORIES = [
  ['SESSION', 'Session', 'حضور جلسة', 'حضور جلسة كاملة في وقتها', 10, '🎯', 'BONUS', true],
  ['PARTICIPATION', 'Participation', 'مشاركة', 'مشاركة فعّالة داخل الجلسة أو النشاط', 20, '🙋', 'BONUS', true],
  ['HELP_TEAM', 'Help Team', 'مساعدة الفريق', 'ساعد فريقه في مهمة أو تنظيم', 25, '🤝', 'BONUS', true],
  ['ENCOURAGEMENT', 'Encourage Someone', 'تشجيع', 'شجّع شخصًا آخر بكلمة أو فعل', 30, '❤️', 'BONUS', true],
  ['SERVICE', 'Service', 'خدمة', 'خدمة عملية بدون طلب', 50, '🌱', 'BONUS', true],
  ['CHALLENGE', 'Challenge', 'تحدي', 'أكمل تحدي اليوم', 100, '🔥', 'BONUS', true],
  ['IMPACT_MISSION', 'Impact Mission', 'مهمة تأثير', 'أنهى مهمة تأثير كاملة', 100, '🌊', 'BONUS', true],
  ['SECRET_RIPPLE', 'Secret Ripple', 'التأثير السري', 'فعل خير بدون أن يخبر أحدًا', 100, '🦋', 'BONUS', true],
  ['BONUS', 'Bonus', 'إضافة خاصة', 'نقاط إضافية بتقدير الأدمن', 0, '⚡', 'BONUS', true],
  ['PENALTY', 'Penalty', 'خصم', 'خصم نقاط', -50, '⚠️', 'PENALTY', true]
];

var DEFAULT_TEAMS = [
  ['TEAM-01', 'DROP', 'RPL-01', 'فريق القطرة', '', '#1769FF'],
  ['TEAM-02', 'RIPPLE', 'RPL-02', 'فريق الدوائر', '', '#FFC400'],
  ['TEAM-03', 'WAVE', 'RPL-03', 'فريق الموجة', '', '#FF2B8A'],
  ['TEAM-04', 'IMPACT', 'RPL-04', 'فريق التأثير', '', '#14C38E']
];

var CACHE_TTL = { SHORT: 5, MEDIUM: 20, SESSION: 21600 };
var API_VERSION = '1.0.0';
