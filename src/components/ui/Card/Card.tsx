import { type ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  id?: string;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = ({
  children,
  title,
  className = '',
  padding = 'md',
  id,
}: CardProps) => {
  return (
    <div
      id={id}
      className={`
        rounded-lg border border-solid-gray-200 bg-white shadow-sm
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {title && (
        <h2 className="mb-4 text-xl font-semibold text-blue-900">{title}</h2>
      )}
      {children}
    </div>
  );
};
