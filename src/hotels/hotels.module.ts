import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { HotelsSimulatorProvider } from './providers/hotels-simulator.provider';
import { IHotelProvider } from './interfaces/hotel-provider.interface';

@Module({
  controllers: [HotelsController],
  providers: [
    HotelsService,
    HotelsSimulatorProvider,
    {
      provide: 'HOTEL_PROVIDERS',
      useFactory: (hotelsSimulator: HotelsSimulatorProvider) => {
        return [hotelsSimulator] as IHotelProvider[];
      },
      inject: [HotelsSimulatorProvider],
    },
  ],
  exports: [HotelsService],
})
export class HotelsModule {}

