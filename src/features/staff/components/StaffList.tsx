import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import Ul from '@/components/ui/Ul/Ul';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import StaffListItem from './StaffListItem';

interface StaffListProps {
  staffs: StaffDto[];
}

/**
 * 職員リスト（Server Component）
 *
 * 職員一覧のリスト表示を担当。通報リストと同じカードスタイルを使用。
 */
export default function StaffList({ staffs }: StaffListProps) {
  if (staffs.length === 0) {
    return <EmptyState message="職員が登録されていません" />;
  }

  return (
    <Ul unstyled className="space-y-4">
      {staffs.map((staff) => (
        <StaffListItem key={staff.id} staff={staff} />
      ))}
    </Ul>
  );
}
