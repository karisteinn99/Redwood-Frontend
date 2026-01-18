import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = false,
}) => {
  const baseClasses = 'bg-white/10 backdrop-blur-sm border border-white/20';
  const hoverClasses = hover
    ? 'hover:bg-white/15 hover:scale-105 hover:border-white/40 transition-all duration-200 cursor-default select-none'
    : '';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
