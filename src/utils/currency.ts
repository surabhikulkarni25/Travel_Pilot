/**
 * Currency and financial formatting utilities for TravelPilot
 * Standardized on Indian Rupee (INR / ₹) with en-IN numbering notation (e.g. ₹1,50,000)
 */

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRPerDay(amount: number | undefined | null): string {
  return `${formatINR(amount)}/day`;
}

export function formatINRCompact(amount: number | undefined | null): string {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 100000) {
    const lakhs = (amount / 100000).toFixed(1).replace(/\.0$/, '');
    return `₹${lakhs} Lakh`;
  }
  if (amount >= 1000) {
    const k = (amount / 1000).toFixed(1).replace(/\.0$/, '');
    return `₹${k}k`;
  }
  return formatINR(amount);
}
