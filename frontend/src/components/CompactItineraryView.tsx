import { useMemo } from 'react'
import { parseItineraryContent } from '../utils/itineraryParser'
import './CompactItineraryView.css'

interface CompactItineraryViewProps {
	content: string
}

export default function CompactItineraryView({
	content,
}: CompactItineraryViewProps) {
	const days = useMemo(() => {
		const { days } = parseItineraryContent(content)
		return days
	}, [content])

	if (days.length === 0) return null

	return (
		<div className='compact-itinerary-view'>
			<div className='compact-list'>
				{days.slice(0, 3).map((day, idx) => (
					<div key={idx} className='compact-day-item'>
						<div className='day-badge'>{day.day.replace('Day ', 'D')}</div>
						<div className='day-content'>
							<div className='day-title'>
								{day.description ||
									(day.locations.length > 0
										? `${day.locations.length} 个地点`
										: '行程概览')}
							</div>
							{day.locations.length > 0 && (
								<div className='day-highlights'>
									{day.locations
										.slice(0, 3)
										.map((l) => l.name)
										.join(' → ')}
									{day.locations.length > 3 && ' ...'}
								</div>
							)}
						</div>
					</div>
				))}
				{days.length > 3 && (
					<div
						style={{
							textAlign: 'center',
							fontSize: '12px',
							color: '#9ca3af',
							paddingTop: '4px',
						}}
					>
						... 还有 {days.length - 3} 天行程
					</div>
				)}
			</div>
			<div className='compact-footer'>详情已在右侧面板展开 👉</div>
		</div>
	)
}
