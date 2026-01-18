import { useState, useEffect } from 'react'
import type { Location } from '../components/RouteMap'
import { mapApi } from '../services/mapApi'

export interface DayItinerary {
	day: string
	locations: Location[]
	weather?: string // 天气信息
	dailyCost?: number // 每日花销总计
}

/**
 * 解析Markdown表格行，按天分组
 */
const parseMarkdownTable = (content: string): DayItinerary[] => {
	const lines = content.split('\n')
	const days: DayItinerary[] = []

	let currentDayTitle = '行程总览'
	let currentLocations: any[] = []
	let insideTable = false

	// 动态表头索引
	let headerMap: { [key: string]: number } = {}

	const flushCurrentDay = () => {
		if (currentLocations.length > 0) {
			const existingDay = days.find((d) => d.day === currentDayTitle)
			if (existingDay) {
				existingDay.locations = [...existingDay.locations, ...currentLocations]
			} else {
				days.push({
					day: currentDayTitle,
					locations: [...currentLocations],
				})
			}
			currentLocations = []
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		// 1. 检测日期标题
		const dayMatch = line.match(
			/#{2,4}\s*(第[\d一二三四五六七八九十]+天|Day\s*\d+|D\d+)/i
		)
		if (dayMatch) {
			if (insideTable) {
				insideTable = false
			}
			flushCurrentDay()
			currentDayTitle = dayMatch[1]
			continue
		}

		// 2. 检测表格开始 (表头行)
		if (
			line.startsWith('|') &&
			line.includes('序号') &&
			(line.includes('名称') || line.includes('地点'))
		) {
			insideTable = true

			// 解析表头，建立索引映射
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
				else if (h.includes('费用') || h.includes('花费'))
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

		// 3. 跳过分隔行
		if (insideTable && line.startsWith('|') && line.includes('---')) {
			continue
		}

		// 4. 解析表格内容行
		if (insideTable && line.startsWith('|')) {
			// 简单的 split 可能无法处理包含 | 的内容，但在 Markdown 表格中 | 通常会被转义
			const dirtyValues = line.split('|')

			// 确保行是完整的（前后都有 |）
			if (dirtyValues.length < 3) continue

			const cleanValues = dirtyValues.slice(1, -1).map((v) => v.trim())

			// 辅助函数：根据表头获取值
			const getVal = (key: string) => {
				const idx = headerMap[key]
				if (idx !== undefined && idx < cleanValues.length) {
					return cleanValues[idx]
				}
				// 回退机制：如果没有找到表头映射，尝试使用旧的硬编码索引(作为最后的手段)
				if (key === 'order') return cleanValues[0]
				if (key === 'time') return cleanValues[1]
				if (key === 'type') return cleanValues[2]
				if (key === 'name') return cleanValues[3] // 假设
				if (key === 'address') return cleanValues[4] // 假设
				return ''
			}

			const name = getVal('name')
			const address = getVal('address')

			// 验证有效性：不能是空，不能是占位符 '-'，名字看起来不能像时间
			const isTimeLike = (str: string) =>
				/^[\d:：\s-]+$/.test(str) && str.includes(':')

			// 增强过滤：过滤掉看起来像时长、纯数字或无效关键词的内容
			const isInvalidName = (str: string) => {
				if (!str || str === '-') return true
				// 过滤时长 (e.g., "60分钟", "1小时", "2h", "1.5 hours")
				if (/^[\d\.]+\s*(分钟|min|h|小时|hours?)$/i.test(str)) return true
				// 过滤纯数字
				if (/^\d+$/.test(str)) return true
				// 过滤特定无效词
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
				location.address = address && address !== '-' ? address : name // 如果没有地址，用名字代替
				location.duration = getVal('duration')
				location.cost = getVal('cost')
				location.description = getVal('description')

				// 解析数组字段
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
			flushCurrentDay()
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

export interface ItineraryParserResult {
	days: DayItinerary[]
	loading: boolean
}

export function useItineraryParser(content: string): ItineraryParserResult {
	const [days, setDays] = useState<DayItinerary[]>([])
	const [loading, setLoading] = useState(false)
	const [parsedContent, setParsedContent] = useState<string>('')

	useEffect(() => {
		if (!content) return
		if (content === parsedContent) return // 避免重复解析

		// 只有当内容看起来包含完整的表格时才解析
		if (!content.includes('| 序号 |') || !content.includes('|--')) {
			return
		}

		console.log('Parsing itinerary content...')
		const parsedDays = parseMarkdownTable(content)

		if (parsedDays.length > 0) {
			setLoading(true)
			setParsedContent(content)

			// 收集所有需要地理编码的地点 (Flat list)
			const allLocationsToGeo: {
				dayIndex: number
				locIndex: number
				name: string
				address: string
			}[] = []

			parsedDays.forEach((day, dIndex) => {
				day.locations.forEach((loc, lIndex) => {
					allLocationsToGeo.push({
						dayIndex: dIndex,
						locIndex: lIndex,
						name: loc.name,
						address: loc.address,
					})
				})
			})

			// 批量地理编码
			mapApi
				.generateMap(
					allLocationsToGeo.map((item) => ({
						name: item.name,
						address: item.address,
					}))
				)
				.then((data) => {
					const geoResults = data.locations

					// 让我们重写一下逻辑以确保正确归位
					// 第一步：将 flat 的 geoResults 映射回 days 结构
					let geoIndex = 0
					const updatedDays = parsedDays.map((day) => {
						const validDayLocations = day.locations.filter((loc) => {
							const geo = geoResults[geoIndex++]
							if (geo && geo.lat && geo.lng) {
								loc.lat = geo.lat
								loc.lng = geo.lng
								return true
							}
							console.warn(`Geocoding failed for: ${loc.name} (${loc.address})`)
							return false // 过滤掉无效点
						})
						return { ...day, locations: validDayLocations }
					})

					setDays(updatedDays)
				})
				.catch((err) => {
					console.error('Failed to geocode locations', err)
				})
				.finally(() => {
					setLoading(false)
				})
		}
	}, [content, parsedContent])

	return { days, loading }
}
