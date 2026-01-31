import React from 'react';
import { cn } from '../../lib/utils';

export const Button = ({
    children,
    variant = 'primary',
    size = 'default',
    className,
    ...props
}) => {
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20",
        secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        ghost: "hover:bg-zinc-800/50 text-zinc-300 hover:text-white"
    };

    const sizes = {
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-6",
        lg: "h-14 px-8 text-lg"
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
