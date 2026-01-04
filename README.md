# Anime Node.js REST API

A Node.js REST API service for managing anime episodes with MongoDB integration. This service integrates with a [Spring Boot anime management API](https://github.com/KaterynaKunieva/anime-spring-rest-api) (if is not available, a mocked version is used as a fallback) to validate anime references and provides episode management functionality.

## Tech Stack

- **Node.js**: v24.12.0+
- **TypeScript**: ^5.9.3
- **Framework**: Express.js ^5.2.1
- **Database**: MongoDB 4.0+
- **Testing**: Jest ^30.2.0 with Supertest
- **Additional**: Axios, class-validator, class-transformer, log4js

## Prerequisites

- Node.js v24.12.0 or higher
- Docker and Docker Compose
- npm 10.0.0 or higher


## Running the Application

### Install dependencies:
```bash
npm install
```

### Start MongoDB with Docker Compose

```bash
docker compose up
```

This will start a MongoDB instance with:
- **Username**: root
- **Password**: example
- **Database**: anime_db
- **Port**: 27017

#### Episode Collection

```javascript
{
  _id: ObjectId,
  title: String,
  orderToWatch: Number,     // >=0, must be unique in each anime
  releaseDate: Date,
  animeId: String           // UUID, indexed
}
```


### Development Mode

```bash
npm run dev
```

### Production Mode

Build the TypeScript:
```bash
npm run build
```

Run the compiled application:
```bash
npm start
```
The server will start on [http://localhost:3000](http://localhost:3000)

## Testing

The project includes integration tests for all endpoints using Jest and Supertest.

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage Report

```bash
npm run coverage
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### 1. Create Episode

**POST** `/api/episode`

Creates a new episode for an anime. Validates required fields and ensures the referenced anime exists.

**Request Body:**
```json
{
  "title": "The Beginning",
  "orderToWatch": 1,
  "releaseDate": "2024-01-15T10:30:00Z",
  "animeId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Fields:**
- `title` (string, required): Episode title
- `orderToWatch` (number, required): Episode order/number (must be >= 0)
- `releaseDate` (date, required): ISO 8601 formatted release date
- `animeId` (string, required): ID of the anime this episode belongs to

**Success Response (201 Created):**
```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "title": "The Beginning",
  "orderToWatch": 1,
  "releaseDate": "2024-01-15T10:30:00.000Z",
  "animeId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**cURL Examples:**
```bash
curl -X POST http://localhost:3000/api/episode -H "Content-Type: application/json" -d "{\"title\": \"The Beginning\", \"orderToWatch\": 1, \"releaseDate\": \"2024-01-15\", \"animeId\": \"550e8400-e29b-41d4-a716-446655440000\"}"
```

---

#### 2. Get Episodes by Anime

**GET** `/api/episode`

Retrieves episodes for a specific anime, sorted by release date in descending order (newest first).

**Query Parameters:**
- `animeId` (string, required): The anime ID
- `size` (number, optional): Maximum number of episodes to return (default: 10)
- `from` (number, optional): Starting position for pagination (default: 0)

**Success Response (200 OK):**
```json
[
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "title": "The Finale",
    "orderToWatch": 12,
    "releaseDate": "2024-03-20T10:30:00.000Z",
    "animeId": "550e8400-e29b-41d4-a716-446655440000"
  },
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "The Climax",
    "orderToWatch": 11,
    "releaseDate": "2024-03-13T10:30:00.000Z",
    "animeId": "550e8400-e29b-41d4-a716-446655440000"
  }
]
```

**cURL Examples:**

Get first 10 episodes:
```bash
curl -X GET "http://localhost:3000/api/episode?animeId=550e8400-e29b-41d4-a716-446655440000" -H "Content-Type: application/json"
```

Get episodes with pagination (1 episodes, starting from position 0):
```bash
curl -X GET "http://localhost:3000/api/episode?animeId=550e8400-e29b-41d4-a716-446655440000&size=1&from=0" -H "Content-Type: application/json"
```

---

#### 3. Count Episodes by Anime IDs

**POST** `/api/episode/_counts`

Returns the episode count for each provided anime ID. Uses MongoDB aggregation for efficiency without loading all episode documents.

**Request Body:**
```json
{
  "animeIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "74723c34-d020-4f51-93e1-7505877840a1",
    "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  ]
}
```

**Fields:**
- `animeIds` (array of strings, required): Array of anime IDs to count episodes for (max 100)

**Success Response (200 OK):**
```json
{
  "550e8400-e29b-41d4-a716-446655440000": 12,
  "74723c34-d020-4f51-93e1-7505877840a1": 5,
  "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d": 0
}
```

**cURL Examples:**
```bash
curl -X POST http://localhost:3000/api/episode/_counts -H "Content-Type: application/json" -d "{\"animeIds\": [\"550e8400-e29b-41d4-a716-446655440000\", \"74723c34-d020-4f51-93e1-7505877840a1\", \"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d\"]}"
```

---

## Error Handling

The API returns appropriate HTTP status codes and error messages:

**Common Error Responses:**

**400 Bad Request** - Validation failed:
```json
{
  "message": "Validation failed",
  "errors": ["orderToWatch must not be less than 0"]
}
```

**404 Not Found** - Anime not found:
```json
{
  "message": "Anime with id 550e8400-e29b-41d4-a716-446655440000 doesn't exist"
}
```

**409 Conflict** - Duplicate entry (unique constraint violation):
```json
{
  "message": "Duplicate entry",
  "errors": ["Unique constraint violated for field: animeId"]
}
```

**500 Internal Server Error** - Server-side error:
```json
{
  "message": "An unexpected error occurred"
}
```