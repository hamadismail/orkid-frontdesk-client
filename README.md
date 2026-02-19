# Xpeed Frontdesk - Architecture Overview

## Project Overview
Eco Hotel is a hotel management system built with Next.js 15, TypeScript, and MongoDB. It provides functionality for room management, reservations, bookings, and payment tracking for hotel operations.

## Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React Query (TanStack Query)
- **Backend**: Next.js API Routes with MongoDB (Mongoose ODM)
- **Database**: MongoDB
- **Validation**: Zod
- **Forms**: React Hook Form
- **Icons**: Lucide React

## Project Structure
```
src/
├── app/                    # Next.js app router structure
│   ├── (routes)/          # Route groups
│   │   └── (root)/        # Main application routes
│   │       ├── calendar/   # Calendar view
│   │       ├── dashboard/  # Dashboard page
│   │       ├── guests/     # Guest management
│   │       ├── payments/   # Payment tracking
│   │       ├── reservation/# Room reservation
│   │       └── settings/   # Application settings
│   └── api/               # API routes
│       ├── book/          # Booking operations
│       ├── guests/        # Guest management
│       ├── payments/      # Payment operations
│       ├── reserve/       # Reservation operations
│       ├── rooms/         # Room management
│       └── stayover/      # Stayover operations
├── components/            # React components
│   ├── features/          # Feature-specific components
│   │   ├── home/          # Home page components
│   │   └── payments/      # Payment components
│   └── layout/            # Layout components
├── lib/                   # Library functions
├── models/                # Mongoose models
├── providers/             # React context providers
├── services/              # Server actions and services
├── styles/                # CSS styles
├── types/                 # TypeScript types
└── utils/                 # Utility functions
```

## Core Features

### 1. Room Management
- View all rooms with status (Available, Reserved, Occupied)
- Filter rooms by floor, type, and status
- Room details display with icons based on room type

### 2. Reservation System
- Create reservations for future dates
- Reservation form with multi-step process
- Reservation calendar view
- Quick reservation from calendar

### 3. Booking System
- Check-in guests to rooms
- Booking form with guest, stay, and payment information
- Multi-step booking process with invoice preview

### 4. Payment Tracking
- View checked-in guests with payment information
- Track paid amounts and due amounts
- Payment method tracking

### 5. Calendar View
- Visual representation of reservations and bookings
- Quick booking/reservation from calendar dates
- Room availability overview

## Data Models

### Room Model
- `roomNo`: Unique room identifier
- `roomType`: Type of room (Standard Queen, Deluxe Twin, etc.)
- `roomFloor`: Floor number
- `roomStatus`: Current status (Available, Reserved, Occupied)

### Reservation Model
- `guest`: Guest information (name, phone, email, etc.)
- `room`: Room details for reservation (roomNo, dates, etc.)
- `payment`: Payment information for reservation
- `reservationDate`: Date of reservation

### Booking Model
- `guest`: Guest information with status tracking
- `stay`: Stay details (arrival, departure, guests)
- `payment`: Payment information
- `roomId`: Reference to the booked room

## API Architecture
The application uses Next.js API routes for backend functionality:

- `/api/rooms` - Room management (GET, POST)
- `/api/reserve` - Reservation operations (GET, POST)
- `/api/book` - Booking operations (GET, POST)
- `/api/payments` - Payment tracking (GET)
- `/api/guests` - Guest management (GET)
- `/api/stayover` - Stayover operations (GET)

## Component Architecture
The UI is organized into reusable components:

### Layout Components
- `AppSidebar`: Main navigation sidebar
- `SiteHeader`: Top application header
- `Invoice`: Booking invoice display
- `ReservationInvoice`: Reservation confirmation invoice

### Feature Components
- `RoomCard`: Individual room display with status
- `BookRoomDialog`: Room booking dialog with multi-step form
- `Reservation`: Reservation form with multi-step process
- `CalendarPage`: Calendar view with booking/reservation capabilities
- `PaymentModal`: Payment processing modal

## State Management
The application uses React Query for server state management:
- Data fetching and caching for API endpoints
- Automatic refetching after mutations
- Optimistic updates for better UX

## Database Connection
MongoDB connection is managed through a cached connection pattern to prevent multiple connections during hot-reloading in development.

## Services and Utilities
- Server actions for database operations
- Utility functions for room icons and other helpers
- Mongoose model definitions with TypeScript interfaces

## Key Patterns and Practices
1. **Multi-step Forms**: Both booking and reservation use multi-step forms with validation
2. **Responsive Design**: Mobile-first approach with Tailwind CSS
3. **Type Safety**: Comprehensive TypeScript typing throughout
4. **Error Handling**: Proper error handling with user feedback
5. **Transaction Management**: Database transactions for consistency in reservation operations
6. **Reusable Components**: Component-based architecture for maintainability
