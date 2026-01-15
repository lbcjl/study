import React from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
	helperText?: string
	leftIcon?: React.ReactNode
	rightIcon?: React.ReactNode
}

export function Input({
	label,
	error,
	helperText,
	leftIcon,
	rightIcon,
	className,
	...props
}: InputProps) {
	return (
		<div className='w-full'>
			{label && (
				<label className='block text-sm font-medium text-neutral-700 mb-2'>
					{label}
				</label>
			)}

			<div className='relative'>
				{leftIcon && (
					<div className='absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400'>
						{leftIcon}
					</div>
				)}

				<input
					className={cn(
						'w-full px-4 py-3 border-2 rounded-lg transition-all duration-200',
						'focus:outline-none focus:ring-2 focus:ring-primary-200',
						error
							? 'border-accent-coral focus:border-accent-coral'
							: 'border-neutral-200 focus:border-primary-500',
						leftIcon && 'pl-11',
						rightIcon && 'pr-11',
						className
					)}
					{...props}
				/>

				{rightIcon && (
					<div className='absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400'>
						{rightIcon}
					</div>
				)}
			</div>

			{error && <p className='mt-1 text-sm text-accent-coral'>{error}</p>}

			{helperText && !error && (
				<p className='mt-1 text-sm text-neutral-500'>{helperText}</p>
			)}
		</div>
	)
}
