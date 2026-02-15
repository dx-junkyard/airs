'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button/Button';

const BackButton = () => {
  const router = useRouter();

  return (
    <Button size="md" variant="outline" onClick={() => router.back()}>
      前のページに戻る
    </Button>
  );
};

export default BackButton;
