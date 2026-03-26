export type CurrencyCode = "PHP" | "USD" | "EUR" | "GBP" | "JPY" | "SGD" | "AUD";

export const CURRENCY_LIST: { code: CurrencyCode; label: string; symbol: string; flag: string }[] = [
  { code: "PHP", label: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "USD", label: "US Dollar",       symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "Euro",            symbol: "€", flag: "🇪🇺" },
  { code: "GBP", label: "British Pound",  symbol: "£", flag: "🇬🇧" },
  { code: "JPY", label: "Japanese Yen",   symbol: "¥", flag: "🇯🇵" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
];

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string; decimals: number }> = {
  PHP: { symbol: "₱",  locale: "en-PH", decimals: 2 },
  USD: { symbol: "$",  locale: "en-US", decimals: 2 },
  EUR: { symbol: "€",  locale: "de-DE", decimals: 2 },
  GBP: { symbol: "£",  locale: "en-GB", decimals: 2 },
  JPY: { symbol: "¥",  locale: "ja-JP", decimals: 0 },
  SGD: { symbol: "S$", locale: "en-SG", decimals: 2 },
  AUD: { symbol: "A$", locale: "en-AU", decimals: 2 },
};

export function formatCurrencyWithCode(amount: number, code: CurrencyCode = "PHP"): string {
  const cfg = CURRENCY_CONFIG[code] ?? CURRENCY_CONFIG.PHP;
  return `${cfg.symbol}${Math.abs(amount).toLocaleString(cfg.locale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  })}`;
}

export function formatCurrency(amount: number): string {
  return formatCurrencyWithCode(amount, "PHP");
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const { start, end } = getWeekRange();
  return date >= start && date <= end;
}

export function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const { start, end } = getMonthRange();
  return date >= start && date <= end;
}
