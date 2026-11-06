import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  initials?: string;
}

const sizeClass: Record<string, string> = {
  sm: 'sk-avatar sk-avatar-sm',
  md: 'sk-avatar sk-avatar-md',
  lg: 'sk-avatar sk-avatar-lg',
  xl: 'sk-avatar sk-avatar-xl',
};

export function Avatar({ src, alt, size = 'md', label, initials, className = '', ...props }: AvatarProps) {
  const display = initials ?? label ?? 'U';
  return (
    <div className={`${sizeClass[size]} ${className}`} {...props}>
      {src ? (
        <img src={src} alt={alt ?? display} className="w-full h-full object-cover" />
      ) : (
        display
      )}
    </div>
  );
}
