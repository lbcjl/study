import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LocalStrategy } from './local.strategy'
import { JwtStrategy } from './jwt.strategy'
import { UserModule } from '../user/user.module'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'

@Module({
	imports: [
		UserModule,
		PassportModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret:
					configService.get<string>('JWT_SECRET') || 'defaultSecretChangeMe',
				signOptions: { expiresIn: '7d' }, // Longer expiration for better UX
			}),
			inject: [ConfigService],
		}),
	],
	providers: [AuthService, LocalStrategy, JwtStrategy],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
