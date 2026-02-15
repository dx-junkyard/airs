import Link from 'next/link';
import Button from '@/components/ui/Button/Button';
import BackButton from '@/app/BackButton';

const NotFound = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-oln-16B-100 text-solid-gray-600">404</p>
        <h1 className="text-dns-32B-140 mt-2 text-solid-gray-900">
          ページが見つかりません
        </h1>
        <p className="text-oln-16N-100 mt-4 text-solid-gray-600">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div
          className={`
            mt-8 flex flex-col items-center gap-3
            sm:flex-row sm:justify-center
          `}
        >
          <Button asChild size="md" variant="solid-fill">
            <Link href="/">ダッシュボードへ戻る</Link>
          </Button>
          <BackButton />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
