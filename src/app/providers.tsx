'use client';

import { HeroUIProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClientをコンポーネント内で作成（サーバーとクライアント間で共有を防ぐため）
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // BFCache復元時のチラつき防止のため、自動リフェッチを全て無効化
            // 更新が必要な場合は明示的にinvalidateQueries/refetchQueriesを呼ぶ
            staleTime: Infinity, // データを古い扱いにしない
            gcTime: 30 * 60 * 1000, // 30分間キャッシュを保持（戻った時にキャッシュが残るように）
            refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再取得を無効化
            refetchOnReconnect: false, // 再接続時の自動再取得を無効化
            refetchOnMount: false, // マウント時の自動再取得を無効化
            retry: 1, // 失敗時のリトライ回数
          },
          mutations: {
            // Mutation のデフォルト設定
            retry: false, // Mutationは基本的にリトライしない
          },
        },
      })
  );

  return (
    <NuqsAdapter>
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUIProvider>
            {children}
            <Toaster />
          </HeroUIProvider>
        </QueryClientProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}
