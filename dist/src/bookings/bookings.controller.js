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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const bookings_service_1 = require("./bookings.service");
const jwt_1 = require("@nestjs/jwt");
const common_2 = require("@nestjs/common");
let AuthGuard = class AuthGuard {
    jwtService;
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token)
            throw new common_1.UnauthorizedException();
        try {
            const payload = await this.jwtService.verifyAsync(token);
            request['user'] = payload;
        }
        catch {
            throw new common_1.UnauthorizedException();
        }
        return true;
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_2.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthGuard);
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async create(req, body) {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        const { googleAccessToken, ...dto } = body;
        if (!googleAccessToken) {
            throw new common_1.UnauthorizedException('Missing googleAccessToken');
        }
        const userName = req.user.name || userEmail.split('@')[0];
        return this.bookingsService.create(userId, userEmail, userName, googleAccessToken, dto);
    }
    async findMine(req) {
        return this.bookingsService.findByUser(req.user.sub);
    }
    async getAvailability() {
        return this.bookingsService.getAvailability();
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('availability'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getAvailability", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(AuthGuard),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map