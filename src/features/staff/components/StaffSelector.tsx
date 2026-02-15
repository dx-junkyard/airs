import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie } from '@fortawesome/free-solid-svg-icons';
import type { StaffDto } from '@/server/application/dtos/StaffDto';

interface StaffSelectorProps {
  selectedStaffId: string | null;
  staffs: StaffDto[];
}

export default function StaffSelector({
  selectedStaffId,
  staffs,
}: StaffSelectorProps) {
  const selectedStaff = staffs.find((s) => s.id === selectedStaffId);

  if (!selectedStaff) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-solid-gray-500">
        <FontAwesomeIcon icon={faUserTie} className="size-4" />
        <span>職員を選択</span>
      </div>
    );
  }

  return (
    <Link
      href={`/admin/staff/${selectedStaff.id}`}
      className={`
        flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm
        transition-colors
        hover:bg-solid-gray-100
      `}
    >
      <FontAwesomeIcon icon={faUserTie} className="size-4" />
      <span className="max-w-32 truncate">{selectedStaff.name}</span>
    </Link>
  );
}
