import './TravelPlanCard.css'

interface TravelPlanCardProps {
	content: string
}

// 提取旅行计划的关键信息
function extractTravelInfo(content: string) {
	const info: {
		destination?: string
		duration?: string
		budget?: string
		transportation?: { outbound?: string; return?: string }
		accommodation?: string[]
		dayCount?: number
	} = {}

	// 提取目的地
	const destMatch = content.match(/目的地[:：]\s*([^\n]+)/)
	if (destMatch) info.destination = destMatch[1].trim()

	// 提取天数
	const daysMatch = content.match(/(\d+)\s*天/)
	if (daysMatch) info.dayCount = parseInt(daysMatch[1])

	// 提取预算
	const budgetMatch = content.match(/预算[:：]\s*([^\n]+)/)
	if (budgetMatch) info.budget = budgetMatch[1].trim()

	// 提取往返交通
	const outboundMatch = content.match(/去程[:：]\s*([^\n]+)/i)
	const returnMatch = content.match(/返程[:：]\s*([^\n]+)/i)
	if (outboundMatch || returnMatch) {
		info.transportation = {
			outbound: outboundMatch?.[1].trim(),
			return: returnMatch?.[1].trim(),
		}
	}

	// 提取住宿
	const hotelMatches = content.match(/\*\*([^*]+酒店[^*]*)\*\*/g)
	if (hotelMatches) {
		info.accommodation = hotelMatches
			.map((h) => h.replace(/\*\*/g, '').trim())
			.slice(0, 2)
	}

	return info
}

export default function TravelPlanCard({ content }: TravelPlanCardProps) {
	const info = extractTravelInfo(content)

	return (
		<div className='travel-plan-card'>
			<div className='plan-header'>
				<div className='plan-icon'>✈️</div>
				<div className='plan-title'>
					<h3>
						{info.destination || '旅行'}计划
						{info.dayCount && (
							<span className='day-badge'>{info.dayCount}天</span>
						)}
					</h3>
					{info.budget && <p className='plan-budget'>💰 {info.budget}</p>}
				</div>
			</div>

			<div className='plan-sections'>
				{info.transportation && (
					<div className='plan-section'>
						<div className='section-label'>🚄 交通安排</div>
						<div className='section-content'>
							{info.transportation.outbound && (
								<div className='transport-item'>
									<span className='transport-label'>去程</span>
									<span className='transport-value'>
										{info.transportation.outbound.substring(0, 60)}...
									</span>
								</div>
							)}
							{info.transportation.return && (
								<div className='transport-item'>
									<span className='transport-label'>返程</span>
									<span className='transport-value'>
										{info.transportation.return.substring(0, 60)}...
									</span>
								</div>
							)}
						</div>
					</div>
				)}

				{info.accommodation && info.accommodation.length > 0 && (
					<div className='plan-section'>
						<div className='section-label'>🏨 住宿推荐</div>
						<div className='section-content'>
							{info.accommodation.map((hotel, idx) => (
								<div key={idx} className='hotel-item'>
									{hotel}
								</div>
							))}
						</div>
					</div>
				)}

				<div className='plan-section'>
					<div className='section-label'>📅 行程详情</div>
					<div className='section-content'>
						<p className='view-tip'>
							👉 详细行程已在右侧地图面板中展示，包括每日景点、餐饮安排
						</p>
					</div>
				</div>
			</div>

			<div className='plan-footer'>
				<button className='view-details-btn'>查看完整方案</button>
			</div>
		</div>
	)
}
