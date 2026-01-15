import { Controller, Get, Query } from '@nestjs/common'
import { TripService } from './trip.service'

@Controller('trip')
export class TripController {
	constructor(private readonly tripService: TripService) {}

	@Get('hotels')
	getHotels(@Query('city') city: string, @Query('maxPrice') maxPrice?: number) {
		return this.tripService.getHotelsByCity(city, maxPrice)
	}

	@Get('attractions')
	getAttractions(
		@Query('city') city: string,
		@Query('category') category?: string
	) {
		return this.tripService.getAttractionsByCity(city, category)
	}

	@Get('restaurants')
	getRestaurants(
		@Query('city') city: string,
		@Query('cuisine') cuisine?: string
	) {
		return this.tripService.getRestaurantsByCity(city, cuisine)
	}
}
