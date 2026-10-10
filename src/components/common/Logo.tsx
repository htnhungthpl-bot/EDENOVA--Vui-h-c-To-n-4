/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Vui học Toán 4',
  className = '',
  onClick,
}) => {
  const iconSizes = {
    sm: 28,
    md: 38,
    lg: 48,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconDim = iconSizes[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* SVG Icon: Sách mở + Điểm kết nối tri thức + Ngôi sao sáng tạo */}
      <svg
        width={iconDim}
        height={iconDim}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-label="Biểu trưng EDUNOVA"
      >
        <defs>
          <linearGradient id="bookGradientLeft" x1="6" y1="20" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F294A" />
            <stop offset="1" stopColor="#1E4B82" />
          </linearGradient>
          <linearGradient id="bookGradientRight" x1="24" y1="20" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284C7" />
            <stop offset="1" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="starGradient" x1="24" y1="4" x2="24" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Cánh sách bên trái */}
        <path
          d="M24 38C19 35.5 12 34 6 36V18C12 16.5 19 18 24 20.5V38Z"
          fill="url(#bookGradientLeft)"
          opacity="0.95"
        />

        {/* Cánh sách bên phải */}
        <path
          d="M24 38C29 35.5 36 34 42 36V18C36 16.5 29 18 24 20.5V38Z"
          fill="url(#bookGradientRight)"
        />

        {/* Gáy sách tinh tế */}
        <path
          d="M24 20.5V38.5"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />

        {/* Các đường kết nối mạng lưới tri thức (AI connection lines) */}
        <path
          d="M13 25L18 23M18 23L22 26M30 26L34 23M34 23L39 25"
          stroke="#E0F2FE"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
          opacity="0.8"
        />

        {/* Các điểm nút mạng lưới (knowledge nodes) */}
        <circle cx="13" cy="25" r="2" fill="#F8FAFC" stroke="#0284C7" strokeWidth="1" />
        <circle cx="18" cy="23" r="2.2" fill="#38BDF8" />
        <circle cx="34" cy="23" r="2.2" fill="#38BDF8" />
        <circle cx="39" cy="25" r="2" fill="#F8FAFC" stroke="#0284C7" strokeWidth="1" />

        {/* Ngôi sao tri thức vươn lên (Spark of breakthrough) */}
        <path
          d="M24 4L26.2 10.3L32 11.8L27.5 15.6L28.8 21.5L24 18.2L19.2 21.5L20.5 15.6L16 11.8L21.8 10.3L24 4Z"
          fill="url(#starGradient)"
        />
        {/* Điểm sáng trung tâm ngôi sao */}
        <circle cx="24" cy="13" r="1.5" fill="#FEF3C7" />
      </svg>

      {/* Typography: Tên thương hiệu & Phân hệ */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight text-[#0F294A] ${textSizes[size]}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            EDU<span className="text-sky-600">NOVA</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] sm:text-[11px] font-medium tracking-normal text-slate-500 mt-0.5 leading-tight">
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
