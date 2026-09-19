# Apps Script — الـ Backend

## الملفات
| الملف | الدور |
|---|---|
| `Config.gs` | أسماء الجداول وترتيب الأعمدة والإعدادات والتصنيفات الافتراضية |
| `Data.gs` | القراءة والكتابة والكاش والقفل وحساب الرادار والمستويات |
| `Code.gs` | `doGet` / `doPost` والمصادقة وكل الـ actions |
| `Setup.gs` | `installDatabase` · `seedSampleData` · `resetTransactions` · `recalculateEverything` · `selfTest` |
| `tests/` | محاكاة Google Sheets لاختبار المنطق في Node |

## الترتيب
1. انسخ الملفات الأربعة في مشروع Apps Script مربوط بالشيت.
2. شغّل `installDatabase`.
3. ضيف `ADMIN_SECRET` في Script Properties.
4. Deploy → New deployment → Web app → Execute as **Me** → Access **Anyone**.
5. شغّل `selfTest` للتأكد.

## قواعد لازم تفضل
- **متعدّلش ترتيب الأعمدة** في `HEADERS` من غير ما تعدّل الشيت.
- **متحطش أي سر في الكود.** استخدم `PropertiesService`.
- كل كتابة تعدي على `withLock_` و`invalidate_`.
- أي `action` جديدة تتسجّل في `route_` وتتحقق بـ `auth_`.
- بعد أي تعديل: **New version** في النشر.

## اختبار محلي
```bash
npm run test:api
```
