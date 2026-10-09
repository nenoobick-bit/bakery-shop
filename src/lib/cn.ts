export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function formatDate(d?: Date | null): string {
  if (!d) return "";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
