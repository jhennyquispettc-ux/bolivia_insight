import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body('accessToken') accessToken: string) {
    return this.authService.verifyGoogleToken(accessToken);
  }
}
