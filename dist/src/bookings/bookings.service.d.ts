import { PrismaService } from '../prisma/prisma.service';
export declare class BookingsService {
    private prisma;
    constructor(prisma: PrismaService);
    private createCalendarEvent;
    private sendConfirmationEmail;
    create(userId: number, userEmail: string, userName: string, googleAccessToken: string, dto: {
        date: string;
        timeSlot: string;
        topic: string;
        notes?: string;
    }): Promise<{
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
    findByUser(userId: number): Promise<{
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
    cancel(bookingId: number, userId: number): Promise<import("@prisma/client").Prisma.BatchPayload>;
    getAvailability(): Promise<{
        date: Date;
        timeSlot: string;
    }[]>;
}
