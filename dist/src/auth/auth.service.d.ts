import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    private googleClient;
    constructor(prisma: PrismaService, jwtService: JwtService);
    verifyGoogleToken(accessToken: string): Promise<{
        accessToken: string;
        user: {
            id: number;
            googleId: string;
            email: string;
            name: string | null;
            picture: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
