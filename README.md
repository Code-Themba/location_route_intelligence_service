# Location & Route Intelligence Service

A production-ready backend REST API built with **Node.js**, **Express v5**, **TypeScript**, and **Drizzle ORM** (PostgreSQL) that integrates the **Google Maps Platform** (Geocoding API & Routes API v2) with a relational database caching layer.

Designed to minimize external API billing costs and reduce response latency, the service automatically caches geocoded coordinates and calculated route metrics with a 7-day Time-To-Live (TTL), returning repeat queries in milliseconds directly from PostgreSQL.

---

## Key Features

* **Address Geocoding (`GET /api/v1/locations/geocode`)**: Resolves raw text addresses and landmarks into standardized formatted addresses, latitude/longitude coordinates, and official Google `placeId` identifiers.
* **Route & Travel Time Estimation (`GET /api/v1/locations/route`)**: Computes travel distance (in meters) and duration (in seconds) between two locations across `DRIVING`, `WALKING`, and `BICYCLING` modes using Google's `computeRoutes` v2 endpoint.
* **PostgreSQL Relational Caching Layer**: Stores geocoded locations (`cached_locations`) and origin-destination route pairs (`cached_routes`) with normalized query deduplication and a configurable 7-day TTL.
* **Strict Request Validation**: Validates and sanitizes incoming query parameters using **Zod** before hitting the database or external APIs.
* **Rate Limiting & Abuse Protection**: Protects API quotas and server resources using `express-rate-limit` (30 requests/minute per IP by default).
* **Type-Safe Database Migrations**: Uses **Drizzle ORM** and `drizzle-kit` for schema management and zero-overhead SQL queries.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime & Language** | Node.js, TypeScript (`v5.8+`) |
| **Web Framework** | Express (`v5.1+`) |
| **Database & ORM** | PostgreSQL, Drizzle ORM (`v0.40+`), `pg` |
| **Validation & Security** | Zod, `express-rate-limit`, `dotenv` |
| **External APIs** | Google Maps Geocoding API, Google Maps Routes API (`v2`) |
| **Package Manager** | `pnpm` |

---

## Project Structure

```text
location_route_intelligence_service/
├── drizzle/                  # Generated SQL migrations (via drizzle-kit)
├── src/
│   ├── db/
│   │   ├── index.ts          # PostgreSQL connection pool & Drizzle instance
│   │   └── schema.ts         # Relational table definitions (cached_locations, cached_routes)
│   ├── middleware/
│   │   ├── rateLimiter.ts    # Express rate-limiting middleware
│   │   └── validate.ts       # Zod query parameter validation schemas
│   ├── routes/
│   │   └── locationRoutes.ts # REST API route handlers (/geocode, /route)
│   ├── services/
│   │   └── mapsService.ts    # Cache lookup, TTL invalidation & Google Maps API integration
│   └── index.ts              # Express server entry point & global error handler
├── .env                      # Environment variables (excluded from version control)
├── drizzle.config.ts         # Drizzle Kit configuration
├── package.json              # Scripts and dependencies
└── tsconfig.json             # TypeScript compiler configuration
```

---

## Getting Started

### 1. Prerequisites

* **Node.js** (v20 or higher)
* **pnpm** (`npm install -g pnpm`)
* **PostgreSQL** (local instance or hosted provider such as Neon, Supabase, or Railway)
* **Google Cloud Platform Account** with **Geocoding API** and **Routes API** enabled

---

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd location_route_intelligence_service
pnpm install
```

---

### 3. Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/map_api
GOOGLE_MAPS_API_KEY=AIzaSyYourGoogleMapsApiKey
```

#### Google Cloud Setup Checklist
1. Create or select a project in the [Google Cloud Console](https://console.cloud.google.com/) and ensure **Billing** is linked.
2. Navigate to **APIs & Services > Library** and enable:
   * **Geocoding API**
   * **Routes API**
3. Navigate to **APIs & Services > Credentials**, create an **API Key**, and restrict it to **Geocoding API** and **Routes API** (with IP restrictions in production).

---

### 4. Database Setup

Push the Drizzle schema to your PostgreSQL database:

```bash
pnpm db:push
```

*(Optional)* Inspect your tables and cached records visually using Drizzle Studio:

```bash
pnpm db:studio
```

---

### 5. Running the Server

* **Development Mode (with hot-reload):**
  ```bash
  pnpm dev
  ```

* **Production Build & Start:**
  ```bash
  pnpm build
  pnpm start
  ```

---

## API Reference

All endpoints are prefixed with `/api/v1/locations`.

### 1. Geocode an Address

Resolves a location string into coordinates and a Google `placeId`.

* **Endpoint:** `GET /api/v1/locations/geocode`
* **Query Parameters:**
  * `address` *(required, string, min 3 chars)* — The address or landmark to geocode.

#### Example Request
```bash
curl "http://localhost:3000/api/v1/locations/geocode?address=Greenstone%20Mall%20Edenvale"
```

#### Example Response (`200 OK`)
```json
{
  "source": "google_api",
  "data": {
    "id": 2,
    "normalizedQuery": "greenstone mall edenvale",
    "formattedAddress": "Cnr Modderfontein Rd & Van Riebeeck Ave Greenstone Hill, Modderfontein, Lethabong, 1609, South Africa",
    "latitude": -26.1187425,
    "longitude": 28.1418975,
    "placeId": "ChIJexgHxZMTlR4RgI37yABoiGk",
    "updatedAt": "2026-11-20T16:45:17.326Z"
  }
}
```
*(Subsequent requests for the same normalized address within 7 days return `"source": "cache"`.)*

---

### 2. Calculate Route Distance & Duration

Computes the optimal route metrics between an origin and destination.

* **Endpoint:** `GET /api/v1/locations/route`
* **Query Parameters:**
  * `origin` *(required, string, min 3 chars)* — Starting address or landmark.
  * `destination` *(required, string, min 3 chars)* — Ending address or landmark.
  * `mode` *(optional, enum: `DRIVING` | `WALKING` | `BICYCLING`, default: `DRIVING`)* — Mode of transport.

#### Example Request
```bash
curl "http://localhost:3000/api/v1/locations/route?origin=Greenstone%20Mall%20Edenvale&destination=Alex%20Mall%20Alexandra&mode=DRIVING"
```

#### Example Response (`200 OK`)
```json
{
  "source": "google_api",
  "origin": "Cnr Modderfontein Rd & Van Riebeeck Ave Greenstone Hill, Modderfontein, Lethabong, 1609, South Africa",
  "destination": "C/O, and N 3, London Rd, Far East Bank, Alexandra, 2090, South Africa",
  "distanceMeters": 4381,
  "durationSeconds": 480
}
```

---

## Error Responses

| Status Code | Cause | Example Response |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Missing or invalid query parameters (Zod validation failure) | `{ "error": "Invalid query parameters", "details": { "address": ["Address must be at least 3 characters long"] } }` |
| **`429 Too Many Requests`** | Client exceeded rate limit (30 req/min) | `{ "error": "Too many requests. Please try again in a minute." }` |
| **`502 Bad Gateway`** | Upstream Google Maps API error or no route found | `{ "error": "No route found between locations" }` |

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server with `tsx watch` |
| `pnpm build` | Compiles TypeScript source files to `dist/` |
| `pnpm start` | Runs the compiled production server |
| `pnpm db:push` | Pushes Drizzle schema changes directly to PostgreSQL |
| `pnpm db:generate` | Generates SQL migration files in `./drizzle` |
| `pnpm db:migrate` | Applies pending SQL migrations |
| `pnpm db:studio` | Launches Drizzle Studio database GUI |