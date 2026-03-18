import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'your-super-secret-jwt-key-32-chars-long',
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - Payload:', payload);
    return { 
      sub: payload.sub, 
      email: payload.email,
      role: payload.role || 'User' // Add role from payload
    };
  }
}
