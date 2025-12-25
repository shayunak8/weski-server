import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import axios, { AxiosInstance } from 'axios';
import { IHotelProvider } from '../interfaces/hotel-provider.interface';
import { HotelSearchQuery } from '../interfaces/hotel-search-query.interface';
import { Hotel } from '../interfaces/hotel.interface';

interface HotelsSimulatorResponseBody {
  success: string;
  accommodations: Array<{
    HotelCode: string;
    HotelName: string;
    HotelDescriptiveContent: {
      Images: Array<{
        URL: string;
        MainImage?: string;
      }>;
    };
    HotelInfo: {
      Position: {
        Latitude: string;
        Longitude: string;
        Distances: Array<{
          type: string;
          distance: string;
        }>;
      };
      Rating: string;
      Beds: string;
    };
    PricesInfo: {
      AmountAfterTax: string;
      AmountBeforeTax: string;
    };
  }>;
}

interface HotelsSimulatorResponse {
  statusCode: number;
  body: string | HotelsSimulatorResponseBody;
}

@Injectable()
export class HotelsSimulatorProvider implements IHotelProvider {
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl =
    'https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator';

  constructor() {
    this.apiClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  searchHotels(query: HotelSearchQuery): Observable<Hotel> {
    return new Observable((subscriber) => {
      const requestBody = {
        query: {
          ski_site: query.ski_site,
          from_date: query.from_date,
          to_date: query.to_date,
          group_size: query.group_size,
        },
      };

      this.apiClient
        .post(this.baseUrl, requestBody)
        .then((response) => {
          try {
            if (response.status !== 200) {
              subscriber.error(
                new Error(
                  `HotelsSimulator API returned status ${response.status}`,
                ),
              );
              return;
            }

            let body: HotelsSimulatorResponseBody;
            if (typeof response.data.body === 'string') {
              body = JSON.parse(response.data.body);
            } else {
              body = response.data.body;
            }

            if (!body || !body.accommodations) {
              subscriber.complete();
              return;
            }

            const accommodations = body.accommodations || [];

            if (accommodations.length === 0) {
              subscriber.complete();
              return;
            }

            accommodations.forEach((accommodation) => {
              const images =
                accommodation.HotelDescriptiveContent?.Images?.map(
                  (img) => img.URL,
                ) || [];

              const location = accommodation.HotelInfo?.Position
                ? `${accommodation.HotelInfo.Position.Latitude}, ${accommodation.HotelInfo.Position.Longitude}`
                : '';

              const transformedHotel: Hotel = {
                id: accommodation.HotelCode,
                name: accommodation.HotelName,
                price: parseFloat(
                  accommodation.PricesInfo?.AmountAfterTax || '0',
                ),
                images: images,
                amenities: [],
                stars: parseInt(accommodation.HotelInfo?.Rating || '0', 10),
                rating: 0,
                location: location,
                group_size: query.group_size,
              };
              subscriber.next(transformedHotel);
            });

            subscriber.complete();
          } catch (error) {
            subscriber.error(
              new Error(
                `Failed to parse response from HotelsSimulator: ${error.message}`,
              ),
            );
          }
        })
        .catch((error) => {
          subscriber.error(
            new Error(
              `HotelsSimulator API error: ${error.message || 'Unknown error'}`,
            ),
          );
        });
    });
  }
}
