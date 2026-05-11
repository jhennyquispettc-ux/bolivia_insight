import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [AuthModule, BookingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
