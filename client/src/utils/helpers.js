/**
 * Dynamic color palette for categories.
 * Colors are assigned based on index, cycling through the palette.
 */
const CATEGORY_COLORS = [
  { name: 'violet',  hex: '#8b5cf6', bg: '#ede9fe', text: '#7c3aed' },
  { name: 'pink',    hex: '#ec4899', bg: '#fce7f3', text: '#db2777' },
  { name: 'orange',  hex: '#f97316', bg: '#ffedd5', text: '#ea580c' },
  { name: 'blue',    hex: '#3b82f6', bg: '#dbeafe', text: '#2563eb' },
  { name: 'emerald', hex: '#10b981', bg: '#d1fae5', text: '#059669' },
  { name: 'rose',    hex: '#f43f5e', bg: '#ffe4e6', text: '#e11d48' },
  { name: 'amber',   hex: '#f59e0b', bg: '#fef3c7', text: '#d97706' },
  { name: 'cyan',    hex: '#06b6d4', bg: '#cffafe', text: '#0891b2' },
  { name: 'indigo',  hex: '#6366f1', bg: '#e0e7ff', text: '#4f46e5' },
  { name: 'lime',    hex: '#84cc16', bg: '#ecfccb', text: '#65a30d' },
];

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
 * Get color for a category by index (cycles through palette)
 */
export function getCategoryColorByIndex(index) {
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  return color;
}

/**
 * Build a color map for a list of categories
 */
export function buildCategoryColorMap(categories) {
  const map = {};
  categories.forEach((cat, i) => {
    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    map[cat.name || cat] = color;
  });
  return map;
}

/**
 * Get category color styles for TailwindCSS classes
 */
export function getCategoryColor(name, colorMap) {
  const color = colorMap?.[name];
  if (color) {
    return { hex: color.hex, bgStyle: color.bg, textStyle: color.text };
  }
  return { hex: '#94a3b8', bgStyle: '#f1f5f9', textStyle: '#64748b' };
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

export { CATEGORY_COLORS };
