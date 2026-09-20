const { ctx, store } = require('./mock.cjs');
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, extra); }
};
const call = (payload, method = 'POST') => {
  const e = method === 'POST'
    ? { postData: { contents: JSON.stringify(payload) } }
    : { parameter: Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, String(v)])) };
  const res = method === 'POST' ? ctx.doPost(e) : ctx.doGet(e);
  return JSON.parse(res.getContent());
};

console.log('\n== التنصيب والبيانات التجريبية ==');
ctx.installDatabase();
check('كل الجداول اتعملت', Object.keys(ctx.HEADERS).every((n) => ctx.sheet_(n)));
ctx.seedSampleData();
const board0 = ctx.buildLeaderboard_();
check('12 مشارك في الرادار', board0.length === 12, board0.length);
check('الترتيب تنازلي', board0.every((p, i) => i === 0 || board0[i - 1].points >= p.points));

console.log('\n== المستويات ==');
const L = ctx.getLevels_();
check('0 → DROP', ctx.levelFor_(0, L).code === 'DROP');
check('99 → DROP', ctx.levelFor_(99, L).code === 'DROP');
check('100 → RIPPLE', ctx.levelFor_(100, L).code === 'RIPPLE');
check('999 → IMPACT', ctx.levelFor_(999, L).code === 'IMPACT');
check('1000 → RIPPLE_MAKER', ctx.levelFor_(1000, L).code === 'RIPPLE_MAKER');
check('آخر مستوى بلا تالي', ctx.levelFor_(2000, L).nextCode === null);

console.log('\n== دخول المشارك ==');
check('رقم سري غلط يترفض', call({ action: 'login', employeeId: 'RPL-0001', pin: '0000' }).ok === false);
const login = call({ action: 'login', employeeId: 'RPL-0001', pin: '1000' });
check('دخول صحيح', login.ok === true && !!login.data.token, JSON.stringify(login.error || ''));
const pToken = login.data?.token;
check('مشارك مش موجود يترفض', call({ action: 'login', employeeId: 'RPL-9999', pin: '1' }).ok === false);

console.log('\n== خصوصية البيانات ==');
check('بدون توكن ممنوع', call({ action: 'getParticipant', id: 'RPL-0001' }, 'GET').ok === false);
const mine = call({ action: 'getParticipant', id: 'RPL-0001', token: pToken }, 'GET');
check('المشارك يشوف ملفه', mine.ok === true);
const other = call({ action: 'getParticipant', id: 'RPL-0002', token: pToken }, 'GET');
check('ممنوع يشوف ملف غيره بتغيير الـ id', other.ok === false && other.error.code === 'FORBIDDEN');
check('الرقم السري مش بيخرج من الـ API', !JSON.stringify(mine.data).includes('"pin"'));

console.log('\n== دخول الأدمن ==');
check('بدون ADMIN_SECRET يترفض', call({ action: 'adminLogin', username: 'admin', secret: 'x' }).ok === false);
store.ADMIN_SECRET = 'secret-for-test';
check('كلمة سر غلط تترفض', call({ action: 'adminLogin', username: 'admin', secret: 'wrong' }).ok === false);
const a = call({ action: 'adminLogin', username: 'admin', secret: 'secret-for-test' });
check('دخول أدمن صحيح', a.ok === true, JSON.stringify(a.error || ''));
const aToken = a.data?.token;
check('مشارك مش بيقدر يدخل غرفة التحكم', call({ action: 'adminGetParticipants', token: pToken }, 'GET').ok === false);

console.log('\n== إضافة نقاط ==');
check('مشارك مش بيقدر يضيف نقاط لنفسه', call({
  action: 'addTransaction', token: pToken, participantId: 'RPL-0001', category: 'SERVICE', points: 500,
}).ok === false);
const before = ctx.buildLeaderboard_().find((p) => p.employeeId === 'RPL-0001').points;
const add = call({
  action: 'addTransaction', token: aToken, participantId: 'RPL-0001',
  category: 'IMPACT_MISSION', points: 100, reason: 'أنهى مهمة',
});
check('الأدمن أضاف 100', add.ok === true, JSON.stringify(add.error || ''));
const after = ctx.buildLeaderboard_().find((p) => p.employeeId === 'RPL-0001').points;
check('المجموع زاد 100 بالظبط', after === before + 100, `${before} → ${after}`);
check('اتعملت معاملة جديدة بـ id', /^TX-\d{5}$/.test(add.data.transaction.id), add.data.transaction.id);

