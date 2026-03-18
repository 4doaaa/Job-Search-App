import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

interface GoogleProfile {
  emails?: Array<{ value: string; type: string }>;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  photos?: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    console.log('=== GOOGLE OAUTH DEBUG ===');
    console.log('DEBUG_GOOGLE_ID (process.env):', process.env.GOOGLE_CLIENT_ID);
    console.log('DEBUG_GOOGLE_ID (configService):', configService.get('GOOGLE_CLIENT_ID'));
    console.log('DEBUG_GOOGLE_SECRET (configService):', configService.get('GOOGLE_CLIENT_SECRET') ? 'Set' : 'Not Set');
    console.log('DEBUG_CALLBACK_URL (configService):', configService.get('GOOGLE_CALLBACK_URL'));
    console.log('All process.env keys:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
    console.log('========================');
    
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'your-google-client-id',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'your-google-client-secret',
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: GoogleProfile, done: (err: any, user: any) => void) {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const profilePic = profile.photos?.[0]?.value;

      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Create user object for googleLogin method
      const googleUser = {
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        profilePic: profilePic ? { secure_url: profilePic, public_id: 'google' } : undefined,
      };

      return done(null, googleUser);
    } catch (error) {
      return done(error, null);
    }
  }
}
