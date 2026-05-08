"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const google_auth_library_1 = require("google-auth-library");
let AuthService = class AuthService {
    prisma;
    jwtService;
    googleClient;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    }
    async verifyGoogleToken(accessToken) {
        try {
            this.googleClient.setCredentials({ access_token: accessToken });
            const { data } = await this.googleClient.request({
                url: 'https://www.googleapis.com/oauth2/v3/userinfo',
            });
            if (!data || !data.sub) {
                throw new common_1.UnauthorizedException('Invalid Google Token');
            }
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
            const appToken = this.jwtService.sign({ sub: user.id, email: user.email });
            return {
                accessToken: appToken,
                user,
            };
        }
        catch (error) {
            console.error(error);
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map