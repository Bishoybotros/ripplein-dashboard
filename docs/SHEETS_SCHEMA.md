# Google Sheets Schema — RIPPLEIN_DATABASE

`installDatabase()` بينشئ كل ده تلقائيًا. الجدول موجود هنا للرجوع والفهم.

> **متغيّرش ترتيب الأعمدة يدويًا.** الترتيب في `HEADERS` داخل `Config.gs` هو العقد بين الكود والشيت.
> لو محتاج عمود جديد، ضيفه في آخر الصف وفي `Config.gs` مع بعض.

## Participants
`id` · `employeeId` · `name` · `displayName` · `teamId` · `teamName` · `avatarUrl` · `phone` · `email` · **`pin`** · `totalPoints` · `level` · `status` · `createdAt` · `updatedAt`

- `id` = `employeeId` (مثال `RPL-0264`) — قرار مقصود يبسّط كل عمليات البحث والروابط.
- `pin` عمود إضافي عن المواصفات الأصلية، لازم لتسجيل دخول المشارك. **مبيخرجش من الـ API أبدًا** إلا لأدمن مسجّل دخوله.
- `totalPoints` و`level` قيم محفوظة للعرض داخل الشيت فقط — الحساب الحقيقي من `Transactions`.
- `status`: `ACTIVE` أو `INACTIVE`. غير النشط بيختفي من الرادار ومبيقدرش يدخل.

## Teams
`id` · `name` · `code` · `description` · `logoUrl` · `color` · `totalPoints` · `memberCount` · `createdAt`

`totalPoints` و`memberCount` محسوبة — بتتزامن مع الشيت عند إعادة الحساب.

## Transactions — مصدر الحقيقة
`id` · `participantId` · `employeeId` · `participantName` · `teamId` · `teamName` · `type` · `category` · `points` · `reason` · `adminId` · `createdAt` · `reversed` · `reversedAt` · `reversedBy` · `metadata`

- صف واحد لكل إضافة أو خصم. مفيش تعديل ومفيش حذف.
- `participantName` و`teamName` متكرّرين عن قصد: السجل بيحتفظ بالحالة وقت التسجيل حتى لو المشارك اتنقل لفريق تاني.
- `reversed = TRUE` بتشيل المعاملة من الحساب وتسيبها في السجل.
- مثال: `TX-00001 · RPL-0264 · Bishoy · TEAM-01 · Wave · BONUS · ENCOURAGEMENT · 30 · "شجع أحد أعضاء الفريق" · ADMIN-01`

## Categories
`id` · `name` · `nameAr` · `description` · `defaultPoints` · `icon` · `type` · `active`

القيم الافتراضية: SESSION +10 · PARTICIPATION +20 · HELP_TEAM +25 · ENCOURAGEMENT +30 · SERVICE +50 · CHALLENGE +100 · IMPACT_MISSION +100 · SECRET_RIPPLE +100 · BONUS مخصص · PENALTY −50.
الأدمن يقدر يكتب أي قيمة مختلفة وقت التسجيل. `active = FALSE` بتخفي التصنيف من غير ما تأثر على المعاملات القديمة.

## Admins
`id` · `username` · `displayName` · `role` · `active`

**مفيش أي كلمة سر هنا.** كلمات السر في Script Properties فقط.

## Settings
`key` · `value`

| المفتاح | مثال |
|---|---|
| `conferenceName` | RIPPLE 2026 |
| `companyName` | شركة الريبلين المحدودة |
| `currentDay` | 1 أو 2 |
| `isScoringOpen` | true / false |
| `butterflyOpen` | true / false |
| `leaderboardRefreshSeconds` | 8 |
| `maxTop10` | 10 |
| `levels` | `[{"code":"DROP","name":"قطرة","min":0}, …]` |

`levels` هو **المصدر الوحيد** لحدود المستويات — الخادم والواجهة بيقروا منه، ومفيش أي رقم متكرر في الكود.

## ActivityLog
`id` · `action` · `adminId` · `targetParticipantId` · `details` · `createdAt`

يسجّل: `ADMIN_LOGIN` · `ADD_TRANSACTION` · `REVERSE_TRANSACTION` · `CREATE_PARTICIPANT` · `UPDATE_PARTICIPANT` · `CREATE_TEAM` · `UPDATE_SETTINGS` · `RECALCULATE`.

## ButterflyMoments
`id` · `participantId` · `employeeId` · `answer` · `createdAt` · `visibility`

`visibility` = `private` افتراضيًا. إجابة واحدة لكل مشارك — إعادة الإرسال بتحدّث نفس الصف.

## الأداء

- كل جدول بيتقرى مرة واحدة ويتخزّن في الكاش ٥ ثواني.
- الرادار والإحصائيات لهم كاش منفصل.
- أي كتابة بتمسح الكاش المرتبط فورًا.
- كل الكتابات داخل `LockService` بمهلة ٢٠ ثانية.
