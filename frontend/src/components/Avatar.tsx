import './Avatar.css'

interface AvatarProps {
	name?: string
	size?: 'sm' | 'md' | 'lg' | 'xl'
	className?: string
	onClick?: () => void
}

const colors = [
	'linear-gradient(135deg, #fca5a5, #ef4444)', // Red
	'linear-gradient(135deg, #fdba74, #f97316)', // Orange
	'linear-gradient(135deg, #fcd34d, #f59e0b)', // Amber
	'linear-gradient(135deg, #86efac, #22c55e)', // Green
	'linear-gradient(135deg, #67e8f9, #06b6d4)', // Cyan
	'linear-gradient(135deg, #93c5fd, #3b82f6)', // Blue
	'linear-gradient(135deg, #c4b5fd, #8b5cf6)', // Violet
	'linear-gradient(135deg, #f0abfc, #d946ef)', // Fuchsia
]

export default function Avatar({
	name = 'User',
	size = 'md',
	className = '',
	onClick,
}: AvatarProps) {
	// Generate consistent color from name
	const charCode = name.charCodeAt(0) || 0
	const colorIndex = charCode % colors.length
	const bg = colors[colorIndex]

	const initial = name.charAt(0).toUpperCase()

	return (
		<div
			className={`avatar avatar-${size} ${className}`}
			style={{ background: bg }}
			onClick={onClick}
			title={name}
		>
			{initial}
		</div>
	)
}
