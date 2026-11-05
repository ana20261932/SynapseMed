import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

export function Avatar({ src, alt, size = 'md', label = 'U', className = '', ...props }: AvatarProps) {
  const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  return (
    <div
      className={`flex-shrink-0 rounded-full bg-clinic-200 overflow-hidden flex items-center justify-center text-clinic-700 font-semibold border border-clinic-300 ${sizes[size]} ${className}`}
      {...props}
    >
      {src ? <img src={src} alt={alt ?? label} className="w-full h-full object-cover" /> : label}
    </div>
  );
}
