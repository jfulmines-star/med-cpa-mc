import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
      outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    }
    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg',
      default: 'h-9 px-4 text-sm rounded-lg',
      lg: 'h-11 px-6 text-sm rounded-xl',
      icon: 'h-9 w-9 rounded-lg',
    }
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant], sizes[size], className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
export { Button }
