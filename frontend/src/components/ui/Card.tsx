import React from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
	children: React.ReactNode
	className?: string
	hover?: boolean
	padding?: 'none' | 'sm' | 'md' | 'lg'
	onClick?: () => void
}

export function Card({
	children,
	className,
	hover = false,
	padding = 'md',
	onClick,
}: CardProps) {
	const paddings = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8',
	}

	return (
		<div
			className={cn(
				'bg-white rounded-2xl shadow-card',
				hover && 'card-hover-effect cursor-pointer',
				paddings[padding],
				className
			)}
			onClick={onClick}
		>
			{children}
		</div>
	)
}

interface CardHeaderProps {
	children: React.ReactNode
	className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
	return <div className={cn('mb-4', className)}>{children}</div>
}

interface CardTitleProps {
	children: React.ReactNode
	className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
	return (
		<h3 className={cn('text-xl font-bold text-neutral-800', className)}>
			{children}
		</h3>
	)
}

interface CardContentProps {
	children: React.ReactNode
	className?: string
}

export function CardContent({ children, className }: CardContentProps) {
	return <div className={cn('text-neutral-600', className)}>{children}</div>
}

interface CardFooterProps {
	children: React.ReactNode
	className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
	return (
		<div className={cn('mt-4 pt-4 border-t border-neutral-100', className)}>
			{children}
		</div>
	)
}
