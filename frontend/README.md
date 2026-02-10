# NexusPulse Frontend

Next.js frontend for NexusPulse Leave and Attendance Management System.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Material UI
- Axios for API calls
- OIDC Client for Keycloak authentication
- React Query for state management
- React Hook Form for form handling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=nexuspulse
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=nexuspulse-frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/lib` - Utilities, API clients, and helpers
- `/src/types` - TypeScript type definitions
