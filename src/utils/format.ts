export const rp = (n: number) => `${new Intl.NumberFormat('en-US').format(n)} RP`;

export const signed = (n: number) => `${n > 0 ? '+' : ''}${new Intl.NumberFormat('en-US').format(n)}`;

export function timeAgo(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso.replace(' ', 'T')).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Math.round((Date.now() - then) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `من ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `من ${Math.floor(diff / 3600)} ساعة`;
  return formatDate(iso);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export const initials = (name: string) => (name || '؟').trim().charAt(0);
