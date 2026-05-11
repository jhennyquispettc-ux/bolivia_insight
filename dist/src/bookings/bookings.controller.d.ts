import { BookingsService } from './bookings.service';
import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class AuthGuard implements CanActivate {
    private jwtService;
    constructor(jwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(req: any, body: any): Promise<{
        date: Date;
        timeSlot: string;
        topic: string;
        notes: string | null;
        status: string;
        calendarId: string | null;
        calendarLink: string | null;
        createdAt: Date;
        id: number;
        userId: number;
    }>;
    findMine(req: any): Promise<{
        date: Date;
        timeSlot: string;
        topic: string;
        notes: string | null;
        status: string;
        calendarId: string | null;
        calendarLink: string | null;
        createdAt: Date;
        id: number;
        userId: number;
    }[]>;
    getAvailability(): Promise<{
        date: Date;
        timeSlot: string;
    }[]>;
}
