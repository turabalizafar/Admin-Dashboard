import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ children, className }) => {
    return (
        <div className={cn(
            "bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 text-card-foreground rounded-xl shadow-lg",
            className
        )}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className }) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);

export const CardTitle = ({ children, className }) => (
    <h3 className={cn("font-semibold leading-none tracking-tight text-xl text-white", className)}>{children}</h3>
);

export const CardContent = ({ children, className }) => (
    <div className={cn("p-6 pt-0", className)}>{children}</div>
);
