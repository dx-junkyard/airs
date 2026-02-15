/**
 * Query Keyの型安全な定義
 *
 * TanStack Queryで使用するクエリキーを一元管理します。
 * 階層的な構造により、柔軟なキャッシュ無効化が可能です。
 */
export const queryKeys = {
  // Report関連
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.reports.all, 'search', query] as const,
    filterByStatus: (status: string) =>
      [...queryKeys.reports.all, 'status', status] as const,
    filterByAnimalType: (animalType: string) =>
      [...queryKeys.reports.all, 'animalType', animalType] as const,
    statistics: (params?: Record<string, unknown>) =>
      [...queryKeys.reports.all, 'statistics', params] as const,
  },
  // Event関連
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
  },
  // Staff関連
  staffs: {
    all: ['staffs'] as const,
    lists: () => [...queryKeys.staffs.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.staffs.lists(), filters] as const,
    details: () => [...queryKeys.staffs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.staffs.details(), id] as const,
  },
  // StaffLocation関連
  staffLocations: {
    all: ['staffLocations'] as const,
    byStaff: (staffId: string) => ['staffLocations', 'staff', staffId] as const,
  },
  // Facility関連
  facilities: {
    all: ['facilities'] as const,
    byStaff: (staffId: string) => ['facilities', 'staff', staffId] as const,
    shared: () => ['facilities', 'shared'] as const,
  },
  // BulkAction関連
  bulkActions: {
    all: ['bulkActions'] as const,
    latest: (actionKey: string) =>
      ['bulkActions', 'latest', actionKey] as const,
    detail: (id: string) => ['bulkActions', 'detail', id] as const,
  },
  // SystemSetting関連
  systemSettings: {
    all: ['systemSettings'] as const,
    detail: () => [...queryKeys.systemSettings.all, 'detail'] as const,
  },
} as const;
