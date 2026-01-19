import {
	Injectable,
	UnauthorizedException,
	ConflictException,
} from '@nestjs/common'
import { UserService } from '../user/user.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService,
	) {}

	async validateUser(email: string, pass: string): Promise<any> {
		const user = await this.userService.findOne(email)
		if (user && (await bcrypt.compare(pass, user.password))) {
			const { password, ...result } = user
			return result
		}
		return null
	}

	async login(user: any) {
		const payload = { email: user.email, sub: user.id }
		return {
			access_token: this.jwtService.sign(payload),
			user: user, // Return user info but definitely NOT password
		}
	}

	async register(registerDto: any) {
		const existing = await this.userService.findOne(registerDto.email)
		if (existing) {
			throw new ConflictException('User already exists')
		}

		const hashedPassword = await bcrypt.hash(registerDto.password, 10)
		const newUser = await this.userService.create({
			email: registerDto.email,
			password: hashedPassword,
			nickname: registerDto.nickname || 'Traveler',
			preferences: {}, // Init empty preferences
		})

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...result } = newUser
		return result
	}
}
