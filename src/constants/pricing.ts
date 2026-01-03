export const DEFAULT_PER_CLASS_PRICE = 600; // number, in INR

export function formatINR(value: number) {
  try {
    return `₹${value.toLocaleString('en-IN')}`;
  } catch {
    return `₹${value}`;
  }
}

export const DEFAULT_PER_CLASS_PRICE_LABEL = formatINR(DEFAULT_PER_CLASS_PRICE);