console.log('\n== التحقق من المدخلات ==');
check('تصنيف غير موجود يترفض', call({ action: 'addTransaction', token: aToken, participantId: 'RPL-0001', category: 'NOPE', points: 10 }).ok === false);
check('صفر نقاط يترفض', call({ action: 'addTransaction', token: aToken, participantId: 'RPL-0001', category: 'BONUS', points: 0 }).ok === false);
check('نقاط أكبر من الحد ترفض', call({ action: 'addTransaction', token: aToken, participantId: 'RPL-0001', category: 'BONUS', points: 99999 }).ok === false);
check('مشارك غير موجود يترفض', call({ action: 'addTransaction', token: aToken, participantId: 'RPL-7777', category: 'BONUS', points: 10 }).ok === false);
check('GET مش بيكتب', call({ action: 'addTransaction', token: aToken, participantId: 'RPL-0001', category: 'BONUS', points: 10 }, 'GET').ok === false);

console.log('\n== الخصم ==');
const pen = call({ action: 'addTransaction', token: aToken, participantId: 'RPL-0001', category: 'PENALTY', points: -50, reason: 'اختبار' });
check('الخصم اتسجل', pen.ok === true && pen.data.transaction.type === 'PENALTY');
check('المجموع قل 50', ctx.buildLeaderboard_().find((p) => p.employeeId === 'RPL-0001').points === after - 50);

console.log('\n== التراجع ==');
const txId = add.data.transaction.id;
const rev = call({ action: 'reverseTransaction', token: aToken, transactionId: txId });
check('التراجع نجح', rev.ok === true);
check('المعاملة لسه موجودة في الشيت', ctx.readTable_('Transactions', false).some((t) => t.id === txId));
check('واتشالت من الحساب', ctx.buildLeaderboard_().find((p) => p.employeeId === 'RPL-0001').points === after - 50 - 100);
check('التراجع مرتين يترفض', call({ action: 'reverseTransaction', token: aToken, transactionId: txId }).ok === false);
const reversedRow = ctx.readTable_('Transactions', false).find((t) => t.id === txId);
check('سجل مين تراجع وإمتى', reversedRow.reversed === true && !!reversedRow.reversedAt && !!reversedRow.reversedBy);

console.log('\n== level up + top10 ==');
const jump = call({ action: 'addTransaction', token: aToken, participantId: 'RPL-0002', category: 'BONUS', points: 1200, reason: 'قفزة' });
check('اتبلّغ عن صعود مستوى', jump.data.levelUp && jump.data.levelUp.code === 'RIPPLE_MAKER', JSON.stringify(jump.data.levelUp));
check('اتبلّغ عن دخول Top 10', jump.data.enteredTop10 === 1, String(jump.data.enteredTop10));
check('بقى رقم 1', ctx.buildLeaderboard_()[0].employeeId === 'RPL-0002');

console.log('\n== تسجيل جماعي ==');
const teamOf2 = ctx.buildLeaderboard_().filter((p) => p.teamId === 'TEAM-02').map((p) => p.employeeId);
const beforeBulk = Object.fromEntries(ctx.buildLeaderboard_().map((p) => [p.employeeId, p.points]));
const bulk = call({
  action: 'addTransactionBulk', token: aToken, participantIds: teamOf2,
  category: 'SESSION', points: 10, reason: 'حضروا الجلسة',
});
check('التسجيل الجماعي نجح', bulk.ok === true, JSON.stringify(bulk.error || ''));
check('عدد المعاملات = عدد المحددين', bulk.data.created === teamOf2.length, `${bulk.data.created} vs ${teamOf2.length}`);
const afterBulk = Object.fromEntries(ctx.buildLeaderboard_().map((p) => [p.employeeId, p.points]));
check('كل واحد خد 10 بالظبط', teamOf2.every((id) => afterBulk[id] === beforeBulk[id] + 10));
check('محدش تاني اتأثر', Object.keys(beforeBulk).filter((id) => !teamOf2.includes(id)).every((id) => afterBulk[id] === beforeBulk[id]));
check('أرقام المعاملات متسلسلة وفريدة', new Set(bulk.data.transactions.map((t) => t.id)).size === teamOf2.length);
check('كل المعاملات موجودة في الشيت', bulk.data.transactions.every((t) => ctx.readTable_('Transactions', false).some((r) => r.id === t.id)));
const dup = call({
  action: 'addTransactionBulk', token: aToken,
  participantIds: ['RPL-0003', 'RPL-0003', 'RPL-9999', 'RPL-0004'],
  category: 'SERVICE', points: 50, reason: 'تكرار',
});
check('التكرار بيتشال', dup.data.created === 2, String(dup.data.created));
check('المشارك غير الموجود بيتسجل في skipped', dup.data.skipped.length === 1 && dup.data.skipped[0].id === 'RPL-9999');
check('قائمة فاضية ترفض', call({ action: 'addTransactionBulk', token: aToken, participantIds: [], category: 'BONUS', points: 10 }).ok === false);
check('المشارك مش بيقدر يسجل جماعي', call({ action: 'addTransactionBulk', token: pToken, participantIds: ['RPL-0001'], category: 'BONUS', points: 10 }).ok === false);
check('تصنيف غلط في الجماعي يترفض', call({ action: 'addTransactionBulk', token: aToken, participantIds: ['RPL-0001'], category: 'NOPE', points: 10 }).ok === false);
const upLevels = call({ action: 'addTransactionBulk', token: aToken, participantIds: ['RPL-0005', 'RPL-0006'], category: 'BONUS', points: 900, reason: 'قفزة جماعية' });
check('بيرجّع مين صعد مستوى', upLevels.data.levelUps.length === 2, JSON.stringify(upLevels.data.levelUps.length));

