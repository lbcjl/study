import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { AIService } from './ai.service'
import { LangChainService } from './langchain.service'
import { Conversation } from '../entities/conversation.entity'
import { Message } from '../entities/message.entity'

import { WeatherService } from './weather.service'
import { GaodeService } from './gaode.service'

@Module({
	imports: [TypeOrmModule.forFeature([Conversation, Message])],
	controllers: [ChatController],
	providers: [
		ChatService,
		AIService,
		LangChainService,
		WeatherService,
		GaodeService,
	],
	exports: [
		ChatService,
		AIService,
		LangChainService,
		WeatherService,
		GaodeService,
	],
})
export class ChatModule {}
