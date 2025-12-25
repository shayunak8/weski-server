# WeSki Hotel Search API

A high-performance hotel search backend built with NestJS that integrates with external API providers to fetch hotel availability. The architecture supports multiple providers and streams results in real-time for optimal user experience.

## Features

- 🚀 **Real-time Streaming**: Results are streamed to clients as they arrive from API providers
- 🏗️ **Extensible Architecture**: Easy to add new hotel providers via the `IHotelProvider` interface
- 🔄 **Smart Aggregation**: Automatically queries for requested group size and all larger sizes (up to 10)
- ✅ **Deduplication**: Prevents duplicate hotels from being sent to clients
- 📊 **Sorted Results**: Hotels are sorted by price (ascending)
- 🎯 **Type-Safe**: Full TypeScript implementation with DTOs and interfaces
- ⚡ **High Performance**: Non-blocking, asynchronous operations with RxJS

## Requirements

- Node.js 20+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Environment Setup

Create a `.env` file in the root directory:

```env
PORT=3000
```

The server will default to port 3000 if `PORT` is not specified.

## Running the Application

```bash
# Development mode (with hot-reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### 1. Get Ski Resorts

**GET** `/hotels/ski-resorts`

Returns the list of available ski resorts.

**Response:**

```json
[
  { "id": 1, "name": "Val Thorens" },
  { "id": 2, "name": "Courchevel" },
  { "id": 3, "name": "Tignes" },
  { "id": 4, "name": "La Plagne" },
  { "id": 5, "name": "Chamonix" }
]
```

### 2. Search Hotels (Streaming)

**POST** `/hotels/search`

Searches for hotels and streams results as they arrive using Server-Sent Events (SSE).

**Request Body:**

```json
{
  "ski_site": 1,
  "from_date": "03/04/2025",
  "to_date": "03/11/2025",
  "group_size": 2
}
```

**Parameters:**
- `ski_site` (number, required): Ski resort ID (1-5)
- `from_date` (string, required): Start date in format `DD/MM/YYYY`
- `to_date` (string, required): End date in format `DD/MM/YYYY`
- `group_size` (number, required): Number of people (1-10)

**Response (SSE Stream):**

The endpoint streams results as they arrive:

```
data: {"type":"hotel","data":{...hotel object...}}\n\n
data: {"type":"hotel","data":{...hotel object...}}\n\n
...
data: {"type":"complete","data":[...all hotels sorted by price...],"total":10}\n\n
```

**Hotel Object:**

```json
{
  "id": "string",
  "name": "string",
  "price": 123.45,
  "images": ["url1", "url2"],
  "amenities": [],
  "stars": 4,
  "rating": 0,
  "location": "latitude, longitude",
  "group_size": 2
}
```

### 3. Search Hotels (Synchronous)

**POST** `/hotels/search/sync`

Alternative endpoint that returns all results at once (sorted by price).

**Request Body:** Same as streaming endpoint

**Response:**

```json
{
  "hotels": [...sorted hotels...],
  "total": 10
}
```

## Architecture

### Provider Pattern

The application uses a provider pattern to support multiple hotel API providers:

```typescript
interface IHotelProvider {
  searchHotels(query: HotelSearchQuery): Observable<Hotel>;
}
```

To add a new provider:

1. Implement the `IHotelProvider` interface
2. Add the provider to the `HOTEL_PROVIDERS` array in `hotels.module.ts`

### How It Works

1. **Multiple Queries**: When a user searches for group size 2, the system automatically queries for sizes 2, 3, 4, 5, 6, 7, 8, 9, and 10
2. **Parallel Requests**: All queries are executed in parallel for maximum performance
3. **Streaming**: Results are streamed to the client as soon as they arrive from any provider
4. **Deduplication**: The `distinct` operator ensures each hotel is sent only once
5. **Sorting**: Final results are sorted by price (ascending)

## Project Structure

```
src/
├── hotels/
│   ├── dto/                    # Data Transfer Objects
│   │   ├── search-hotels.dto.ts
│   │   ├── hotel-response.dto.ts
│   │   └── ski-resort.dto.ts
│   ├── interfaces/             # TypeScript interfaces
│   │   ├── hotel.interface.ts
│   │   ├── hotel-provider.interface.ts
│   │   └── hotel-search-query.interface.ts
│   ├── providers/              # API provider implementations
│   │   └── hotels-simulator.provider.ts
│   ├── hotels.controller.ts    # REST endpoints
│   ├── hotels.service.ts       # Business logic
│   └── hotels.module.ts        # NestJS module
├── app.module.ts
└── main.ts
```

## Code Quality

- ✅ TypeScript with strict type checking
- ✅ NestJS best practices (Dependency Injection, Modules, Controllers)
- ✅ RxJS for reactive programming
- ✅ Input validation with class-validator
- ✅ Error handling and logging
- ✅ Clean separation of concerns
- ✅ No code duplication

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Building for Production

```bash
npm run build
```

The compiled JavaScript will be in the `dist/` directory.

## Environment Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT`   | Server port | `3000`  |

## API Integration

The application integrates with:

- **HotelsSimulator API**: `https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator`

The API expects:

```json
{
  "query": {
    "ski_site": 1,
    "from_date": "03/04/2025",
    "to_date": "03/11/2025",
    "group_size": 4
  }
}
```

## Performance Optimizations

- **Streaming**: Results are sent as they arrive, not waiting for all requests
- **Parallel Requests**: Multiple group size queries run concurrently
- **Deduplication**: Prevents sending duplicate hotels
- **Caching**: Ski resorts endpoint is cached for 1 hour
- **Error Isolation**: Provider errors don't break the entire search

## License

UNLICENSED
