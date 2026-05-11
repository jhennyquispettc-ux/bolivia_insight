import { Controller, Get, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtService } from '@nestjs/jwt';

// Quick guard to verify JWT (normally this would be a separate file, inlined for speed)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Req() req, @Body() body: any) {
    const userId = req.user.sub;
    const userEmail = req.user.email;
    
    // We need the googleAccessToken from the client to create the GCal event
    const { googleAccessToken, ...dto } = body;
    if (!googleAccessToken) {
      throw new UnauthorizedException('Missing googleAccessToken');
    }

    // We don't have userName in the JWT payload by default, but we have email
    const userName = req.user.name || userEmail.split('@')[0];

    return this.bookingsService.create(userId, userEmail, userName, googleAccessToken, dto);
  }

  @Get('mine')
  async findMine(@Req() req) {
    return this.bookingsService.findByUser(req.user.sub);
  }

  @Get('availability')
  async getAvailability() {
    return this.bookingsService.getAvailability();
  }
}
