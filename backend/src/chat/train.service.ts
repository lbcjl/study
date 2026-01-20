import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class TrainService {
	private readonly logger = new Logger(TrainService.name)

	// 12306 常用城市/车站代码映射
	// 完整列表可从 https://kyfw.12306.cn/otn/resources/js/framework/station_name.js 获取
	private readonly stationMap: Record<string, string> = {
		北京: 'BJP',
		上海: 'SHH',
		天津: 'TJP',
		重庆: 'CQW',
		长沙: 'CSQ',
		长春: 'CCT',
		成都: 'CDW',
		福州: 'FZS',
		广州: 'GZQ',
		贵阳: 'GIW',
		呼和浩特: 'HHC',
		哈尔滨: 'HBB',
		合肥: 'HFH',
		杭州: 'HZH',
		海口: 'HKQ',
		济南: 'JNK',
		昆明: 'KMM',
		拉萨: 'LSO',
		兰州: 'LZJ',
		南宁: 'NNZ',
		南京: 'NJH',
		南昌: 'NCG',
		沈阳: 'SYT',
		石家庄: 'SJP',
		太原: 'TYV',
		乌鲁木齐: 'WMR',
		武汉: 'WHN',
		西宁: 'XNO',
		西安: 'XAY',
		银川: 'YIJ',
		郑州: 'ZZF',
		深圳: 'SZQ',
		厦门: 'XMS',
		苏州: 'SZH',
		桂林: 'GLZ',
		北海: 'BHZ',
		柳州: 'LZZ',
		三亚: 'SYZ',
		大理: 'DKM',
		丽江: 'LJM',
		青岛: 'QDK',
		大连: 'DLT',
		宁波: 'NGH',
		无锡: 'WXH',
		常州: 'CZH',
		温州: 'RZH',
		义乌: 'YWH',
		金华: 'JBH',
		徐州: 'XCH',
		合肥南: 'ENH',
		南京南: 'NKH',
		杭州东: 'HGH',
		温州南: 'VRH',
		宁波东: 'NVH',
		长沙南: 'CWQ',
		广州南: 'IZQ',
		深圳北: 'IOQ',
		重庆北: 'CUW',
		成都东: 'ICW',
		西安北: 'EAY',
		郑州东: 'ZAF',
		武汉站: 'WHN',
		汉口: 'HKN',
		武昌: 'WCN',
		南宁东: 'NFZ',
		桂林北: 'GBZ',
		珠海: 'ZHQ',
		惠东: 'KDQ',
		惠州南: 'KNQ', // 现名惠阳站，需核实，12306代码可能变动
		惠州: 'HCQ',
		惠州北: 'HQQ',
		深圳坪山: 'IFQ',
		汕尾: 'OGQ',
		潮汕: 'CBQ',
		汕头: 'OTQ',
		惠阳: 'KNQ', // 原惠州南
		福田: 'NZQ',
		香港西九龙: 'XJA',
	}

	/**
	 * 获取车站代码
	 */
	private getStationCode(name: string): string | undefined {
		// 移除常见的后缀，提高匹配率
		const cleanName = name.replace(/(站|市)$/, '')

		// 尝试直接匹配
		if (this.stationMap[cleanName]) return this.stationMap[cleanName]
		if (this.stationMap[name]) return this.stationMap[name]

		// 尝试匹配带方位的，如 "北京南" -> 可能会匹配到 "北京"
		// 注意：这可能不准确，最好是用户通过输入准确站点或我们维护更全的列表
		// 这里简单做个模糊匹配，优先匹配完全相等的
		return undefined
	}

	/**
	 * 查询火车票
	 * @param from 出发地（城市或车站名）
	 * @param to 目的地（城市或车站名）
	 * @param date 出发日期 YYYY-MM-DD
	 */
	async searchTickets(from: string, to: string, date: string): Promise<string> {
		this.logger.log(`Searching tickets from ${from} to ${to} on ${date}`)

		const fromCode = this.getStationCode(from)
		const toCode = this.getStationCode(to)

		if (!fromCode) {
			return `错误：未找到出发地 "${from}" 的车站代码。目前仅支持主要城市（如北京、上海、广州、深圳、南宁等）。`
		}
		if (!toCode) {
			return `错误：未找到目的地 "${to}" 的车站代码。目前仅支持主要城市。`
		}

		// 12306 查询接口 url 可能会变，通常是 queryX (X可能是 A, Z 等)
		// 目前 query 这是一个常用入口，但也可能重定向
		const queryUrl = `https://kyfw.12306.cn/otn/leftTicket/query?leftTicketDTO.train_date=${date}&leftTicketDTO.from_station=${fromCode}&leftTicketDTO.to_station=${toCode}&purpose_codes=ADULT`

		try {
			const response = await axios.get(queryUrl, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				},
				timeout: 5000, // Add timeout
			})

			const data = response.data

			// 检查是否是被拦截返回了 HTML
			if (typeof data === 'string' && data.includes('<!DOCTYPE html')) {
				this.logger.warn('12306 returned HTML (possible bot block)')
				return '12306服务访问受限（反爬虫拦截），无法自动获取车次信息。请建议用户手动查询或参考一般列车时刻。'
			}

			if (data.status && data.data && data.data.result) {
				const tickets = this.parseTickets(data.data.result, data.data.map)
				return JSON.stringify(tickets.slice(0, 10), null, 2) // 返回前10趟车次，避免token过多
			} else {
				this.logger.warn(`12306 query failed: ${JSON.stringify(data)}`)
				// Handle specific error messages if available
				const errorMsg = data.messages
					? JSON.stringify(data.messages)
					: '无直达车次或查询失败'
				return `查询未成功: ${errorMsg}`
			}
		} catch (error: any) {
			this.logger.error(`Error querying 12306: ${error.message}`)
			return `无法连接12306服务: ${error.message}`
		}
	}

	/**
	 * 解析 12306 返回的复杂字符串
	 */
	private parseTickets(results: string[], map: Record<string, string>): any[] {
		return results.map((item) => {
			const parts = item.split('|')
			// 12306 数据格式解析 (部分字段索引可能随时间变化，需维护)
			// 索引参考：
			// 3: 车次 (G1)
			// 6: 出发站代码
			// 7: 到达站代码
			// 8: 出发时间
			// 9: 到达时间
			// 10: 历时
			// 26: 无座
			// 29: 硬座
			// 24: 硬卧
			// 23: 软卧
			// 30: 二等座
			// 31: 一等座
			// 32: 商务座

			const trainNo = parts[3]
			const fromStationCode = parts[6]
			const toStationCode = parts[7]
			const startTime = parts[8]
			const arriveTime = parts[9]
			const duration = parts[10]

			const fromStationName = map[fromStationCode] || fromStationCode
			const toStationName = map[toStationCode] || toStationCode

			// 余票状态：有/无/数字
			const secondClass = parts[30] || '--' // 二等座
			const firstClass = parts[31] || '--' // 一等座
			const businessClass = parts[32] || '--' // 商务座
			const hardSeat = parts[29] || '--' // 硬座
			const hardSleeper = parts[28] || '--' // 硬卧
			const softSleeper = parts[23] || '--' // 软卧

			return {
				train_number: trainNo,
				from_station: fromStationName,
				to_station: toStationName,
				departure_time: startTime,
				arrival_time: arriveTime,
				duration: duration,
				tickets: {
					second_class: secondClass,
					first_class: firstClass,
					business_class: businessClass,
					hard_seat: hardSeat,
					hard_sleeper: hardSleeper,
					soft_sleeper: softSleeper,
				},
			}
		})
	}
}
