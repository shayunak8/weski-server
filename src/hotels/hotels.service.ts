import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { Observable, merge, of } from 'rxjs';
import { catchError, distinct } from 'rxjs/operators';
import { IHotelProvider } from './interfaces/hotel-provider.interface';
import { HotelSearchQuery } from './interfaces/hotel-search-query.interface';
import { Hotel } from './interfaces/hotel.interface';
import { HOTELS_CONSTANTS } from './constants/hotels.constants';

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(
    @Optional()
    @Inject('HOTEL_PROVIDERS')
    private readonly providers: IHotelProvider[] = [],
  ) {}

  searchHotels(query: HotelSearchQuery): Observable<Hotel> {
    if (!this.providers || this.providers.length === 0) {
      return of();
    }

    const groupSizes = this.generateGroupSizes(query.group_size);
    const queries = groupSizes.map((size) => ({
      ...query,
      group_size: size,
    }));

    const searchObservables: Observable<Hotel>[] = [];

    for (const provider of this.providers) {
      for (const searchQuery of queries) {
        const providerObservable = provider.searchHotels(searchQuery).pipe(
          catchError((error) => {
            this.logger.error(
              `Provider error for group_size ${searchQuery.group_size}`,
              error.stack,
            );
            return of();
          }),
        );
        searchObservables.push(providerObservable);
      }
    }

    return merge(...searchObservables).pipe(distinct((hotel) => hotel.id));
  }

  private generateGroupSizes(requestedSize: number): number[] {
    const sizes: number[] = [];
    for (
      let i = requestedSize;
      i <= HOTELS_CONSTANTS.SEARCH.MAX_GROUP_SIZE;
      i++
    ) {
      sizes.push(i);
    }
    return sizes;
  }

  getSortedHotels(hotels: Hotel[]): Hotel[] {
    return hotels.sort((a, b) => a.price - b.price);
  }
}
