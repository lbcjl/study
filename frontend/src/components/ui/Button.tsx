import React from 'react'
import { cn } from '@/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
	size?: 'sm' | 'md' | 'lg'
	children: React.ReactNode
}

export function Button({
	variant = 'primary',
	size = 'md',
	className,
	children,
	...props
}: ButtonProps) {
	const baseStyles =
		'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

	const variants = {
		primary:
			'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg',
		secondary:
			'bg-white text-primary-600 border-2 border-primary-500 hover:bg-primary-50',
		outline:
			'bg-transparent text-neutral-700 border-2 border-neutral-300 hover:border-primary-500 hover:text-primary-600',
		ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
	}

	const sizes = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-6 py-3 text-base',
		lg: 'px-8 py-4 text-lg',
	}

	return (
		<button
			className={cn(baseStyles, variants[variant], sizes[size], className)}
			{...props}
		>
			{children}
		</button>
	)
}
