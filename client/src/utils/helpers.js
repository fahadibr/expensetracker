/**
 * Format a number as currency (default PKR-style)
 */
export function formatCurrency(amount, locale = 'en-PK') {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

/**
 * Get category color class
 */
export function getCategoryColor(name) {
  const colors = {
    'Fahad': { bg: 'bg-fahad-light', text: 'text-fahad', dot: 'bg-fahad' },
    'Mrs': { bg: 'bg-mrs-light', text: 'text-mrs', dot: 'bg-mrs' },
    'Home': { bg: 'bg-home-light', text: 'text-home', dot: 'bg-home' },
  };
  return colors[name] || { bg: 'bg-primary-50', text: 'text-primary-600', dot: 'bg-primary-500' };
}

/**
 * Get transaction type styles
 */
export function getTypeStyles(type) {
  const styles = {
    income: { bg: 'bg-success-light', text: 'text-success', icon: '↗', label: 'Income' },
    expense: { bg: 'bg-danger-light', text: 'text-danger', icon: '↙', label: 'Expense' },
    transfer: { bg: 'bg-info-light', text: 'text-info', icon: '⇄', label: 'Transfer' },
  };
  return styles[type] || styles.expense;
}
