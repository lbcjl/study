import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export interface GaodePOI {
	id: string
	name: string
	type: string
	address: string
	adname: string // 区县名称，如 "思明区"
	location: string // "lng,lat"
	tel: string
	distance?: string
	biz_ext?: {
		rating?: string
		cost?: string
	}
	photos?: {
		url: string
	}[]
}

@Injectable()
export class GaodeService {
	private readonly logger = new Logger(GaodeService.name)
	private readonly baseUrl = 'https://restapi.amap.com/v3'
	private apiKey: string

	constructor(private configService: ConfigService) {
		this.apiKey = this.configService.get<string>('AMAP_WEB_API_KEY') || ''
		if (!this.apiKey) {
			this.logger.warn('未配置 AMAP_WEB_API_KEY，真实地点搜索功能将不可用')
		}
	}

	/**
	 * 关键字搜索 POI
	 * @param keywords 关键字 (如 "美食", "酒店")
	 * @param city 城市名称
	 * @param type 此处主要用于过滤类型代码，可选
	 */
	async searchPOI(
		keywords: string,
		city: string,
		type?: string
	): Promise<GaodePOI[]> {
		if (!this.apiKey) return []

		try {
			// 高德 API: /v3/place/text
			const url = `${this.baseUrl}/place/text`
			const response = await axios.get(url, {
				params: {
					key: this.apiKey,
					keywords: keywords,
					city: city,
					types: type,
					citylimit: true,
					output: 'json',
					offset: 10,
					page: 1,
					extensions: 'all',
				},
			})

			if (response.data.status === '1') {
				return response.data.pois as GaodePOI[]
			} else {
				this.logger.error(`高德 API 错误: ${response.data.info}`)
				return []
			}
		} catch (error) {
			this.logger.error(`高德 POI 搜索失败: ${error.message}`)
			return []
		}
	}

	/**
	 * 获取城市推荐参考信息 (美食 + 住宿)
	 * 用于注入给 AI 做参考
	 */
	async getRecommendedPOIs(city: string): Promise<string> {
		if (!this.apiKey) return ''

		this.logger.log(`正在获取 ${city} 的真实推荐数据...`)

		try {
			// 1. 先搜索核心景点，确定核心游玩区域（例如用户搜厦门，先找到鼓浪屿所在的思明区）
			const sights = await this.searchPOI('景点', city, '110000') // 110000 是风景名胜

			let district = ''
			if (sights.length > 0) {
				// 获取排名第一的景点的行政区名称 (如 "思明区")
				district = sights[0].adname || ''
				this.logger.log(
					`根据热门景点 [${sights[0].name}] 锁定核心区域: ${district}`
				)
			}

			// 2. 基于核心区域搜索美食和酒店
			// 如果锁定了区域，就搜 "厦门 思明区 美食" (加空格)，否则还是搜 "厦门 美食"
			const searchArea = district ? `${city} ${district}` : city

			let [foods, hotels] = await Promise.all([
				this.searchPOI('美食', searchArea, '050000'), // 050000 是餐饮服务
				this.searchPOI('酒店', searchArea, '100000'), // 100000 是住宿服务
			])

			// ⚠️ 降级策略：如果指定区域没搜到，尝试全市搜索（防止因区域关键词导致颗粒无收，引发AI幻觉）
			if (district && (foods.length === 0 || hotels.length === 0)) {
				this.logger.warn(`在 [${district}] 未搜到充足数据，降级为全市搜索...`)
				const [cityFoods, cityHotels] = await Promise.all([
					foods.length === 0
						? this.searchPOI('美食', city, '050000')
						: Promise.resolve([]),
					hotels.length === 0
						? this.searchPOI('酒店', city, '100000')
						: Promise.resolve([]),
				])

				if (foods.length === 0) foods = cityFoods
				if (hotels.length === 0) hotels = cityHotels
			}

			// 3. 格式化数据为 Markdown 列表供 AI 阅读
			let context = `\n**【真实数据参考】高德地图为您找到 ${city}${district ? `(${district})` : ''} 的以下真实地点（请优先从中选择）：**\n`

			if (sights.length > 0) {
				context += `\n🏞️ **推荐景点**：\n`
				sights.slice(0, 8).forEach((p) => {
					const rating = p.biz_ext?.rating ? ` / 评分:${p.biz_ext.rating}` : ''
					const cost = p.biz_ext?.cost ? ` / 门票:¥${p.biz_ext.cost}` : ''
					const tel = p.tel ? ` / 电话:${p.tel}` : ''
					context += `- **${p.name}** (${p.address})${rating}${cost}${tel}\n`
				})
			}

			if (foods.length > 0) {
				context += `\n🥡 **推荐餐厅** (位于${district || city})：\n`
				foods.slice(0, 5).forEach((p) => {
					const rating = p.biz_ext?.rating ? ` / 评分:${p.biz_ext.rating}` : ''
					const cost = p.biz_ext?.cost ? ` / 人均:¥${p.biz_ext.cost}` : ''
					const tel = p.tel ? ` / 电话:${p.tel}` : ''
					context += `- **${p.name}** (${p.address})${rating}${cost}${tel}\n`
				})
			}

			if (hotels.length > 0) {
				context += `\n🏨 **推荐酒店** (位于${district || city})：\n`
				hotels.slice(0, 5).forEach((p) => {
					const rating = p.biz_ext?.rating ? ` / 评分:${p.biz_ext.rating}` : ''
					const cost = p.biz_ext?.cost ? ` / 参考价:¥${p.biz_ext.cost}` : ''
					const tel = p.tel ? ` / 电话:${p.tel}` : ''
					context += `- **${p.name}** (${p.address})${rating}${cost}${tel}\n`
				})
			}

			return context
		} catch (error) {
			this.logger.error(`获取推荐数据失败`, error)
			return ''
		}
	}
}
