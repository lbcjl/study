import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	OneToOne,
	JoinColumn,
} from 'typeorm'
import { Conversation } from './conversation.entity'

@Entity('travel_plans')
export class TravelPlan {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column()
	conversationId: string

	@OneToOne(() => Conversation, (conversation) => conversation.travelPlan, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'conversationId' })
	conversation: Conversation

	@Column()
	destination: string

	@Column({ type: 'timestamp', nullable: true })
	startDate?: Date

	@Column({ type: 'timestamp', nullable: true })
	endDate?: Date

	@Column({ nullable: true })
	duration?: number // 天数

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
	budget?: number

	@Column({ nullable: true })
	travelers?: number // 旅行人数

	@Column('text')
	itineraryJson: string // JSON 字符串存储详细行程

	@Column('text', { nullable: true })
	accommodationsJson?: string // JSON 字符串存储住宿推荐

	@Column('text', { nullable: true })
	transportationJson?: string // JSON 字符串存储交通信息

	@Column('text', { nullable: true })
	budgetBreakdownJson?: string // JSON 字符串存储预算明细

	@Column('text', { nullable: true })
	tipsJson?: string // JSON 字符串存储实用贴士

	@CreateDateColumn()
	createdAt: Date

	// 虚拟属性（从 JSON 解析）
	get itinerary(): any[] {
		return this.itineraryJson ? JSON.parse(this.itineraryJson) : []
	}

	set itinerary(value: any[]) {
		this.itineraryJson = JSON.stringify(value)
	}

	get accommodations(): any[] {
		return this.accommodationsJson ? JSON.parse(this.accommodationsJson) : []
	}

	set accommodations(value: any[]) {
		this.accommodationsJson = JSON.stringify(value)
	}

	get budgetBreakdown(): any[] {
		return this.budgetBreakdownJson ? JSON.parse(this.budgetBreakdownJson) : []
	}

	set budgetBreakdown(value: any[]) {
		this.budgetBreakdownJson = JSON.stringify(value)
	}

	get tips(): string[] {
		return this.tipsJson ? JSON.parse(this.tipsJson) : []
	}

	set tips(value: string[]) {
		this.tipsJson = JSON.stringify(value)
	}
}
