import { type ReactNode } from 'react';

export interface ErrorAlertProps {
  message?: string | ReactNode;
  className?: string;
}

export const ErrorAlert = ({ message, className = '' }: ErrorAlertProps) => {
  if (!message) return null;

  return (
    <div
      className={`
        rounded-lg border border-red-200 bg-red-50 p-4
        ${className}
      `}
      role="alert"
    >
      <div className="text-sm text-red-900">{message}</div>
    </div>
  );
};
