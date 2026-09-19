# دليل التنصيب التفصيلي

## أ) قاعدة البيانات و الـ API

1. **Google Sheet جديد** باسم `RIPPLEIN_DATABASE`.
2. **Extensions → Apps Script**. امسح المحتوى الافتراضي.
3. أنشئ أربع ملفات بنفس الأسماء وانسخ فيها محتوى مجلد `apps-script/`:
   - `Config.gs` — الثوابت وهيكل الأعمدة
   - `Data.gs` — الوصول للشيت والحساب
   - `Code.gs` — الـ API والمصادقة
   - `Setup.gs` — التنصيب والصيانة
4. احفظ (Ctrl+S).
5. اختر الدالة **`installDatabase`** ثم **Run**.
   - أول مرة هيطلب صلاحيات: Review permissions → اختر حسابك → Advanced → Go to project → Allow.
   - هتلاقي الجداول الثمانية اتعملت في الشيت.
6. **Project Settings → Script Properties → Add script property**:
   - `ADMIN_SECRET` = كلمة السر اللي هتستخدمها في غرفة التحكم.
   - (اختياري) `SPREADSHEET_ID` لو السكربت مش مربوط بالشيت مباشرة.
7. (اختياري) شغّل **`seedSampleData`** لو عايز تجرّب النظام ببيانات وهمية.
   الأرقام السرية التجريبية بتبدأ من 1000 وبتزيد 111 (1000، 1111، 1222…).
8. شغّل **`selfTest`** وشوف الـ Execution log — بيأكدلك إن كل حاجة مظبوطة.

### النشر
**Deploy → New deployment → اختر النوع Web app**

| الحقل | القيمة | ليه |
|---|---|---|
| Description | `v1` | للتتبع |
| Execute as | **Me** | عشان السكربت يقدر يكتب في الشيت |
| Who has access | **Anyone** | الموقع بيتكلم مع الـ API من غير تسجيل دخول Google |

انسخ الـ **Web app URL**.

> "Anyone" معناها إن الـ endpoint مفتوح — عشان كده كل التحقق من الصلاحيات بيحصل جوه الكود نفسه.
> مفيش أي إجراء كتابة بيشتغل من غير توكن صالح.

**عند أي تعديل لاحق:** Deploy → Manage deployments → ✏️ Edit → Version: **New version** → Deploy.
الرابط بيفضل زي ما هو.

## ب) التشغيل المحلي

```bash
npm install
cp .env.example .env     # وضع الرابط في VITE_API_URL
npm run dev              # http://localhost:5173
```

## ج) GitHub Pages

1. ارفع المشروع على GitHub على فرع `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions → تبويب Variables → New repository variable**:
   - Name: `VITE_API_URL` · Value: رابط الـ Web App.
   - لازم **Variable** مش Secret — القيمة بتتحط داخل ملفات البناء وهي مش سر أصلًا.
4. أي push على `main` بيشغّل `.github/workflows/deploy.yml`.
5. الموقع: `https://<username>.github.io/<repo>/`

`base: './'` في `vite.config.ts` معناه إن البناء بيشتغل على أي مسار — مش محتاج تعدّل حاجة لو غيّرت اسم الريبو.

## د) قبل المؤتمر

1. سجّل الفرق (غرفة التحكم ← الفرق).
2. سجّل المشاركين. اطبع لكل واحد رقم الموظف + الرقم السري.
3. راجع جدول النقاط في الإعدادات وحدود المستويات.
4. شغّل `resetTransactions()` لو كنت جرّبت ببيانات وهمية.
5. افتح `#/scoreboard` على شاشة العرض واعمل F11.
6. جرّب إضافة نقاط من موبايل — الأدمن غالبًا هيشتغل من الموبايل.

## هـ) حدود Google المجانية

| المورد | الحد اليومي |
|---|---|
| وقت تشغيل Apps Script | ٩٠ دقيقة |
| استدعاءات URL Fetch | ٢٠,٠٠٠ |

مؤتمر ١٥٠ مشارك بتحديث كل ٨ ثواني بيستهلك جزء بسيط من ده. لو عندك أكتر من ٣٠٠ مشارك، زوّد `leaderboardRefreshSeconds` لـ ١٥ ثانية.
