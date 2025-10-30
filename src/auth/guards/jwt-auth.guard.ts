import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session } from '../../common/schemas/session.schema';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Check if it's a session token from OAuth
    const session = await this.sessionModel.findOne({ session_token: token });
    if (session) {
      if (session.expires_at < new Date()) {
        throw new UnauthorizedException('Session expired');
      }
      request.user = { user_id: session.user_id };
      return true;
    }

    // Check if it's a JWT token
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new UnauthorizedException('JWT configuration error');
      }
      const payload = await this.jwtService.verifyAsync(token, { secret });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}