console.log('\n== الفرق ==');
const teams = ctx.buildTeams_();
const sumTeams = teams.reduce((s, t) => s + t.totalPoints, 0);
const sumAll = ctx.buildLeaderboard_().reduce((s, p) => s + p.points, 0);
check('مجموع الفرق = مجموع الأفراد', sumTeams === sumAll, `${sumTeams} vs ${sumAll}`);
check('الفرق مرتبة', teams[0].rank === 1);

console.log('\n== لحظة الفراشة ==');
const bm = call({ action: 'submitButterflyMoment', token: pToken, answer: 'هكلم أخويا' });
check('اتسجلت', bm.ok === true && bm.data.moment.visibility === 'private');
const bm2 = call({ action: 'submitButterflyMoment', token: pToken, answer: 'تعديل', visibility: 'public' });
check('التعديل بيستبدل مش بيكرر', bm2.data.moment.id === bm.data.moment.id);
check('مفيش تكرار في الشيت', ctx.readTable_('ButterflyMoments', false).length === 1);
check('الأدمن بس هو اللي يشوف الإجابات', call({ action: 'adminGetButterfly', token: pToken }, 'GET').ok === false);
check('إجابة فاضية ترفض', call({ action: 'submitButterflyMoment', token: pToken, answer: '   ' }).ok === false);

console.log('\n== الإعدادات ==');
const upd = call({ action: 'updateSettings', token: aToken, settings: { isScoringOpen: false, currentDay: 2 } });
check('الإعدادات اتحفظت', upd.ok === true && upd.data.isScoringOpen === false && upd.data.currentDay === 2);
check('التسجيل بيتقفل فعلًا', call({ action: 'addTransaction', token: aToken, participantId: 'RPL-0003', category: 'BONUS', points: 10 }).ok === false);
call({ action: 'updateSettings', token: aToken, settings: { isScoringOpen: true } });

console.log('\n== الخروج والجلسات ==');
call({ action: 'logout', token: pToken });
check('التوكن بطل يشتغل بعد الخروج', call({ action: 'getParticipant', id: 'RPL-0001', token: pToken }, 'GET').ok === false);
check('توكن مزوّر يترفض', call({ action: 'adminGetParticipants', token: 'fake-token' }, 'GET').ok === false);

console.log('\n== نقاط عامة ==');
check('الرادار متاح للكل', call({ action: 'getLeaderboard', limit: 10 }, 'GET').ok === true);
check('getBootstrap شغال', call({ action: 'getBootstrap' }, 'GET').ok === true);
check('إجراء مجهول يترفض بلطف', call({ action: 'nope' }, 'GET').error.code === 'UNKNOWN_ACTION');
const st = call({ action: 'getStats' }, 'GET').data;
check('الإحصائيات مطابقة', st.totalPoints === sumAll && st.participants === 12, JSON.stringify(st.totalPoints));

console.log(`\n==== نتيجة: ${pass} ناجح / ${fail} فاشل ====`);
process.exit(fail ? 1 : 0);
