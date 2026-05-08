import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    googleLogin(accessToken: string): Promise<{
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
