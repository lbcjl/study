import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

interface Hotel {
	id: string
	name: string
	city: string
	priceRange: { min: number; max: number }
	rating: number
	tags: string[]
}

interface Attraction {
	id: string
	name: string
	city: string
	category: string
	ticketPrice: { adult: number }
	rating: number
	visitDuration: string
}

interface Restaurant {
	id: string
	name: string
	city: string
	cuisine: string
	pricePerPerson: { min: number; max: number }
	rating: number
	signature: string[]
}

@Injectable()
export class TripService {
	private hotels: Hotel[]
	private attractions: Attraction[]
	private restaurants: Restaurant[]

	constructor() {
		// 加载 Mock 数据
		this.loadMockData()
	}

	private loadMockData() {
		const dataPath = path.join(__dirname, '../../data')

		this.hotels = JSON.parse(
			fs.readFileSync(path.join(dataPath, 'hotels-mock.json'), 'utf-8')
		)

		this.attractions = JSON.parse(
			fs.readFileSync(path.join(dataPath, 'attractions-mock.json'), 'utf-8')
		)

		this.restaurants = JSON.parse(
			fs.readFileSync(path.join(dataPath, 'restaurants-mock.json'), 'utf-8')
		)
	}

	/**
	 * 根据城市获取酒店推荐
	 */
	getHotelsByCity(city: string, maxPrice?: number) {
		let results = this.hotels.filter((h) => h.city === city)

		if (maxPrice) {
			results = results.filter((h) => h.priceRange.min <= maxPrice)
		}

		return results.sort((a, b) => b.rating - a.rating)
	}

	/**
	 * 根据城市获取景点推荐
	 */
	getAttractionsByCity(city: string, category?: string) {
		let results = this.attractions.filter((a) => a.city === city)

		if (category) {
			results = results.filter((a) => a.category === category)
		}

		return results.sort((a, b) => b.rating - a.rating)
	}

	/**
	 * 根据城市获取餐厅推荐
	 */
	getRestaurantsByCity(city: string, cuisine?: string) {
		let results = this.restaurants.filter((r) => r.city === city)

		if (cuisine) {
			results = results.filter((r) => r.cuisine === cuisine)
		}

		return results.sort((a, b) => b.rating - a.rating)
	}

	/**
	 * 计算行程预算
	 */
	calculateBudget(params: {
		days: number
		peopleCount: number
		hotelPricePerNight: number
		dailyFoodBudget: number
		attractionTickets: number[]
	}) {
		const {
			days,
			peopleCount,
			hotelPricePerNight,
			dailyFoodBudget,
			attractionTickets,
		} = params

		const accommodation = hotelPricePerNight * (days - 1) * peopleCount
		const food = dailyFoodBudget * days * peopleCount
		const tickets =
			attractionTickets.reduce((sum, price) => sum + price, 0) * peopleCount
		const transportation = 200 * days * peopleCount // 估算市内交通

		return {
			accommodation,
			food,
			tickets,
			transportation,
			total: accommodation + food + tickets + transportation,
		}
	}
}
