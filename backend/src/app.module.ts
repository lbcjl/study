import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AiModule } from './modules/ai/ai.module'
import { TripModule } from './modules/trip/trip.module'
import { MapModule } from './modules/map/map.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		AiModule,
		TripModule,
		MapModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
