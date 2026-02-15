import type { ReactNode } from 'react';
import Link from 'next/link';
import Divider from '@/components/ui/Divider/Divider';
import SupportText from '@/components/ui/SupportText/SupportText';

interface StatCardProps {
  title: ReactNode;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  colorClass?: string;
  /** リンク先URL。指定するとカード全体がクリック可能なリンクになる */
  href?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  colorClass = 'text-blue-600',
  href,
}: StatCardProps) {
  const cardContent = (
    <>
      <div
        className={`
          mb-2 flex items-start justify-between
          sm:mb-4
        `}
      >
        <h3
          className={`
            text-[10px] leading-tight font-medium
            sm:text-sm
          `}
        >
          {title}
        </h3>
        {icon && (
          <div
            className={`
              ${colorClass}
              hidden text-xl
              sm:block
            `}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={`
          text-xl font-bold
          ${colorClass}
          mb-1
          sm:mb-2 sm:text-4xl
        `}
      >
        {value}
      </div>
      {subtitle && (
        <>
          <Divider
            className={`
              my-1
              sm:my-3
            `}
          />
          <SupportText
            className={`
              text-[10px]
              sm:text-xs
            `}
          >
            {subtitle}
          </SupportText>
        </>
      )}
      {href && (
        <>
          <Divider
            className={`
              my-1
              sm:my-3
            `}
          />
          <span
            className={`
              text-[10px] font-medium text-blue-600
              sm:text-xs
            `}
          >
            一覧を見る &rarr;
          </span>
        </>
      )}
    </>
  );

  const baseClassName = `
    block rounded-lg border border-solid-gray-200 bg-white p-3 shadow-sm
    sm:p-6
  `;

  if (href) {
    return (
      <Link
        href={href}
        className={`
          ${baseClassName}
          cursor-pointer no-underline transition-shadow
          hover:shadow-lg
        `}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={baseClassName}>
      {cardContent}
    </div>
  );
}
