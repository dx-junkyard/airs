'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: IconDefinition;
  onClick?: () => void;
  isCollapsed?: boolean;
}

const SidebarNavItem = ({
  href,
  label,
  icon,
  onClick,
  isCollapsed = false,
}: SidebarNavItemProps) => {
  const pathname = usePathname();

  // アクティブ状態の判定（完全一致、または子ルートの場合）
  const isActive =
    pathname === href ||
    (href !== '/' && pathname.startsWith(href) && pathname !== '/');

  return (
    <Link href={href} onClick={onClick} title={isCollapsed ? label : undefined}>
      <motion.div
        className={`
          flex cursor-pointer items-center rounded-r-lg py-3 transition-colors
          duration-200
          ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'}
          ${
            isActive
              ? 'border-l-4 border-blue-600 bg-blue-100 font-bold text-blue-900'
              : `
                border-l-4 border-transparent text-solid-gray-700
                hover:bg-solid-gray-100 hover:text-solid-gray-900
              `
          }
        `}
        whileHover={{ x: isActive ? 0 : 2 }}
        transition={{ duration: 0.2 }}
      >
        <FontAwesomeIcon icon={icon} className="size-5 shrink-0" />
        {!isCollapsed && <span className="text-sm">{label}</span>}
      </motion.div>
    </Link>
  );
};

export default SidebarNavItem;
