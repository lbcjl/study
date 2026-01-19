import { useState, useEffect } from 'react'
import { mapApi } from '../services/mapApi'
import { parseMarkdownTable, DayItinerary } from '../utils/itineraryParser'

export type { DayItinerary }

export interface ItineraryParserResult {
	days: DayItinerary[]
	loading: boolean
}

export function useItineraryParser(content: string): ItineraryParserResult {
	const [days, setDays] = useState<DayItinerary[]>([])
	const [loading, setLoading] = useState(false)
	const [parsedContent, setParsedContent] = useState<string>('')

	useEffect(() => {
		if (!content) {
			setDays([])
			setParsedContent('')
			return
		}
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

			// 尝试从内容中提取城市信息（上下文）
			// 匹配模式： "从X出发去Y玩", "Arrive in Y", "Y 3天旅行", 或元数据标签
			let detectedCity: string | undefined
			const lines = content.split('\n').slice(0, 15) // Check first 15 lines

			// 0. Metadata Tag (High Priority)
			// Format: <!-- DESTINATION_CITY: Shanghai -->
			const metaMatch = content.match(
				/<!--\s*DESTINATION_CITY:\s*([\u4e00-\u9fa5]{2,10})\s*-->/,
			)
			if (metaMatch) {
				detectedCity = metaMatch[1]
			} else {
				// Fallback to heuristics
				for (const line of lines) {
					const cleanLine = line.replace(/[*#]/g, '').trim() // Remove markdown chars

					// 1. Explicit labels: "目的地：厦门"
					const destMatch = cleanLine.match(
						/(?:目的地|城市|City)[:：]\s*([\u4e00-\u9fa5]{2,10})/,
					)
					if (destMatch) {
						detectedCity = destMatch[1]
						break
					}

					// 2. Action phrases: "去厦门玩", "游玩厦门"
					const actionMatch = cleanLine.match(
						/(?:去|游玩|玩|在|到|抵达|前往)\s*([\u4e00-\u9fa5]{2,5})(?:市|区)?(?:玩|旅行|旅游|攻略|计划|行程|度假)/,
					)
					if (actionMatch) {
						detectedCity = actionMatch[1]
						break
					}

					// 3. Title/Summary phrases: "厦门3日游", "厦门行程", "为您定制的厦门之旅"
					// Match a city name (2-5 chars) followed immediately by "Journey/Trip/Days" keywords
					const titleMatch = cleanLine.match(
						/(?:^|[^\u4e00-\u9fa5])([\u4e00-\u9fa5]{2,5})(?:市|区)?(?:[0-9]+日|[一二三四五六七八九十]+天|日游|天游|行程|旅行|旅游|攻略|指南|计划)/,
					)
					if (titleMatch) {
						detectedCity = titleMatch[1]
						break
					}
				}
			}
			if (detectedCity) {
				console.log(
					`🌍 Detected destination city for geocoding: ${detectedCity}`,
				)
			}

			// 收集所有需要地理编码的地点 (Flat list)
			const allLocationsToGeo: {
				dayIndex: number
				locIndex: number
				name: string
				address: string
			}[] = []

			parsedDays.forEach((day, dIndex) => {
				// 跳过“往返及城际交通”的大交通地理编码，因为它们通常不是具体的单个点
				if (day.day === '往返及城际交通') return

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
					})),
					detectedCity,
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
