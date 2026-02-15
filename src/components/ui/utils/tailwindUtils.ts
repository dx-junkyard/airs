/**
 * Common Tailwind CSS class combinations used throughout the application
 */

export const commonStyles = {
  // Card styles
  card: 'bg-white rounded-lg shadow-sm border border-solid-gray-200',
  cardPadding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },

  // Typography
  pageTitle: 'text-3xl font-bold text-blue-900',
  sectionTitle: 'text-xl font-semibold text-blue-900',
  supportText: 'text-sm text-solid-gray-600',
  errorText: 'text-sm text-red-900',

  // Layout
  spacing: {
    sm: 'space-y-3',
    md: 'space-y-6',
    lg: 'space-y-8',
  },
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    twoColumn: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  },

  // Alerts and notifications
  errorBox: 'bg-red-50 border border-red-200 p-4 rounded-lg',
  successBox: 'bg-green-50 border border-green-200 p-4 rounded-lg',
  warningBox: 'bg-yellow-50 border border-yellow-200 p-4 rounded-lg',
  infoBox: 'bg-blue-50 border border-blue-200 p-4 rounded-lg',

  // Loading and empty states
  loadingContainer: 'flex justify-center items-center min-h-[400px]',
  emptyContainer: 'text-center py-8',

  // Form elements
  formGroup: 'space-y-6',
  fieldGroup: 'space-y-4',
  formActions: 'flex justify-end gap-4',
} as const;
