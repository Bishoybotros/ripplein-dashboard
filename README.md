# RIPPLEIN LTD. — IMPACT MANAGEMENT SYSTEM

نظام إدارة التأثير لمؤتمر **RIPPLE 2026**.
موقع كامل قابل للتشغيل: واجهة على GitHub Pages، وAPI على Google Apps Script، وقاعدة بيانات على Google Sheets.

> ONE DROP. ENDLESS IMPACT. — قطرة واحدة… تأثير بلا حدود.

---

## المعمارية

```
المتصفح / الموبايل / شاشة المؤتمر
            │
            ▼
   GitHub Pages  ·  React + Vite + TypeScript (HashRouter)
            │  fetch
            │  GET  → query params
            │  POST → body JSON بـ Content-Type: text/plain (تفاديًا لـ CORS preflight)
            ▼
   Google Apps Script Web App  ·  doGet / doPost
            │  مصادقة بتوكن جلسة + LockService + CacheService
            ▼
   Google Sheets  ·  RIPPLEIN_DATABASE (8 جداول)
```

**قاعدة ذهبية:** جدول `Transactions` هو مصدر الحقيقة الوحيد.
`totalPoints` في `Participants` مجرد قيمة محفوظة للعرض داخل الشيت — النظام بيحسب كل شيء من المعاملات.
الترتيب والمستويات ومجاميع الفرق كلها **محسوبة لحظيًا**.

### ليه الاختيارات دي

| القرار | السبب |
|---|---|
| HashRouter مش BrowserRouter | GitHub Pages مش بيعمل rewrite للمسارات؛ الهاش بيشتغل من غير أي إعداد أو ملف 404 |
| CSS خام بنظام tokens | أخف من Tailwind، وبيدّي الهوية الصناعية تحكّمًا كاملًا، وبناء أسرع |
| `Content-Type: text/plain` في POST | Apps Script مبيردّش على طلب OPTIONS، فلازم يفضل الطلب "simple request" |
| توكن جلسة بدل كلمة سر مع كل طلب | كلمة السر مبتتخزنش في المتصفح إطلاقًا |
| `id` = `employeeId` للمشارك | بيلغي طبقة lookup كاملة ويبسّط الروابط |

---

## التشغيل من الصفر — ٨ خطوات

### 1) Google Sheet
أنشئ spreadsheet جديد واسمّيه `RIPPLEIN_DATABASE`.

### 2) Apps Script
من الشيت: **Extensions → Apps Script**.
امسح `Code.gs` الافتراضي، وأنشئ الملفات دي وانسخ محتواها من مجلد `apps-script/`:
`Config.gs` · `Data.gs` · `Code.gs` · `Setup.gs`

### 3) إنشاء الجداول
من قائمة الدوال اختر **`installDatabase`** ثم Run، ووافق على الصلاحيات.
هيتعمل: الجداول الثمانية + التصنيفات + ٤ فرق + إعدادات + أدمن باسم `admin`.

### 4) كلمة سر الأدمن
**Project Settings ← Script Properties ← Add script property**

| Property | Value |
|---|---|
| `ADMIN_SECRET` | كلمة السر اللي هتدخل بيها غرفة التحكم |

كلمة السر دي مش بتتخزن في الكود ولا في الشيت ولا في الموقع.
لو عايز كلمة سر مستقلة لكل أدمن: `ADMIN_SECRET_<USERNAME>` بحروف كبيرة، مثلًا `ADMIN_SECRET_MINA`.

### 5) النشر
**Deploy → New deployment → Web app**

| الحقل | القيمة |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

انسخ الـ Web app URL — بينتهي بـ `/exec`.

> مهم: بعد أي تعديل في الكود لازم **Deploy → Manage deployments → Edit → Version: New version**، وإلا الموقع هيفضل شغال على النسخة القديمة.

### 6) ربط الواجهة
محليًا:
```bash
cp .env.example .env
# ضع الرابط في VITE_API_URL
npm install
npm run dev
```

### 7) GitHub
```bash
git init && git add . && git commit -m "RIPPLEIN LTD. impact system"
git branch -M main
git remote add origin https://github.com/<username>/ripplein-dashboard.git
git push -u origin main
```

### 8) GitHub Pages
- **Settings → Pages → Source: GitHub Actions**
- **Settings → Secrets and variables → Actions → Variables → New repository variable**

| Name | Value |
|---|---|
| `VITE_API_URL` | رابط الـ Web App بتاعك |

أي push على `main` هيبني وينشر تلقائيًا. الموقع هيبقى على:
`https://<username>.github.io/ripplein-dashboard/`

---

## المسارات

| المسار | الوصف | الصلاحية |
|---|---|---|
| `#/` | استقبال الشركة | عام |
| `#/login` | دخول المشارك | عام |
| `#/dashboard` | لوحة المشارك | مشارك |
| `#/participant?id=RPL-0264` | ملف موظف | صاحب الملف أو أدمن |
| `#/leaderboard` · `#/top10` | رادار الريبل | عام |
| `#/scoreboard` | شاشة المؤتمر الكاملة | عام |
| `#/teams` · `#/team?id=TEAM-01` | الفرق | عام |
| `#/missions` | مهام التأثير + جدول النقاط | عام |
| `#/butterfly` | لحظة الفراشة | مشارك |
| `#/admin` | غرفة التحكم | أدمن |
| `#/admin/transactions` · `participants` · `teams` · `butterfly` · `settings` | إدارة | أدمن |

