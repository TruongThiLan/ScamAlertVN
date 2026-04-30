import React from 'react';

interface AvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  name = 'U', 
  size = 'md', 
  className = '',
  showBadge = false 
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full bg-[#E01515] flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-white/10`}
        title={name}
      >
        {getInitials(name)}
      </div>
      {showBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};
