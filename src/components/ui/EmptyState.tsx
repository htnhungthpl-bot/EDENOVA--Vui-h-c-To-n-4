/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  isActionUnimplemented?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu',
  description = 'Hệ thống chưa ghi nhận bản ghi nào trong mục này. Dữ liệu sẽ hiển thị khi có hoạt động học tập hoặc khởi tạo lớp học thực tế.',
  actionText,
  onAction,
  isActionUnimplemented = true,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 border border-slate-200">
        {icon || <Database className="w-6 h-6 text-slate-400" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && (
        <Button
          variant="outline"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          isUnimplemented={isActionUnimplemented}
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};
