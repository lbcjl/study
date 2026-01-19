export interface Location {
	order?: number
	name: string
	address: string
	lat?: number
	lng?: number
	type?: 'attraction' | 'restaurant' | 'hotel'
	time?: string
	duration?: string
	cost?: string
	description?: string
	highlights?: string[]
	food?: string[]
	transportation?: {
		nextLocation?: string
		method?: string
		duration?: string
		cost?: string
	}
}

export interface DayItinerary {
	day: string
	locations: Location[]
	weather?: string
	dailyCost?: number
	description?: string // Day theme or intro
	tips?: string[] // Tips for the day
}

/**
 * 解析Markdown表格行，按天分组
 */
export const parseMarkdownTable = (content: string): DayItinerary[] => {
	const lines = content.split('\n')
	const days: DayItinerary[] = []

	let currentDayTitle = '行程总览'
	let currentLocations: any[] = []
	let currentWeather: string | undefined
	let currentDailyCost: number | undefined
	let currentDescription: string[] = [] // Lines before table
	let currentTips: string[] = [] // Lines after table
	let insideTable = false
	let hasSeenTable = false // To distinguish description (before) vs tips (after)

	// 动态表头索引
	let headerMap: { [key: string]: number } = {}

	const flushCurrentDay = () => {
		if (currentLocations.length > 0) {
			const existingDay = days.find((d) => d.day === currentDayTitle)
			const description =
				currentDescription.length > 0
					? currentDescription.join('\n').trim()
					: undefined
			const tips = currentTips.length > 0 ? [...currentTips] : undefined

			if (existingDay) {
				existingDay.locations = [...existingDay.locations, ...currentLocations]
				if (!existingDay.weather && currentWeather)
					existingDay.weather = currentWeather
				if (!existingDay.dailyCost && currentDailyCost)
					existingDay.dailyCost = currentDailyCost
				if (!existingDay.description && description)
					existingDay.description = description
				if (tips) {
					existingDay.tips = existingDay.tips
						? [...existingDay.tips, ...tips]
						: tips
				}
			} else {
				days.push({
					day: currentDayTitle,
					locations: [...currentLocations],
					weather: currentWeather,
					dailyCost: currentDailyCost,
					description,
					tips,
				})
			}
			currentLocations = []
			currentDescription = []
			currentTips = []
			currentWeather = undefined
			currentDailyCost = undefined
			hasSeenTable = false
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		// 1. Detect Day Title
		const dayMatch = line.match(
			/#{2,4}\s*(第[\d一二三四五六七八九十]+天|Day\s*\d+|D\d+)/i,
		)
		if (dayMatch) {
			if (insideTable) insideTable = false
			flushCurrentDay()
			currentDayTitle = dayMatch[1]
			continue
		}

		// 1.1 Detect Transport Section
		const transportMatch = line.match(/#{2,4}\s*.*(?:交通|往返).*/)
		if (transportMatch && !line.includes('市内')) {
			if (insideTable) insideTable = false
			flushCurrentDay()
			currentDayTitle = '往返及城际交通'
			continue
		}

		// 1.2 Detect Accommodation Section
		const hotelMatch = line.match(/#{2,4}\s*.*(?:住宿|酒店).*/)
		if (hotelMatch) {
			if (insideTable) insideTable = false
			flushCurrentDay()
			currentDayTitle = '住宿推荐'
			continue
		}

		// 1.3 Parse List Items for Transport OR Accommodation
		if (
			(currentDayTitle === '往返及城际交通' ||
				currentDayTitle === '住宿推荐') &&
			(line.startsWith('-') || line.startsWith('*'))
		) {
			const costMatch = line.match(/(?:¥|￥|约|Cost)\s*(\d+)/i)
			if (costMatch) {
				const costVal = costMatch[1]
				const textContent = line.replace(/[*#\-]/g, '').trim()

				// Better name extraction: Split by colon, but ignore "Price/Cost" labels
				const parts = textContent.split(/[：:]/)
				let nameCandidate = parts[0].trim()

				// Filter out garbage names
				const garbageNames = ['票价', '参考价', '费用', '价格', '预算', '花费']
				if (garbageNames.some((g) => nameCandidate.includes(g))) {
					// Likely a price line, not a standalone item. Skip or merge?
					// For now, let's skip it to avoid "Ticket Price" items
					continue
				}

				currentLocations.push({
					name: nameCandidate,
					type: currentDayTitle === '住宿推荐' ? 'hotel' : 'transport',
					address: textContent,
					cost: costVal,
					description: textContent,
				})
			}
			continue
		}

		// 1.5 Detect Weather & Cost (Metadata)
		const weatherMatch = line.match(
			/>\s*\*\*(?:天气|Weather)\*\*[：:]\s*([^\n]+)/i,
		)
		if (weatherMatch) {
			currentWeather = weatherMatch[1].trim()
			continue
		}

		const costMatch = line.match(
			/>\s*\*\*(?:今日预计花销|Daily Cost|预算|Cost)\*\*[：:]\s*([^\n]+)/i,
		)
		if (costMatch) {
			const costStr = costMatch[1].trim()
			const costNum = parseInt(costStr.replace(/[^\d]/g, ''))
			if (!isNaN(costNum)) {
				currentDailyCost = costNum
			}
			continue
		}

		// 2. Detect Table Start
		if (
			line.startsWith('|') &&
			line.includes('序号') &&
			(line.includes('名称') || line.includes('地点'))
		) {
			insideTable = true
			hasSeenTable = true

			const headers = line
				.split('|')
				.slice(1, -1)
				.map((h) => h.trim())

			headerMap = {}
			headers.forEach((h, idx) => {
				if (h.includes('序号')) headerMap['order'] = idx
				else if (h.includes('时间')) headerMap['time'] = idx
				else if (h.includes('名称') || h.includes('地点'))
					headerMap['name'] = idx
				else if (h.includes('地址') || h.includes('位置'))
					headerMap['address'] = idx
				else if (h.includes('类型')) headerMap['type'] = idx
				else if (h.includes('时长') || h.includes('建议时长'))
					headerMap['duration'] = idx
				else if (
					h.includes('费用') ||
					h.includes('花费') ||
					h.includes('门票') ||
					h.includes('人均')
				)
					headerMap['cost'] = idx
				else if (h.includes('描述') || h.includes('备注'))
					headerMap['description'] = idx
				else if (h.includes('推荐') || h.includes('亮点'))
					headerMap['highlights'] = idx
				else if (h.includes('美食') || h.includes('餐饮'))
					headerMap['food'] = idx
				else if (h.includes('交通')) headerMap['transportation'] = idx
			})
			continue
		}

		// 3. Skip Divider
		if (insideTable && line.startsWith('|') && line.includes('---')) {
			continue
		}

		// 4. Parse Table Content
		if (insideTable && line.startsWith('|')) {
			const dirtyValues = line.split('|')
			if (dirtyValues.length < 3) continue

			const cleanValues = dirtyValues.slice(1, -1).map((v) => v.trim())
			const getVal = (key: string) => {
				const idx = headerMap[key]
				if (idx !== undefined && idx < cleanValues.length) {
					return cleanValues[idx]
				}
				// Parsing fallback
				if (key === 'order') return cleanValues[0]
				if (key === 'time') return cleanValues[1]
				if (key === 'type') return cleanValues[2]
				if (key === 'name') return cleanValues[3]
				if (key === 'address') return cleanValues[4]
				return ''
			}

			const name = getVal('name')
			const address = getVal('address')
			const isTimeLike = (str: string) =>
				/^[\d:：\s-]+$/.test(str) && str.includes(':')

			const isInvalidName = (str: string) => {
				if (!str || str === '-') return true
				if (/^[\d\.]+\s*(分钟|min|h|小时|hours?)$/i.test(str)) return true
				if (/^\d+$/.test(str)) return true
				const invalidKeywords = [
					'未找到',
					'暂无',
					'待定',
					'无',
					'推荐',
					'建议时长',
					'费用',
				]
				if (invalidKeywords.includes(str)) return true
				return false
			}

			if (name && !isInvalidName(name) && !isTimeLike(name)) {
				const location: any = {}
				location.order =
					parseInt(getVal('order')) || currentLocations.length + 1
				location.time = getVal('time')
				location.type = mapTypeToEn(getVal('type'))
				location.name = name
				location.address = address && address !== '-' ? address : name
				location.duration = getVal('duration')
				location.cost = getVal('cost')
				location.description = getVal('description')

				const highlightsStr = getVal('highlights')
				location.highlights =
					highlightsStr && highlightsStr !== '-'
						? highlightsStr.split(/[,、，]/).map((s) => s.trim())
						: []

				const foodStr = getVal('food')
				location.food =
					foodStr && foodStr !== '-'
						? foodStr.split(/[,、，]/).map((s) => s.trim())
						: []

				const transportStr = getVal('transportation')
				if (transportStr && transportStr !== '-') {
					location.transportation = { method: transportStr }
				}
				currentLocations.push(location)
			}
		} else if (insideTable && line === '') {
			insideTable = false
			// Do NOT flush here, because we might have tips after the table
		} else if (!insideTable && line) {
			// 5. Capture text content (Narrative or Tips)
			// Filter out metadata markers we already processed
			if (!line.startsWith('>')) {
				if (!hasSeenTable) {
					// Before table -> Description / Theme
					currentDescription.push(line)
				} else {
					// After table -> Tips
					// Simple heuristic: if it looks like a list item or note
					currentTips.push(line)
				}
			}
		}
	}

	flushCurrentDay()

	if (days.length === 0 && currentLocations.length > 0) {
		days.push({ day: '行程', locations: currentLocations })
	}

	return days
}

const mapTypeToEn = (typeCb: string): 'attraction' | 'restaurant' | 'hotel' => {
	if (typeCb.includes('餐厅') || typeCb.includes('美食')) return 'restaurant'
	if (typeCb.includes('酒店') || typeCb.includes('住宿')) return 'hotel'
	return 'attraction'
}
