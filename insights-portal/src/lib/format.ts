export function formatPrice(value: number | null, unit: string) {
  if (value === null) return "Not available";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: unit,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value)} ${unit}`;
  }
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
