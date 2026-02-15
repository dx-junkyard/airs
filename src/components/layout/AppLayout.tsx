'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { breadcrumbOverridesAtom } from '@/atoms/breadcrumbOverridesAtom';
import BreadcrumbItem from '@/components/ui/Breadcrumbs/BreadcrumbItem';
import BreadcrumbList from '@/components/ui/Breadcrumbs/BreadcrumbList';
import Breadcrumbs from '@/components/ui/Breadcrumbs/Breadcrumbs';
import BreadcrumbsLabel from '@/components/ui/Breadcrumbs/BreadcrumbsLabel';
import HamburgerMenuButton from '@/components/ui/HamburgerMenuButton/HamburgerMenuButton';
import UtilityLink from '@/components/ui/UtilityLink/UtilityLink';
import Sidebar from '@/components/layout/Sidebar';
import { APP_TITLE, DEMO_NOTICE_TEXT } from '@/config/app-branding';
import { getPageTitle } from '@/config/page-titles';
import { isDemoMode } from '@/config/demo-mode';
import { Z_HEADER } from '@/constants/z-index';

interface AppLayoutProps {
  children: ReactNode;
  staffSelector?: ReactNode;
  breadcrumbOverrides?: Record<string, string>;
}

const AppLayout = ({
  children,
  staffSelector,
  breadcrumbOverrides = {},
}: AppLayoutProps) => {
  const pathname = usePathname();
  const atomOverrides = useAtomValue(breadcrumbOverridesAtom);
  const mergedOverrides = { ...breadcrumbOverrides, ...atomOverrides };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // /mapページではサイドバーを折り畳み、他のページでは展開する
  useEffect(() => {
    setIsSidebarCollapsed(pathname === '/map');
  }, [pathname]);

  // フッターを非表示にするページ（チャット画面など）
  const hideFooter = pathname === '/ai-report';

  // メインコンテンツの縦パディングを除去し、ビューポート内に収めるページ
  const isFullHeightContent = pathname === '/ai-report';

  // /mapページはサイドバー＋フルスクリーン地図（ヘッダー・フッターなし）
  if (pathname === '/map') {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }

  // パスからパンくずリストを生成
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'ホーム', href: '/' }];

    // /report ページはホームのみ表示
    if (pathname === '/report') {
      return breadcrumbs;
    }

    if (paths.length === 0) {
      return breadcrumbs;
    }

    // 既知のセグメント → 日本語ラベルのマッピング
    const segmentLabels: Record<
      string,
      string | ((currentPath: string) => string)
    > = {
      report: '通報管理',
      event: '通報グループ管理',
      staff: '職員管理',
      facility: '周辺施設管理',
      'ai-report': 'AI獣害通報',
      'bulk-actions': '一括操作',
      line: 'LINE公式アカウント',
      new: '新規作成',
      map: '地図表示',
      analysis: 'データ分析',
      dashboard: 'ダッシュボード',
      settings: (cp: string) =>
        cp.startsWith('/admin') ? 'システム設定' : '設定',
      help: (cp: string) =>
        cp.startsWith('/admin') ? '管理者用ヘルプ' : 'ヘルプ',
    };

    // 動的セグメント（IDなど）の親パスに基づく詳細ラベル
    const detailLabels: Record<string, string> = {
      report: '通報詳細',
      event: '通報グループ詳細',
      staff: '職員詳細',
    };

    // 既知セグメントでもoverride対象でもない場合、動的セグメント（IDなど）とみなす
    const isDynamicSegment = (segment: string) =>
      !(segment in segmentLabels) && segment !== 'admin';

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // adminパスはパンくずに表示しない（スキップ）
      if (path === 'admin') return;

      let label = mergedOverrides[path] ?? path;

      const segmentLabel = segmentLabels[path];
      if (segmentLabel) {
        label =
          typeof segmentLabel === 'function'
            ? segmentLabel(currentPath)
            : segmentLabel;
      } else if (isDynamicSegment(path) && !(path in mergedOverrides)) {
        // 動的セグメント: 直前のパスセグメント（adminを除く）から詳細ラベルを決定
        const parentSegment = [...paths]
          .slice(0, index)
          .filter((s) => s !== 'admin')
          .pop();
        if (parentSegment && detailLabels[parentSegment]) {
          label = detailLabels[parentSegment];
        } else {
          // 不明なセグメント（404ページ等）: 英語パスをそのまま表示しない
          label = 'ページが見つかりません';
        }
      }

      // 最後のパスでない場合のみリンクを追加
      if (index < paths.length - 1) {
        breadcrumbs.push({ label, href: currentPath });
      } else {
        breadcrumbs.push({ label, href: '' });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle(pathname);

  return (
    <div
      className={
        isFullHeightContent
          ? 'flex h-screen overflow-hidden bg-white'
          : 'flex min-h-screen bg-white'
      }
    >
      {/* サイドバー */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* メインコンテンツエリア */}
      <div
        className={
          isFullHeightContent
            ? 'flex min-h-0 min-w-0 flex-1 flex-col'
            : 'flex min-w-0 flex-1 flex-col'
        }
      >
        {/* ヘッダー */}
        <header
          className="sticky top-0 border-b border-solid-gray-200 bg-white"
          style={{ zIndex: Z_HEADER }}
        >
          <div
            className={`
              px-4
              sm:px-6
              lg:px-8
            `}
          >
            {isDemoMode ? (
              <div>
                {/* SP: 2段レイアウト（現状維持） */}
                <div className={`
                  py-2
                  lg:hidden
                `}>
                  <div className="flex h-16 items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <HamburgerMenuButton
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden"
                        aria-label="メニューを開く"
                      >
                        <FontAwesomeIcon icon={faBars} className="size-5" />
                      </HamburgerMenuButton>
                      {pageTitle && (
                        <h1
                          className={`
                            truncate text-lg font-bold
                            sm:text-xl
                          `}
                        >
                          {pageTitle}
                        </h1>
                      )}
                    </div>
                    {staffSelector && <div className="ml-3 shrink-0">{staffSelector}</div>}
                  </div>
                  <p
                    className={`
                      px-2 pb-1 text-center text-[10px] leading-4 font-medium
                      text-orange-700
                      sm:text-[11px]
                    `}
                  >
                    {DEMO_NOTICE_TEXT}
                  </p>
                </div>

                {/* PC: 3カラムgridの横並び */}
                <div
                  className={`
                    hidden min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-3
                    py-2
                    lg:grid
                  `}
                >
                  <div className="min-w-0">
                    {pageTitle && (
                      <h1
                        className={`
                          truncate text-lg font-bold
                          sm:text-xl
                        `}
                      >
                        {pageTitle}
                      </h1>
                    )}
                  </div>
                  <p className="text-xs font-medium text-orange-700">
                    {DEMO_NOTICE_TEXT}
                  </p>
                  <div className="justify-self-end">
                    {staffSelector}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-16 items-center justify-between">
                {/* モバイルメニューボタン */}
                <div className="flex items-center gap-4">
                  <HamburgerMenuButton
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden"
                    aria-label="メニューを開く"
                  >
                    <FontAwesomeIcon icon={faBars} className="size-5" />
                  </HamburgerMenuButton>
                  {/* ページタイトル */}
                  {pageTitle && (
                    <h1
                      className={`
                        text-lg font-bold
                        sm:text-xl
                      `}
                    >
                      {pageTitle}
                    </h1>
                  )}
                </div>

                {/* 職員選択（Server Componentとして描画） */}
                {staffSelector && <div className="ml-auto">{staffSelector}</div>}
              </div>
            )}
          </div>
        </header>

        <div
          className={
            isFullHeightContent
              ? 'flex min-h-0 min-w-0 flex-1 flex-col'
              : 'flex min-w-0 flex-1 flex-col'
          }
        >
          {/* パンくずナビゲーション */}
          <div className="border-b border-solid-gray-200 bg-white">
            <div
              className={`
                px-4 py-3
                sm:px-6
                lg:px-8
              `}
            >
              <Breadcrumbs>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem
                      key={index}
                      isCurrent={index === breadcrumbs.length - 1}
                    >
                      {crumb.href ? (
                        <Link href={crumb.href}>
                          <BreadcrumbsLabel>{crumb.label}</BreadcrumbsLabel>
                        </Link>
                      ) : (
                        <BreadcrumbsLabel aria-current="page">
                          {crumb.label}
                        </BreadcrumbsLabel>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumbs>
            </div>
          </div>

          {/* メインコンテンツ */}
          <main
            className={
              isFullHeightContent
                ? 'min-h-0 flex-1 overflow-hidden'
                : `
                  flex-1 px-4 py-8
                  sm:px-6
                  lg:px-8
                `
            }
          >
            {children}
          </main>

          {!hideFooter && (
            <footer className="mt-auto border-t border-solid-gray-200 bg-white">
              <div
                className={`
                  px-4 py-8
                  sm:px-6
                  lg:px-8
                `}
              >
                <div
                  className={`
                    grid grid-cols-1 gap-8
                    md:grid-cols-3
                  `}
                >
                  <div>
                    <h3 className="mb-4 font-semibold text-blue-900">
                      関連リンク
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        <UtilityLink href="/">トップページ</UtilityLink>
                      </li>
                      <li>
                        <UtilityLink href="/help">使い方ガイド</UtilityLink>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-4 font-semibold text-blue-900">
                      お問い合わせ
                    </h3>
                    <p className="text-sm text-solid-gray-700">
                      システムに関するお問い合わせは、ヘルプページをご確認ください。
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-4 font-semibold text-blue-900">
                      利用サービス
                    </h3>
                    <ul className="space-y-2 text-sm text-solid-gray-700">
                      <li>
                        デザインシステム:{' '}
                        <UtilityLink
                          href="https://www.digital.go.jp/"
                          target="_blank"
                        >
                          デジタル庁
                        </UtilityLink>
                      </li>
                      <li>
                        住所データ:{' '}
                        <UtilityLink
                          href="https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/reversegeocoder.html"
                          target="_blank"
                        >
                          Yahoo!リバースジオコーダAPI
                        </UtilityLink>
                      </li>
                      <li>
                        周辺施設データ: &copy;{' '}
                        <UtilityLink
                          href="https://www.openstreetmap.org/copyright"
                          target="_blank"
                        >
                          OpenStreetMap
                        </UtilityLink>{' '}
                        contributors
                      </li>
                      <li>
                        分析AI:{' '}
                        <UtilityLink
                          href="https://ai.google.dev/"
                          target="_blank"
                        >
                          Google Gemini
                        </UtilityLink>
                      </li>
                      {isDemoMode && (
                        <li>
                          クマ目撃情報データ（京都府）:{' '}
                          <UtilityLink
                            href="https://odm.bodik.jp/tr/dataset/260002_bear"
                            target="_blank"
                          >
                            ODM by BODIK
                          </UtilityLink>
                          {' / '}
                          ライセンス:{' '}
                          <UtilityLink
                            href="https://creativecommons.org/licenses/by/4.0/"
                            target="_blank"
                          >
                            CC BY 4.0
                          </UtilityLink>
                          {' / '}
                          当サイトで表示用に加工
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div
                  className={`
                    mt-8 border-t border-solid-gray-200 pt-8 text-center text-sm
                    text-solid-gray-600
                  `}
                >
                  <p>
                    &copy; {new Date().getFullYear()} {APP_TITLE}.
                    All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
