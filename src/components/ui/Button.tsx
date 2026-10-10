/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isUnimplemented?: boolean;
  onUnimplementedClick?: () => void;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isUnimplemented = false,
  onUnimplementedClick,
  onClick,
  disabled,
  className = '',
  icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#0F294A] text-white hover:bg-[#163761] focus-visible:outline-[#0F294A] shadow-xs',
    secondary:
      'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100 focus-visible:outline-sky-600',
    accent:
      'bg-amber-600 text-white hover:bg-amber-700 focus-visible:outline-amber-600 shadow-xs',
    outline:
      'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus-visible:outline-slate-500',
    ghost:
      'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 shadow-xs',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isUnimplemented) {
      e.preventDefault();
      if (onUnimplementedClick) {
        onUnimplementedClick();
      }
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      title={isUnimplemented ? 'Tính năng này chưa triển khai trong phiên bản hiện tại' : undefined}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {isUnimplemented && (
        <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 border border-slate-300">
          Chưa triển khai
        </span>
      )}
    </button>
  );
};
