import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import * as nodemailer from 'nodemailer';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  // ── Google Calendar ─────────────────────────────────────────────────────────
  private async createCalendarEvent(
    googleAccessToken: string,
    date: Date,
    timeSlot: string,
    topic: string,
    userEmail: string,
    userName: string,
  ): Promise<{ id: string; link: string }> {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    auth.setCredentials({ access_token: googleAccessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    // date is a UTC midnight Date object (e.g. 2026-05-11T00:00:00Z)
    const dateStr = date.toISOString().substring(0, 10);
    const [y, m, d] = dateStr.split('-');
    
    // timeSlot is e.g. "17:00"
    const [hStr, mStr] = timeSlot.split(':');
    
    // Explicitly construct the ISO 8601 string for Bolivia time (-04:00)
    const startDateTime = `${dateStr}T${hStr}:${mStr}:00-04:00`;
    
    // Calculate end time (+1 hour) by using UTC math to avoid Node timezone shifts
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
      end:   { dateTime: endDateTime,   timeZone: 'America/La_Paz' },
      conferenceData: {
        createRequest: {
          requestId: `boliviainsight-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email',  minutes: 60 },
          { method: 'popup',  minutes: 15 },
        ],
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    return {
      id:   res.data.id ?? '',
      link: res.data.hangoutLink || res.data.htmlLink || '',
    };
  }

  // ── Email ────────────────────────────────────────────────────────────────────
  private async sendConfirmationEmail(
    to: string,
    userName: string,
    date: Date,
    timeSlot: string,
    topic: string,
    calendarLink: string,
  ) {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
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
      from:    `"Bolivia Insight" <${process.env.SMTP_USER}>`,
      to,
      subject: `✅ Session confirmed — ${topic} · ${dateStr}`,
      html,
    });
  }

  // ── Public methods ───────────────────────────────────────────────────────────
  async create(
    userId: number,
    userEmail: string,
    userName: string,
    googleAccessToken: string,
    dto: { date: string; timeSlot: string; topic: string; notes?: string },
  ) {
    const date = new Date(dto.date);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    let calendarId: string | null = null;
    let calendarLink: string | null = null;

    // Try to create GCal event (non-fatal if it fails — token may have expired)
    try {
      const cal = await this.createCalendarEvent(
        googleAccessToken, date, dto.timeSlot, dto.topic, userEmail, userName,
      );
      calendarId   = cal.id;
      calendarLink = cal.link;
    } catch (err) {
      console.warn('Google Calendar create failed (token expired?):', err.message);
    }

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        date,
        timeSlot:    dto.timeSlot,
        topic:       dto.topic,
        notes:       dto.notes,
        calendarId,
        calendarLink,
      },
    });

    // Send email (non-fatal)
    try {
      await this.sendConfirmationEmail(
        userEmail, userName, date, dto.timeSlot, dto.topic, calendarLink ?? '',
      );
    } catch (err) {
      console.warn('Email send failed:', err.message);
    }

    return booking;
  }

  async findByUser(userId: number) {
    return this.prisma.booking.findMany({
      where:   { userId },
      orderBy: { date: 'desc' },
    });
  }

  async cancel(bookingId: number, userId: number) {
    return this.prisma.booking.updateMany({
      where:  { id: bookingId, userId },
      data:   { status: 'cancelled' },
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
}
