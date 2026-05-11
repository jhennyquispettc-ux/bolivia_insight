"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const googleapis_1 = require("googleapis");
const nodemailer = __importStar(require("nodemailer"));
let BookingsService = class BookingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCalendarEvent(googleAccessToken, date, timeSlot, topic, userEmail, userName) {
        const auth = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        auth.setCredentials({ access_token: googleAccessToken });
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
        const dateStr = date.toISOString().substring(0, 10);
        const [y, m, d] = dateStr.split('-');
        const [hStr, mStr] = timeSlot.split(':');
        const startDateTime = `${dateStr}T${hStr}:${mStr}:00-04:00`;
        const endUtc = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hStr) + 1, Number(mStr)));
        const endY = endUtc.getUTCFullYear();
        const endM = String(endUtc.getUTCMonth() + 1).padStart(2, '0');
        const endD = String(endUtc.getUTCDate()).padStart(2, '0');
        const endH = String(endUtc.getUTCHours()).padStart(2, '0');
        const endMin = String(endUtc.getUTCMinutes()).padStart(2, '0');
        const endDateTime = `${endY}-${endM}-${endD}T${endH}:${endMin}:00-04:00`;
        const event = {
            summary: `Bolivia Insight — ${topic}`,
            description: `Session booked via Bolivia Insight.\nTopic: ${topic}\nBooked by: ${userName} (${userEmail})`,
            start: { dateTime: startDateTime, timeZone: 'America/La_Paz' },
            end: { dateTime: endDateTime, timeZone: 'America/La_Paz' },
            conferenceData: {
                createRequest: {
                    requestId: `boliviainsight-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 },
                ],
            },
        };
        const res = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: event,
        });
        return {
            id: res.data.id ?? '',
            link: res.data.hangoutLink || res.data.htmlLink || '',
        };
    }
    async sendConfirmationEmail(to, userName, date, timeSlot, topic, calendarLink) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <div style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">✅ Session confirmed</h1>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px">Bolivia Insight · Local Expert Session</p>
        </div>
        <div style="padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:16px">Hi <strong>${userName}</strong>,</p>
          <p>Your session has been booked and added to your Google Calendar.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:10px;background:#f8fafc;border-radius:8px;font-weight:700;width:120px">Date</td>
                <td style="padding:10px">${dateStr}</td></tr>
            <tr><td style="padding:10px;font-weight:700">Time</td>
                <td style="padding:10px">${timeSlot} (Bolivia Time)</td></tr>
            <tr><td style="padding:10px;background:#f8fafc;border-radius:8px;font-weight:700">Topic</td>
                <td style="padding:10px;background:#f8fafc">${topic}</td></tr>
          </table>
          ${calendarLink ? `<a href="${calendarLink}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px">View in Google Calendar →</a>` : ''}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
          <p style="font-size:12px;color:#94a3b8">Bolivia Insight · Real-time travel intelligence for Bolivia</p>
        </div>
      </div>
    `;
        await transporter.sendMail({
            from: `"Bolivia Insight" <${process.env.SMTP_USER}>`,
            to,
            subject: `✅ Session confirmed — ${topic} · ${dateStr}`,
            html,
        });
    }
    async create(userId, userEmail, userName, googleAccessToken, dto) {
        const date = new Date(dto.date);
        if (isNaN(date.getTime()))
            throw new common_1.BadRequestException('Invalid date');
        let calendarId = null;
        let calendarLink = null;
        try {
            const cal = await this.createCalendarEvent(googleAccessToken, date, dto.timeSlot, dto.topic, userEmail, userName);
            calendarId = cal.id;
            calendarLink = cal.link;
        }
        catch (err) {
            console.warn('Google Calendar create failed (token expired?):', err.message);
        }
        const booking = await this.prisma.booking.create({
            data: {
                userId,
                date,
                timeSlot: dto.timeSlot,
                topic: dto.topic,
                notes: dto.notes,
                calendarId,
                calendarLink,
            },
        });
        try {
            await this.sendConfirmationEmail(userEmail, userName, date, dto.timeSlot, dto.topic, calendarLink ?? '');
        }
        catch (err) {
            console.warn('Email send failed:', err.message);
        }
        return booking;
    }
    async findByUser(userId) {
        return this.prisma.booking.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
    }
    async cancel(bookingId, userId) {
        return this.prisma.booking.updateMany({
            where: { id: bookingId, userId },
            data: { status: 'cancelled' },
        });
    }
    async getAvailability() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.booking.findMany({
            where: { date: { gte: today }, status: { in: ['pending', 'confirmed'] } },
            select: { date: true, timeSlot: true },
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map