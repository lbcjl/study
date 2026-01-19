import {
	Controller,
	Request,
	Post,
	UseGuards,
	Body,
	Get,
	Put,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { UserService } from '../user/user.service'

@Controller('auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		private userService: UserService,
	) {}

	@UseGuards(AuthGuard('local'))
	@Post('login')
	async login(@Request() req) {
		return this.authService.login(req.user)
	}

	@Post('register')
	async register(@Body() registerDto: any) {
		return this.authService.register(registerDto)
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('profile')
	async getProfile(@Request() req) {
		// req.user only contains { userId, email } from JwtStrategy headers
		// We fetch full user data (including preferences)
		return this.userService.findById(req.user.userId)
	}

	@UseGuards(AuthGuard('jwt'))
	@Put('profile')
	async updateProfile(@Request() req, @Body() body: any) {
		// Update preferences or nickname
		return this.userService.updatePreferences(req.user.userId, body.preferences)
	}
}
