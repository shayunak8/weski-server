import { Hotel } from '../interfaces/hotel.interface';

export class HotelResponseDto implements Hotel {
  id: string;
  name: string;
  price: number;
  images: string[];
  amenities: string[];
  stars: number;
  rating: number;
  location: string;
  group_size: number;
}
