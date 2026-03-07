import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { ConsultantsModule } from './consultants/consultants.module';
import { RemindersModule } from './reminders/reminders.module';
import { ConfigurationModule } from './config/configuration';

@Module({
  imports: [
    ConfigurationModule,
    AppointmentsModule,
    AvailabilityModule,
    ConsultantsModule,
    RemindersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
