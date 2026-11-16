import React from 'react';

interface BrandWordmarkProps {
  className?: string;
  invert?: boolean;
  alt?: string;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  className = '',
  invert = false,
  alt = 'FeLoW WebStaR'
}) => {
  return (
    <img
      src="/assets/aistudio/felow-webstar-side-by-side_1__1df0def6.svg"
      alt={alt}
      className={`inline-block h-[1.02em] w-auto align-[-0.12em] select-none shrink-0 ${
        invert ? 'brightness-0 invert' : ''
      } ${className}`.trim()}
    />
  );
};
