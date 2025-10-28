import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserCreateDto, UserLoginDto, OAuthSessionDto } from './dto/auth.dto';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: UserCreateDto) {
    return this.authService.register(userData);
  }

  @Post('login')
  async login(@Body() credentials: UserLoginDto) {
    return this.authService.login(credentials);
  }

  @Post('session')
  async createSession(@Body() data: OAuthSessionDto) {
    return this.authService.createSessionFromOAuth(data);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const userData = await this.authService.validateUser(user.user_id);
    if (!userData) {
      throw new Error('User not found');
    }
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      subscription_plan: userData.subscription_plan,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await this.authService.logout(token);
    }
    return { message: 'Logged out successfully' };
  }
}