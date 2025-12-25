import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  Header,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { HotelsService } from './hotels.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { HotelResponseDto } from './dto/hotel-response.dto';
import { SkiResortDto } from './dto/ski-resort.dto';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('ski-resorts')
  @Header('Cache-Control', 'public, max-age=3600')
  getSkiResorts(): SkiResortDto[] {
    return [
      {
        id: 1,
        name: 'Val Thorens',
      },
      {
        id: 2,
        name: 'Courchevel',
      },
      {
        id: 3,
        name: 'Tignes',
      },
      {
        id: 4,
        name: 'La Plagne',
      },
      {
        id: 5,
        name: 'Chamonix',
      },
    ];
  }

  @Post('search')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  async searchHotels(
    @Body() searchDto: SearchHotelsDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const query = {
      ski_site: searchDto.ski_site,
      from_date: searchDto.from_date,
      to_date: searchDto.to_date,
      group_size: searchDto.group_size,
    };

    const hotelsObservable = this.hotelsService.searchHotels(query);
    const collectedHotels: HotelResponseDto[] = [];
    let hasCompleted = false;

    const timeout = setTimeout(() => {
      if (!hasCompleted) {
        hasCompleted = true;
        const sortedHotels =
          this.hotelsService.getSortedHotels(collectedHotels);
        res.write(
          `data: ${JSON.stringify({ type: 'complete', data: sortedHotels, total: sortedHotels.length })}\n\n`,
        );
        res.end();
      }
    }, 60000);

    hotelsObservable.subscribe({
      next: (hotel) => {
        const hotelDto: HotelResponseDto = {
          id: hotel.id,
          name: hotel.name,
          price: hotel.price,
          images: hotel.images,
          amenities: hotel.amenities,
          stars: hotel.stars,
          rating: hotel.rating,
          location: hotel.location,
          group_size: hotel.group_size,
        };

        collectedHotels.push(hotelDto);

        res.write(
          `data: ${JSON.stringify({ type: 'hotel', data: hotelDto })}\n\n`,
        );
      },
      error: (error) => {
        clearTimeout(timeout);
        if (!hasCompleted) {
          hasCompleted = true;
          console.error('Error in hotel search:', error);
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`,
          );
          res.end();
        }
      },
      complete: () => {
        clearTimeout(timeout);
        if (!hasCompleted) {
          hasCompleted = true;
          const sortedHotels =
            this.hotelsService.getSortedHotels(collectedHotels);
          res.write(
            `data: ${JSON.stringify({ type: 'complete', data: sortedHotels, total: sortedHotels.length })}\n\n`,
          );
          res.end();
        }
      },
    });
  }

  @Post('search/sync')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  async searchHotelsSync(@Body() searchDto: SearchHotelsDto) {
    const query = {
      ski_site: searchDto.ski_site,
      from_date: searchDto.from_date,
      to_date: searchDto.to_date,
      group_size: searchDto.group_size,
    };

    return new Promise((resolve, reject) => {
      const hotels: HotelResponseDto[] = [];

      this.hotelsService.searchHotels(query).subscribe({
        next: (hotel) => {
          hotels.push({
            id: hotel.id,
            name: hotel.name,
            price: hotel.price,
            images: hotel.images,
            amenities: hotel.amenities,
            stars: hotel.stars,
            rating: hotel.rating,
            location: hotel.location,
            group_size: hotel.group_size,
          });
        },
        error: (error) => {
          reject(error);
        },
        complete: () => {
          const sortedHotels = this.hotelsService.getSortedHotels(hotels);
          resolve({
            hotels: sortedHotels,
            total: sortedHotels.length,
          });
        },
      });
    });
  }
}