للشاشة الكبيرة: افتح `#/scoreboard` واضغط F11. مفيهاش أي أزرار تحكم.

---

## الاستخدام اليومي

**إضافة نقاط:** غرفة التحكم ← تسجيل تأثير سريع ← ابحث بالاسم أو رقم الموظف ← اختر التصنيف (النقاط بتتحط تلقائيًا) ← السبب ← تأكيد.

**خصم نقاط:** نفس الخطوات بنقاط بالسالب أو تصنيف `PENALTY`. مفيش حذف — كل حاجة بتتسجّل.

**التراجع:** المعاملات ← تراجع. المعاملة بتفضل في الشيت بـ `reversed = true` وبتتشال من الحساب. السجل بيفضل كامل.

**تسجيل مشارك:** المشاركون ← تسجيل موظف. لو سِبت رقم الموظف فاضي هيتولّد تلقائيًا، ونفس الشيء للرقم السري — وهيظهرلك بعد التسجيل عشان تديهوله.

**الأرقام السرية:** المشاركون ← إظهار الأرقام السرية. موجودة في عمود `pin` في الشيت وبتفضل عندك إنت بس.

**قفل التسجيل:** الإعدادات ← «تسجيل النقاط مقفول». مفيد قبل إعلان النتيجة.

**تصفير قبل المؤتمر:** شغّل `resetTransactions()` من Apps Script. بيمسح النقاط والسجل ويسيب المشاركين والفرق.

**عدّلت الشيت بإيدك؟** الإعدادات ← إعادة حساب كل شيء (أو `recalculateEverything()`).

---

## الأمان باختصار

- مفيش أي سر في الواجهة. الموقع كله public ومفيهوش غير `VITE_API_URL`.
- `ADMIN_SECRET` في Script Properties بس.
- كل عمليات الكتابة بتتحقق من التوكن **على الخادم** — الحماية في الواجهة للتجربة بس.
- المشارك مش بيقدر يشوف ملف غيره حتى لو غيّر الـ `id` في الرابط (مُختبَر).
- المشارك مش بيقدر يضيف أو يعدّل نقاط أبدًا.
- `LockService` بيمنع تضارب لو أكتر من أدمن بيضيف في نفس اللحظة.
- إجابات لحظة الفراشة **خاصة افتراضيًا**.

التفاصيل في [`docs/SECURITY.md`](docs/SECURITY.md).

---

## الاختبارات

```bash
npm run test:api   # 54 اختبار لمنطق الـ backend بمحاكاة Google Sheets
npm run typecheck
npm run build
```

قائمة الاختبار اليدوي قبل المؤتمر في [`docs/TESTING.md`](docs/TESTING.md).

---

## حل المشاكل

| العرض | السبب والحل |
|---|---|
| «لم يتم ربط النظام بقاعدة البيانات» | `VITE_API_URL` فاضي أو لسه `YOUR_APPS_SCRIPT_URL`. في GitHub لازم يكون **Variable** مش Secret، وبعد إضافته أعد تشغيل الـ workflow |
| خطأ CORS في الكونسول | غالبًا النشر على **Who has access: Anyone**. متستخدمش `Content-Type: application/json` في POST — ده بيسبّب preflight وApps Script مش بيردّ عليه |
| صفحة تسجيل دخول Google بترجع بدل البيانات | النشر مضبوط على "Only myself". غيّرها لـ Anyone وأعد النشر بنسخة جديدة |
| التعديلات مش ظاهرة | نشرت من غير **New version** |
| «الجدول غير موجود» | مشغلتش `installDatabase()` |
| «لم يتم ضبط ADMIN_SECRET» | ضيفه في Script Properties |
| 404 على GitHub Pages | Pages لازم تكون Source: GitHub Actions، والمسارات كلها بعد `#` |
| النقاط مش بتتحدث فورًا | الكاش ٥ ثواني + التحديث الدوري. الرقم قابل للتعديل من الإعدادات |
| بطء عند التحميل | أول طلب لـ Apps Script بياخد ثانيتين تقريبًا. عادي |

---

## بنية المشروع

```
ripplein-dashboard/
├── apps-script/          Config.gs · Data.gs · Code.gs · Setup.gs · tests/
├── docs/                 SETUP · API · SECURITY · SHEETS_SCHEMA · TESTING
├── src/
│   ├── components/       store · Layout · UI · QuickScore · RankList · Canister …
│   ├── pages/            الصفحات العامة + admin/
│   ├── services/         api · session
│   ├── hooks/            usePolling
│   ├── utils/            levels · format · csv
│   └── styles/           tokens.css · global.css
└── .github/workflows/deploy.yml
```

---

## ملاحظة عن الهوية

RIPPLEIN LTD. عالم أصلي بالكامل. فكرة «شركة بتجمع طاقة» مصدر إلهام عام فقط — مفيش أي أصول أو أسماء أو تصميمات منقولة من أي عمل محمي بحقوق نشر.
