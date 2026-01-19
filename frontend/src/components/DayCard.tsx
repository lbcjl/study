import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DayItinerary } from '../hooks/useItineraryParser'
import RouteMap, { Location as MapLocation } from './RouteMap'
import './DayCard.css'

interface DayCardProps {
	day: DayItinerary
	index: number
}

export default function DayCard({ day, index }: DayCardProps) {
	const isOverview = day.day === '行程总览'
	const title = day.day || `第 ${index + 1} 天`

	// 计算每日总花销
	const totalCost =
		day.dailyCost ||
		day.locations.reduce((sum, loc) => {
			const costMatch = loc.cost?.match(/\d+/)
			const costValue = costMatch ? parseInt(costMatch[0]) : 0
			return sum + costValue
		}, 0)

	return (
		<div className={`day-card ${isOverview ? 'overview-card' : ''}`}>
			<div className='day-header'>
				<div className={`day-badge ${isOverview ? 'overview-badge' : ''}`}>
					{isOverview ? '序' : index}
				</div>
				<div className='day-title-section'>
					<h3>{isOverview ? '行程亮点与准备' : title}</h3>
					<div className='day-meta'>
						{day.weather && (
							<span className='weather-tag' title='天气'>
								☀️ {day.weather}
							</span>
						)}
						{totalCost > 0 && (
							<span className='cost-tag' title='预计花销'>
								💰 ¥{totalCost}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* New: Day Description (Theme/Intro) */}
			{day.description && (
				<div className='day-description markdown-body'>
					{/* 使用 Markdown 渲染描述，解决纯文本堆砌问题 */}
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{day.description}
					</ReactMarkdown>
				</div>
			)}

			{/* Conditional Rendering: Transport List OR Accommodation List vs Timeline */}
			{day.day === '往返及城际交通' || day.day === '住宿推荐' ? (
				<div className='transport-list'>
					{day.locations.map((loc, idx) => (
						<div key={idx} className='transport-card-item'>
							<div className='transport-type-icon'>
								{day.day === '住宿推荐'
									? '🏨'
									: loc.name.includes('飞') || loc.name.includes('机')
										? '✈️'
										: loc.name.includes('车')
											? '🚄'
											: '🚗'}
							</div>
							<div className='transport-details'>
								<h4>{loc.name}</h4>
								<p>{loc.description || loc.address}</p>
							</div>
							{loc.cost && (
								<div className='transport-price'>
									{loc.cost.includes('¥') ? loc.cost : `¥${loc.cost}`}
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<div className='day-timeline'>
					{day.locations.map((loc, idx) => (
						<div key={idx} className='timeline-item'>
							<div className='timeline-time'>{loc.time || '待定'}</div>
							<div className='timeline-content'>
								<div className='timeline-header-row'>
									<div className='timeline-title'>
										<span className='loc-name'>{loc.name}</span>
										<span className={`loc-tag ${loc.type || 'attraction'}`}>
											{loc.type === 'restaurant'
												? '美食'
												: loc.type === 'hotel'
													? '住宿'
													: '景点'}
										</span>
									</div>
									{loc.cost && (
										<div className='timeline-cost'>
											{loc.cost.includes('¥') || loc.cost.includes('免费')
												? loc.cost
												: `¥${loc.cost}`}
										</div>
									)}
								</div>
								<div className='timeline-desc markdown-body'>
									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{loc.description || loc.address}
									</ReactMarkdown>
								</div>

								{/* New: Highlights & Food */}
								{(loc.highlights?.length || 0) > 0 && (
									<div className='timeline-extra'>
										<span className='extra-label'>✨ 亮点:</span>
										<div className='extra-tags'>
											{loc.highlights?.map((h, i) => (
												<span key={i} className='highlight-tag'>
													{h}
												</span>
											))}
										</div>
									</div>
								)}

								{(loc.food?.length || 0) > 0 && (
									<div className='timeline-extra'>
										<span className='extra-label'>🍜 推荐:</span>
										<div className='extra-tags'>
											{loc.food?.map((f, i) => (
												<span key={i} className='food-tag'>
													{f}
												</span>
											))}
										</div>
									</div>
								)}

								{/* New: Transportation to Next Stop */}
								{loc.transportation && (
									<div className='timeline-transport'>
										<div className='transport-icon'>↓</div>
										<div className='transport-info'>
											<span className='transport-method'>
												{loc.transportation.method || '前往下一站'}
											</span>
											{loc.transportation.duration && (
												<span className='transport-meta'>
													{loc.transportation.duration}
												</span>
											)}
											{loc.transportation.cost && (
												<span className='transport-meta'>
													{loc.transportation.cost}
												</span>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Map Section - Skip for Overview/Transport/Accommodation which have no specific points */}
			{!isOverview &&
				day.day !== '往返及城际交通' &&
				day.day !== '住宿推荐' && (
					<div className='day-map-wrapper'>
						<RouteMap
							locations={day.locations as unknown as MapLocation[]}
							height='300px'
							mapId={`day-${index}`}
						/>
					</div>
				)}

			{/* New: Tips Section */}
			{day.tips && day.tips.length > 0 && (
				<div className='day-tips markdown-body'>
					<div className='tips-header'>💡 实用小贴士</div>
					<div className='tips-content'>
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{day.tips.join('\n')}
						</ReactMarkdown>
					</div>
				</div>
			)}
		</div>
	)
}
