'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'header' | 'xl' | 'hero';
  showText?: boolean;
  className?: string;
  centered?: boolean;
}

const sizeMap = {
  sm: { logo: 48, text: 'text-lg' },
  md: { logo: 64, text: 'text-xl' },
  lg: { logo: 100, text: 'text-2xl' },
  header: { logo: 80, text: 'text-2xl' },
  xl: { logo: 140, text: 'text-3xl' },
  hero: { logo: 200, text: 'text-4xl' },
};

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  centered = false
}: LogoProps) {
  const { logo, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${centered ? 'flex-col' : ''} ${className}`}>
      <Image
        src="/whitecaps-logo.png"
        alt="Whitecaps FC"
        width={logo}
        height={logo}
        className="drop-shadow-lg"
        priority
      />
      {showText && (
        <span className={`${text} font-extrabold text-[#00245D] tracking-tight leading-tight`}>
          Caps Collective
        </span>
      )}
    </div>
  );
}

