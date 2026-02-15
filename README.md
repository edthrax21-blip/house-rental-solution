# House Rental App — Full-Stack Solution

Separate **React** frontend, **.NET Web API** with **Swagger**, and **SQL Server** database.

## Solution structure

```
house-rental-solution/
├── HouseRental.sln
├── src/
│   └── HouseRental.Api/          # .NET 8 Web API (Swagger, EF Core, SQL Server)
│       ├── Controllers/
│       ├── Data/
│       ├── Migrations/
│       ├── Models/
│       └── Program.cs
├── frontend/                     # React (Vite + TypeScript)
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Prerequisites

- **.NET 8 SDK** — [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** (for the React app)
- **SQL Server** — LocalDB (included with Visual Studio) or SQL Server Express. The default connection string uses `(localdb)\mssqllocaldb`.

## 1. Run the API (backend)

```bash
cd house-rental-solution/src/HouseRental.Api
dotnet run
```

- API: **http://localhost:5000**
- Swagger UI: **http://localhost:5000/swagger**

The app runs migrations on startup and creates the database if it doesn’t exist.

### Database connection

Default in `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HouseRentalDb;Trusted_Connection=True;MultipleActiveResultSets=true"
}
```

To use a different SQL Server instance, change this connection string (and ensure the server is running).

## 2. Run the React frontend

```bash
cd house-rental-solution/frontend
npm install
npm run dev
```

- App: **http://localhost:5173**

**Important:** Login (and all API calls) go to the **.NET API**. You must have the **API running first** (step 1). If you click Login and nothing happens or you see "Cannot reach the API", start the API on **http://localhost:5000** (e.g. run the .NET project or `dotnet run`), then try again.

Vite proxies `/api` to `http://localhost:5000` by default. If your API runs on a different URL when debugging (e.g. from Visual Studio), create a file `frontend/.env` with:

```
VITE_API_URL=http://localhost:5000
```

Use the actual URL and port where your API is running.

## Authentication (JWT)

- **Login:** `POST /api/auth/login` with `{ "userName": "admin", "password": "admin123" }` returns a JWT.
- **Register:** `POST /api/auth/register` with `{ "userName": "...", "password": "..." }` creates a new user (password min 6 characters).
- A default user is seeded on first run: **admin** / **admin123**.
- All `/api/rentals` endpoints require the `Authorization: Bearer <token>` header. In Swagger, use **Authorize** and enter your token.

JWT settings are in `appsettings.json` under `Jwt` (key, issuer, audience, expiry). In production, set `Jwt:Key` to a long, secret value (e.g. 32+ chars).

## API overview (Swagger)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Get JWT (no auth required) |
| POST | `/api/auth/register` | Register new user (no auth required) |
| GET | `/api/rentals` | List rentals (optional `?status=` and `?search=`) — **requires JWT** |
| GET | `/api/rentals/{id}` | Get one rental — **requires JWT** |
| POST | `/api/rentals` | Create rental — **requires JWT** |
| PUT | `/api/rentals/{id}` | Update rental — **requires JWT** |
| DELETE | `/api/rentals/{id}` | Delete rental — **requires JWT** |

Request/response shapes and examples are in **Swagger UI** at http://localhost:5000/swagger.

## Building for production

- **API:** `dotnet publish -c Release` (from `src/HouseRental.Api`).
- **Frontend:** `npm run build` (from `frontend`). Serve the `frontend/dist` folder with any static host; point the app at your deployed API (e.g. via env or config).
