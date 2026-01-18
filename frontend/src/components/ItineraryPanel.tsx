import DayCard from './DayCard'
import { useItineraryParser } from '../hooks/useItineraryParser'
import './ItineraryPanel.css'

interface ItineraryPanelProps {
	content: string
	loading?: boolean
}

export default function ItineraryPanel({
	content,
	loading = false,
}: ItineraryPanelProps) {
	const { days, loading: parsing } = useItineraryParser(content)

	const hasContent = days.length > 0

	// 调试日志
	console.log('ItineraryPanel - 解析状态:', {
		contentLength: content?.length || 0,
		parsing,
		daysCount: days.length,
		hasContent,
	})

	if (days.length > 0) {
		console.log(
			'ItineraryPanel - 解析到的天数:',
			days.map((d, i) => ({
				index: i,
				day: d.day,
				locationsCount: d.locations.length,
			}))
		)
	}

	return (
		<div className='itinerary-panel'>
			<div className='panel-header'>
				<div className='panel-title'>
					<span className='icon'>🗺️</span>
					<h2>行程安排</h2>
					{hasContent && (
						<span className='day-count-badge'>{days.length}天</span>
					)}
				</div>
				{(parsing || loading) && (
					<span className='status-tag'>正在规划路线...</span>
				)}
			</div>

			<div className='panel-content card-list-view'>
				{hasContent ? (
					<div className='cards-container'>
						{days.map((day, index) => (
							<DayCard key={index} day={day} index={index} />
						))}
					</div>
				) : (
					<div className='empty-state'>
						<div className='empty-icon'>🌏</div>
						<h3>等待生成行程</h3>
						<p>在左侧与 AI 对话，生成的每天行程卡片将显示在这里。</p>
					</div>
				)}
			</div>
		</div>
	)
}
