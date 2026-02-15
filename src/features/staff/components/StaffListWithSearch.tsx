'use client';

import { useState, useMemo } from 'react';
import FilterBar from '@/components/ui/Search/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import Ul from '@/components/ui/Ul/Ul';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import StaffListItem from './StaffListItem';

interface StaffListWithSearchProps {
  staffs: StaffDto[];
}

/**
 * 職員一覧（検索機能付き）
 *
 * FilterBarコンポーネントを使用して名前で検索できるテキストフィールドを提供し、
 * クライアント側で職員リストをフィルタリングする。
 */
export default function StaffListWithSearch({
  staffs,
}: StaffListWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaffs = useMemo(() => {
    if (!searchQuery.trim()) return staffs;
    const query = searchQuery.trim().toLowerCase();
    return staffs.filter((staff) => staff.name.toLowerCase().includes(query));
  }, [staffs, searchQuery]);

  return (
    <div className="space-y-6">
      <FilterBar
        search={{
          value: searchQuery,
          placeholder: '職員名で検索',
          onSearch: setSearchQuery,
        }}
      />

      {staffs.length === 0 ? (
        <EmptyState message="職員が登録されていません" />
      ) : filteredStaffs.length === 0 ? (
        <EmptyState message="検索条件に一致する職員がいません" />
      ) : (
        <Ul unstyled className="space-y-4">
          {filteredStaffs.map((staff) => (
            <StaffListItem key={staff.id} staff={staff} />
          ))}
        </Ul>
      )}
    </div>
  );
}
