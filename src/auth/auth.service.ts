import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  }

  async verifyGoogleToken(accessToken: string) {
    try {
      this.googleClient.setCredentials({ access_token: accessToken });
      const { data } = await this.googleClient.request<any>({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      });
      
      if (!data || !data.sub) {
        throw new UnauthorizedException('Invalid Google Token');
      }

      // Upsert user in database
      const user = await this.prisma.user.upsert({
        where: { googleId: data.sub },
        update: {
          name: data.name,
          picture: data.picture,
        },
        create: {
          googleId: data.sub,
          email: data.email,
          name: data.name,
          picture: data.picture,
        },
      });

      // Generate app JWT
      const appToken = this.jwtService.sign({ sub: user.id, email: user.email });

      return {
        accessToken: appToken,
        user,
      };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
