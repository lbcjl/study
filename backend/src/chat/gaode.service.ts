import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export interface GaodePOI {
	id: string
	name: string
	type: string
	address: string
	pname?: string // 省份
	cityname?: string // 城市
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
		type?: string,
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
					`根据热门景点 [${sights[0].name}] 锁定核心区域: ${district}`,
				)
			}

			// 2. 基于核心区域搜索美食和酒店
			// 修正：不再强制锁定 district，而是搜索全市热门，避免出现"全部在湖里区"的情况
			// 如果需要更精准，可以在 Prompt 里让 AI 决定区域，而不是在这里硬编码

			let [foods, hotels] = await Promise.all([
				this.searchPOI('美食', city, '050000'), // 050000 是餐饮服务
				this.searchPOI('酒店', city, '100000'), // 100000 是住宿服务
			])

			// 3. 格式化数据为 Markdown 列表供 AI 阅读 (Token 优化版)
			let context = `\n**【真实数据参考】高德地图为您找到 ${city} 的以下真实地点（请优先从中选择）：**\n`

			// 辅助函数：精简地址，去除冗余的省市名称以节省 Token
			const formatAddress = (p: GaodePOI) => {
				let addr = p.address || ''
				// 如果地址已经包含行政区名，就不重复加 adname
				const region = p.adname || ''
				if (!addr.startsWith(region)) {
					addr = region + addr
				}
				// 只有当省/市名非常见时才保留，一般情况下省略省市名节省 token，除非跨城
				// 这里简单处理：只保留区+街道，上下文已知是哪个城市
				return addr
			}

			if (sights.length > 0) {
				context += `\n🏞️ **推荐景点**：\n`
				// 降噪：只取前 5 个最热门的
				sights.slice(0, 5).forEach((p) => {
					const rating = p.biz_ext?.rating ? ` / 评分:${p.biz_ext.rating}` : ''
					const cost = p.biz_ext?.cost ? ` / 门票:¥${p.biz_ext.cost}` : ''
					// 移除电话号码以节省 Token
					context += `- **${p.name}** (${formatAddress(p)})${rating}${cost}\n`
				})
			}

			if (foods.length > 0) {
				context += `\n🥡 **推荐餐厅** (位于${city})：\n`
				// 降噪：只取前 3 个
				foods.slice(0, 3).forEach((p) => {
					const rating = p.biz_ext?.rating ? ` / 评分:${p.biz_ext.rating}` : ''
					const cost = p.biz_ext?.cost ? ` / 人均:¥${p.biz_ext.cost}` : ''
					context += `- **${p.name}** (${formatAddress(p)})${rating}${cost}\n`
				})
			}

			if (hotels.length > 0) {
				context += `\n🏨 **推荐酒店** (位于${city})：\n`
				// 降噪：只取前 4 个
				hotels.slice(0, 4).forEach((p) => {
					const rating = p.biz_ext?.rating ? ` / 评分:${p.biz_ext.rating}` : ''
					const cost = p.biz_ext?.cost ? ` / 参考价:¥${p.biz_ext.cost}` : ''
					context += `- **${p.name}** (${formatAddress(p)})${rating}${cost}\n`
				})
			}

			return context
		} catch (error) {
			this.logger.error(`获取推荐数据失败`, error)
			return ''
		}
	}
}
