import React from 'react';

interface ExpeditionLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
}

export const ExpeditionLogo: React.FC<ExpeditionLogoProps> = ({
  className = '',
  size = 'md',
  showGlow = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-20 h-20 sm:w-28 sm:h-28',
    xl: 'w-36 h-36 sm:w-44 sm:h-44',
  };

  return (
    <div
      className={`relative shrink-0 rounded-full select-none ${sizeClasses[size]} ${
        showGlow ? 'glow-orange' : ''
      } ${className}`}
    >
      <img
        src="/assets/logo.svg"
        alt="Belka & Strelka Open Galactic Circumnavigation Scientific Expedition Official Patch"
        className="w-full h-full object-contain rounded-full shadow-lg"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
