import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwindcss-merge'

/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 处理条件类名，twMerge 解决冲突
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
