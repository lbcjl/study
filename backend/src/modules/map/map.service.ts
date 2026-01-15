import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MapService {
	private readonly apiKey: string

	constructor(private configService: ConfigService) {
		this.apiKey = this.configService.get<string>('AMAP_API_KEY')
	}

	/**
	 * 获取高德地图 API Key (供前端使用)
	 */
	getApiKey(): string {
		return this.apiKey
	}

	/**
	 * TODO: 实现 POI 搜索功能
	 * 调用高德地图 Web 服务 API
	 */
	async searchPOI(params: { keywords: string; city: string; types?: string }) {
		// 待实现：调用高德地图 API
		// GET https://restapi.amap.com/v3/place/text
		throw new Error('Not implemented yet')
	}

	/**
	 * TODO: 实现路径规划功能
	 */
	async planRoute(params: {
		origin: string // 经纬度 "lng,lat"
		destination: string
		waypoints?: string[]
	}) {
		// 待实现：调用高德地图路径规划 API
		// GET https://restapi.amap.com/v5/direction/driving
		throw new Error('Not implemented yet')
	}
}
