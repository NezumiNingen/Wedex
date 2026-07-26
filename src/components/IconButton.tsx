import type { ButtonHTMLAttributes, ReactNode } from 'react';
export function IconButton({ children, title, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) { return <button title={title} aria-label={title} data-tooltip={title} className={`icon-button ${className}`} {...props}>{children}</button>; }
