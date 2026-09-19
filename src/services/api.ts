/**
 * طبقة الاتصال الوحيدة بالـ backend.
 *
 * ملاحظة مهمة عن CORS: طلبات POST تُرسل بـ Content-Type: text/plain حتى تبقى
 * "simple request" فلا يطلب المتصفح preflight (OPTIONS) — لأن Apps Script
 * لا يستطيع الرد على OPTIONS. الـ body نفسه JSON ويقرأه السكربت بـ JSON.parse.
 */

const API_URL = (import.meta.env.VITE_API_URL || '').trim();

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const isConfigured = () => Boolean(API_URL) && API_URL !== 'YOUR_APPS_SCRIPT_URL';

function ensureConfigured() {
  if (!isConfigured()) {
    throw new ApiError('NOT_CONFIGURED', 'لم يتم ربط النظام بقاعدة البيانات بعد. راجع إعداد VITE_API_URL.');
  }
}

async function parse<T>(res: Response): Promise<T> {
  let payload: { ok?: boolean; data?: T; error?: { code: string; message: string } };
  try {
    payload = await res.json();
  } catch {
    throw new ApiError('BAD_RESPONSE', 'تعذّر قراءة رد النظام. تأكد من نشر الـ Apps Script بشكل صحيح.');
  }
  if (!payload.ok) {
    const err = payload.error;
    throw new ApiError(err?.code || 'INTERNAL', err?.message || 'حدث خطأ غير متوقع.');
  }
  return payload.data as T;
}

export async function get<T>(action: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  ensureConfigured();
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  let res: Response;
  try {
    res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
  } catch {
    throw new ApiError('NETWORK', 'تعذّر الاتصال بالنظام. تأكد من الإنترنت ثم حاول مرة أخرى.');
  }
  return parse<T>(res);
}

export async function post<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  ensureConfigured();
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...body }),
    });
  } catch {
    throw new ApiError('NETWORK', 'تعذّر الاتصال بالنظام. تأكد من الإنترنت ثم حاول مرة أخرى.');
  }
  return parse<T>(res);
}

/** رسالة صالحة للعرض للمستخدم — لا تظهر أخطاء تقنية أبدًا. */
export function humanError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  console.error(e);
  return 'حصل خطأ غير متوقع. حاول مرة أخرى.';
}
