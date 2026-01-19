import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
	) {}

	async findOne(email: string): Promise<User | null> {
		return this.usersRepository.findOne({
			where: { email },
			select: ['id', 'email', 'password', 'nickname', 'preferences'], // Need password for auth
		})
	}

	async findById(id: string): Promise<User | null> {
		return this.usersRepository.findOne({ where: { id } })
	}

	async create(userData: Partial<User>): Promise<User> {
		const newUser = this.usersRepository.create(userData)
		return this.usersRepository.save(newUser)
	}

	async updatePreferences(id: string, preferences: any): Promise<User> {
		const user = await this.findById(id)
		if (!user) throw new Error('User not found')

		user.preferences = { ...user.preferences, ...preferences }
		return this.usersRepository.save(user)
	}
}
