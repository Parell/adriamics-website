const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: "currency",
  currency: "USD",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  notation: "compact",
  style: "currency",
  currency: "USD",
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  notation: "compact",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  style: "percent",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return currencyFormatter.format(value);
}

export function formatCompactNumber(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return compactNumberFormatter.format(value);
}

export function formatCompactCurrency(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return compactCurrencyFormatter.format(value);
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return numberFormatter.format(value);
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return percentFormatter.format(value);
}

export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateFormatter.format(date);
}
