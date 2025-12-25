import { Observable } from 'rxjs';
import { Hotel } from './hotel.interface';
import { HotelSearchQuery } from './hotel-search-query.interface';

export interface IHotelProvider {
  searchHotels(query: HotelSearchQuery): Observable<Hotel>;
}
