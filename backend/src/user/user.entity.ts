import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm'

export interface UserPreferences {
	budgetRange?: string // e.g. "500-1000"
	travelStyle?: string[] | string // e.g. ["Relaxed", "Adventure"]
	dietary?: string[] // e.g. ["No Spicy", "Vegetarian"]
	interests?: string[] // e.g. ["History", "Nature"]
	homeCity?: string // e.g. "Beijing"
}

@Entity()
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column({ unique: true })
	email: string

	@Column({ select: false }) // Prevent accidental password leakage
	password: string

	@Column({ nullable: true })
	nickname: string

	@Column('simple-json', { nullable: true })
	preferences: UserPreferences

	@CreateDateColumn()
	createdAt: Date

	@UpdateDateColumn()
	updatedAt: Date
}
