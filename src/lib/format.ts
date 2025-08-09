/**
 * Utility helpers for formatting values for display.
 */

/**
 * Convert an integer number of cents into a localized currency string.
 *
 * The application stores monetary amounts as whole cents to avoid floating
 * point errors. This helper turns those raw integers into human friendly
 * amounts using the browser's Intl formatting capabilities.
 */
export function formatCurrency(cents: number, currency = 'AUD'): string {
  return (cents / 100).toLocaleString('en-AU', {
    style: 'currency',
    currency
  });
}
