/** تصدير CSV من المتصفح — بدون أي حمل على الخادم. */
export function downloadCsv<T extends object>(filename: string, rows: T[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0] as object);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(','))
    .join('\n');
  // BOM حتى تفتح الحروف العربية بشكل صحيح في Excel
  const blob = new Blob(['\uFEFF' + headers.join(',') + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
