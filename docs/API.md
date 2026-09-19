# API Reference — RIPPLEIN Impact System

نقطة النهاية واحدة: رابط الـ Web App المنتهي بـ `/exec`.

- **القراءة** عبر `GET` مع query params.
- **الكتابة** عبر `POST` والـ body JSON.
- الرد دائمًا JSON:

```json
{ "ok": true, "data": { }, "v": "1.0.0" }
{ "ok": false, "error": { "code": "BAD_CATEGORY", "message": "هذا التصنيف غير موجود." } }
```

> POST لازم يتبعت بـ `Content-Type: text/plain;charset=utf-8`.
> أي `application/json` هيخلّي المتصفح يبعت preflight وApps Script مش بيرد عليه.

## المصادقة

| نوع | الإجراء | المدخلات | الناتج |
|---|---|---|---|
| مشارك | `login` | `employeeId`, `pin` | `token` صالح ٦ ساعات |
| أدمن | `adminLogin` | `username`, `secret` | `token` |
| الاثنين | `logout` | `token` | — |

التوكن بيتبعت مع كل طلب محتاج صلاحية (`token` في الـ query أو في الـ body).
بيتخزن في `CacheService` على الخادم وبيتجدّد مع كل استخدام.

## GET

| الإجراء | Params | صلاحية | الناتج |
|---|---|---|---|
| `ping` | — | عام | حالة النظام |
| `getBootstrap` | — | عام | settings + categories + teams + stats في طلب واحد |
| `getSettings` | — | عام | الإعدادات والمستويات |
| `getLeaderboard` | `limit?` | عام | `leaderboard[]`, `total` |
| `getTeams` | — | عام | `teams[]` |
| `getTeam` | `id` | عام | `team` + `members[]` |
| `getStats` | — | عام | إحصائيات عامة |
| `getCategories` | — | عام | التصنيفات المفعّلة |
| `getParticipant` | `id`, `token` | صاحب الملف أو أدمن | `participant`, `recent[]`, `story`, `badges[]` |
| `getTransactions` | `participantId`, `token` | صاحب السجل أو أدمن | `transactions[]` |
| `getMyButterfly` | `token` | مشارك | `moment` أو `null` |
| `adminGetParticipants` | `token` | أدمن | كل المشاركين + PIN |
| `adminGetTransactions` | `token`, `participantId?`, `teamId?`, `category?`, `from?`, `to?`, `limit?` | أدمن | `transactions[]`, `total` |
| `adminGetActivity` | `token` | أدمن | سجل العمليات |
| `adminGetButterfly` | `token` | أدمن | كل لحظات الفراشة |

## POST

| الإجراء | Body | صلاحية |
|---|---|---|
| `login` | `employeeId`, `pin` | عام |
| `adminLogin` | `username`, `secret` | عام |
| `logout` | `token` | أي جلسة |
| `addTransaction` | `token`, `participantId`, `category`, `points`, `reason?` | أدمن |
| `reverseTransaction` | `token`, `transactionId` | أدمن |
| `submitButterflyMoment` | `token`, `answer`, `visibility?` | مشارك |
| `createParticipant` | `token`, `name`, `employeeId?`, `teamId?`, `pin?`, `phone?` | أدمن |
| `updateParticipant` | `token`, `participantId`, + أي من `name/displayName/teamId/avatarUrl/phone/email/pin/status` | أدمن |
| `createTeam` | `token`, `name`, `code?`, `description?`, `color?` | أدمن |
| `updateSettings` | `token`, `settings{}` | أدمن |
| `recalculate` | `token` | أدمن |

### مثال — إضافة تأثير

```json
POST /exec
{
  "action": "addTransaction",
  "token": "…",
  "participantId": "RPL-0264",
  "category": "IMPACT_MISSION",
  "points": 100,
  "reason": "أنهى مهمة التأثير"
}
```

الرد:

```json
{
  "ok": true,
  "data": {
    "transaction": { "id": "TX-00042", "points": 100, "reversed": false, "…": "…" },
    "participant": { "employeeId": "RPL-0264", "points": 1240, "rank": 1, "level": { "code": "RIPPLE_MAKER" } },
    "levelUp": { "code": "RIPPLE_MAKER", "name": "صانع تأثير" },
    "enteredTop10": 1
  }
}
```

`levelUp` بيرجع `null` لو المستوى ماتغيرش — الواجهة بتستخدمه لعرض نافذة الترقية.

## أكواد الأخطاء

| الكود | المعنى |
|---|---|
| `NO_TOKEN` / `SESSION_EXPIRED` | لازم تسجيل دخول |
| `FORBIDDEN` | الصلاحية غير كافية |
| `BAD_CREDENTIALS` | بيانات دخول خاطئة |
| `BAD_INPUT` / `BAD_POINTS` / `BAD_CATEGORY` | مدخلات غير صالحة |
| `NOT_FOUND` | مشارك أو فريق أو معاملة غير موجودة |
| `DUPLICATE` | رقم موظف مستخدم |
| `ALREADY_REVERSED` | تم التراجع عن المعاملة من قبل |
| `SCORING_CLOSED` | التسجيل مقفول من الإعدادات |
| `BUSY` | قفل الكتابة مشغول — أعد المحاولة |
| `METHOD` | إجراء كتابة اتبعت بـ GET |
| `NOT_CONFIGURED` | `ADMIN_SECRET` مش مضبوط |
| `UNKNOWN_ACTION` | إجراء غير معروف |

الواجهة بتعرض `message` للمستخدم زي ما هي — كل الرسائل مكتوبة بالعربي ومن غير أي تفاصيل تقنية.
