import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User } from '../common/schemas/user.schema';
import { Session } from '../common/schemas/session.schema';
import { UserCreateDto, UserLoginDto, OAuthSessionDto } from './dto/auth.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private jwtService: JwtService,
    private httpService: HttpService,
  ) {}

  async register(userData: UserCreateDto) {
    const existingUser = await this.userModel.findOne({ email: userData.email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const userId = this.generateId();

    const user = new this.userModel({
      id: userId,
      email: userData.email,
      password_hash: hashedPassword,
      name: userData.name,
      created_at: new Date(),
    });

    await user.save();

    const token = this.createJwtToken(userId);

    return {
      access_token: token,
      token_type: 'bearer',
      user: {
        id: userId,
        email: userData.email,
        name: userData.name,
        subscription_plan: 'free',
      },
    };
  }

  async login(credentials: UserLoginDto) {
    const user = await this.userModel.findOne({ email: credentials.email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.createJwtToken(user.id);

    return {
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_plan: user.subscription_plan,
      },
    };
  }

  async createSessionFromOAuth(data: OAuthSessionDto) {
    try {
      // Call Emergent OAuth service to get user data
      const response = await lastValueFrom(
        this.httpService.get(
          'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
          { headers: { 'X-Session-ID': data.session_id } }
        )
      );

      if (response.status !== 200) {
        throw new UnauthorizedException('Invalid session');
      }

      const oauthData = response.data;

      // Check if user exists
      let user = await this.userModel.findOne({ email: oauthData.email });

      if (!user) {
        // Create new user
        const userId = this.generateId();
        user = new this.userModel({
          id: userId,
          email: oauthData.email,
          password_hash: '',
          name: oauthData.name,
          oauth_id: oauthData.id,
          picture: oauthData.picture,
          created_at: new Date(),
        });
        await user.save();
      }

      // Create session
      const sessionToken = oauthData.session_token;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const session = new this.sessionModel({
        id: this.generateId(),
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt,
        created_at: new Date(),
      });

      await session.save();

      return {
        access_token: sessionToken,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          subscription_plan: user.subscription_plan,
        },
      };
    } catch (error) {
      console.error('OAuth error:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new UnauthorizedException('Invalid OAuth session');
      }
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException(`OAuth session creation failed: ${error.message || 'Unknown error'}`);
    }
  }

  async validateUser(userId: string) {
    return this.userModel.findOne({ id: userId });
  }

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    const result = await this.sessionModel.deleteMany({ session_token: token });
    
    // Очистити застарілі сесії
    await this.sessionModel.deleteMany({
      expires_at: { $lt: new Date() }
    });
    
    return {
      success: result.deletedCount > 0,
      message: result.deletedCount > 0 
        ? 'Logged out successfully' 
        : 'Session not found or already expired'
    };
  }

  private createJwtToken(userId: string): string {
    const payload = { user_id: userId };
    return this.jwtService.sign(payload);
  }

  private generateId(): string {
    return randomUUID();
  }
}