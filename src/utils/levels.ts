import type { Level } from '../types';

/** رسالة تتغير حسب مستوى التأثير — تظهر في لوحة المشارك. */
export function levelLine(points: number): string {
  if (points >= 1000) return 'أنت الآن Ripple Maker.';
  if (points >= 500) return 'بقيت موجة.';
  if (points >= 250) return 'تأثيرك بدأ يوصل.';
  if (points >= 100) return 'بدأت الدوائر تظهر.';
  if (points > 0) return 'كل Ripple كبير بدأ بقطرة.';
  return 'لسه مبدأتش. أول قطرة على بعد فعل واحد.';
}

export const levelEmoji: Record<string, string> = {
  DROP: '💧',
  RIPPLE: '🌊',
  WAVE: '🌊',
  IMPACT: '⚡',
  RIPPLE_MAKER: '♾️',
};

export function nextLevelLine(level: Level): string {
  if (!level.nextName) return 'وصلت لآخر مستوى في الشركة.';
  return `فاضل ${level.remaining} RP على مستوى ${level.nextName}.`;
}
