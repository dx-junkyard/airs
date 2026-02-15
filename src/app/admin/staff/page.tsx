import Link from 'next/link';
import Button from '@/components/ui/Button/Button';
import { getStaffs } from '@/features/staff/actions';
import StaffListWithSearch from '@/features/staff/components/StaffListWithSearch';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const staffs = await getStaffs();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/admin/staff/new">
          <Button variant="solid-fill" size="md">
            新規作成
          </Button>
        </Link>
      </div>

      <StaffListWithSearch staffs={staffs} />
    </div>
  );
}
