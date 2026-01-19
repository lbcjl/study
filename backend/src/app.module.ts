import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { ChatModule } from './chat/chat.module'
import { TravelModule } from './travel/travel.module'
import { MapModule } from './map/map.module'
import { Conversation } from './entities/conversation.entity'
import { Message } from './entities/message.entity'
import { TravelPlan } from './entities/travel-plan.entity'
import { UserModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { User } from './user/user.entity'

@Module({
	imports: [
		// 配置模块（加载环境变量）
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '../.env',
		}),

		// 数据库模块（TypeORM）
		TypeOrmModule.forRootAsync({
			useFactory: () => {
				const isProduction = process.env.NODE_ENV === 'production'

				// 如果配置了 POSTGRES_URL，则使用 Postgres (适合 Render/Vercel 部署)
				if (process.env.POSTGRES_URL) {
					console.log('Using PostgreSQL Database')
					return {
						type: 'postgres',
						url: process.env.POSTGRES_URL,
						autoLoadEntities: true,
						synchronize: true, // 生产环境建议设为 false (但 POC 阶段保持 true)
						ssl: { rejectUnauthorized: false }, // Cloud DBs often need SSL
					}
				}

				// 默认本地开发使用 SQLite (sql.js)
				console.log('Using SQLite Database')
				return {
					type: 'sqljs',
					location: process.env.DATABASE_PATH || './database.sqlite',
					autoSave: true,
					entities: [Conversation, Message, TravelPlan, User],
					synchronize: true,
					logging: false,
				}
			},
		}),

		// 业务模块
		ChatModule,
		TravelModule,
		MapModule,
		UserModule,
		AuthModule,

		// Rate Limiting (防刷)
		ThrottlerModule.forRoot([
			{
				ttl: 60000, // 1分钟
				limit: 60, // 限制60次请求
			},
		]),
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
