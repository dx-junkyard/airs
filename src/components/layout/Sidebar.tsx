'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  faChartLine,
  faComment,
  faList,
  faMobileAlt,
  faQuestionCircle,
  faTimes,
  faMapMarkedAlt,
  faUserTie,
  faSlidersH,
  faBuilding,
  faFileImport,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import SidebarNavItem from '@/components/layout/SidebarNavItem';
import { APP_TITLE } from '@/config/app-branding';
import { isDemoMode } from '@/config/demo-mode';
import { Z_MOBILE_OVERLAY, Z_MOBILE_DRAWER } from '@/constants/z-index';
import { isAdminMode } from '@/config/admin-mode';

const toolsSection = {
  title: 'ツール',
  links: [
    { href: '/', label: '統計ダッシュボード', icon: faChartLine },
    { href: '/map', label: '地図表示', icon: faMapMarkedAlt },
    { href: '/ai-report', label: 'AI獣害通報', icon: faMobileAlt },
    { href: '/line', label: 'LINE公式アカウント', icon: faComment },
    { href: '/help', label: 'ヘルプ', icon: faQuestionCircle },
  ],
};

const adminSection = {
  title: '管理',
  links: [
    { href: '/admin/report', label: '通報管理', icon: faList },
    { href: '/admin/staff', label: '職員管理', icon: faUserTie },
    { href: '/admin/facility', label: '周辺施設管理', icon: faBuilding },
    { href: '/admin/bulk-actions', label: '一括操作', icon: faFileImport },
    { href: '/admin/settings', label: 'システム設定', icon: faSlidersH },
    { href: '/admin/help', label: '管理者用ヘルプ', icon: faQuestionCircle },
  ],
};

// 管理モードの場合のみ管理セクションを表示
const navSections = isAdminMode ? [toolsSection, adminSection] : [toolsSection];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) => {
  return (
    <>
      {/* デスクトップサイドバー */}
      <aside
        className={`
          sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto
          border-r border-solid-gray-200 bg-white transition-all duration-200
          lg:flex
          ${isCollapsed ? 'w-16' : 'w-60'}
        `}
      >
        {/* サイドバーヘッダー */}
        <div
          className={`
            flex h-28 flex-col justify-center
            ${isCollapsed ? 'items-center px-2' : 'px-4'}
          `}
        >
          {!isCollapsed && (
            <>
              <Link
                href="/"
                className={`
                  transition-opacity
                  hover:opacity-80
                `}
              >
                <div className="flex min-w-0 flex-col">
                  <h1 className="text-lg leading-tight font-bold">
                    {APP_TITLE}
                  </h1>
                  <div className="flex items-center gap-2">
                    <p
                      className={`
                        text-base leading-none font-extrabold tracking-wide
                        text-blue-900
                      `}
                    >
                      AIRS
                    </p>
                    {isDemoMode && (
                      <span
                        className={`
                          inline-flex w-fit items-center rounded bg-orange-100
                          px-1.5 py-0.5 text-[10px] leading-none font-extrabold
                          tracking-wide text-orange-700
                        `}
                      >
                        DEMO
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              {isAdminMode && (
                <span className="text-xs font-medium text-orange-600">
                  管理者用
                </span>
              )}
            </>
          )}
        </div>

        <nav className="flex-1 py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!isCollapsed && (
                <h2
                  className={`
                    mb-2 px-4 text-xs font-semibold tracking-wider
                    text-solid-gray-500
                  `}
                >
                  {section.title}
                </h2>
              )}
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <SidebarNavItem
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      isCollapsed={isCollapsed}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* 折りたたみトグルボタン */}
        <div className="border-t border-solid-gray-200 p-2">
          <button
            onClick={onToggleCollapse}
            className={`
              flex w-full items-center justify-center rounded-md py-2
              text-solid-gray-500 transition-colors
              hover:bg-solid-gray-100 hover:text-solid-gray-700
            `}
            aria-label={
              isCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'
            }
            title={isCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          >
            <FontAwesomeIcon
              icon={isCollapsed ? faChevronRight : faChevronLeft}
              className="size-4"
            />
          </button>
        </div>
      </aside>

      {/* モバイルDrawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              className={`
                fixed inset-0 bg-black/50
                lg:hidden
              `}
              style={{ zIndex: Z_MOBILE_OVERLAY }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.aside
              className={`
                fixed top-0 bottom-0 left-0 w-72 bg-white shadow-lg
                lg:hidden
              `}
              style={{ zIndex: Z_MOBILE_DRAWER }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Drawerヘッダー */}
              <div
                className={`
                  flex min-h-24 items-center justify-between border-b
                  border-solid-gray-200 px-4
                `}
              >
                <div className={`flex min-w-0 flex-col`}>
                  <span
                    className={`text-lg leading-tight font-bold text-blue-900`}
                  >
                    {APP_TITLE}
                  </span>
                  <div className="flex items-center gap-2">
                    <p
                      className={`
                        text-sm leading-none font-extrabold tracking-wide
                        text-blue-900
                      `}
                    >
                      AIRS
                    </p>
                    {isDemoMode && (
                      <span
                        className={`
                          inline-flex w-fit items-center rounded bg-orange-100
                          px-1.5 py-0.5 text-[10px] leading-none font-extrabold
                          tracking-wide text-orange-700
                        `}
                      >
                        DEMO
                      </span>
                    )}
                  </div>
                  {isAdminMode && (
                    <span className="text-xs font-medium text-orange-600">
                      管理者用画面
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className={`
                    rounded-md p-2 transition-colors
                    hover:bg-solid-gray-100
                  `}
                  aria-label="メニューを閉じる"
                >
                  <FontAwesomeIcon
                    icon={faTimes}
                    className="size-5 text-solid-gray-700"
                  />
                </button>
              </div>

              {/* ナビゲーション */}
              <nav className="py-4">
                {navSections.map((section) => (
                  <div key={section.title} className="mb-6">
                    <h2
                      className={`
                        mb-2 px-4 text-xs font-semibold tracking-wider
                        text-solid-gray-500
                      `}
                    >
                      {section.title}
                    </h2>
                    <ul className="space-y-1">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <SidebarNavItem
                            href={link.href}
                            label={link.label}
                            icon={link.icon}
                            onClick={onClose}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
