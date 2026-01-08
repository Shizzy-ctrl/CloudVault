# CloudVault Frontend - React 19

A modern React 19 frontend for the CloudVault application with TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- **React 19** with latest features including the `use` hook
- **TypeScript** for type safety and better developer experience
- **React Router 7** for client-side routing
- **shadcn/ui** components for beautiful, accessible UI
- **Component-based architecture** with modern React hooks
- **Custom hooks** for data fetching and state management
- **Error Boundaries** for better error handling
- **Suspense** for loading states
- **Tailwind CSS** for styling
- **Environment configuration** with Vite
- **Vite** for fast development and building

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building

To build the application for production:

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Login.tsx       # Login component
│   ├── Dashboard.tsx   # Dashboard component
│   ├── Download.tsx    # Download component
│   ├── ChangePassword.tsx # Change password component
│   └── ErrorBoundary.tsx # Error boundary component
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   └── useApi.ts       # API hook
├── lib/                # Utility functions
│   ├── api.ts          # API utilities
│   └── utils.ts        # General utilities
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Key Technologies

- **React 19**: Latest React with new features
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **React Router 7**: Client-side routing
- **Lucide React**: Icon library

## Features Implemented

- Authentication with JWT tokens
- File upload with progress tracking
- Share creation with password protection and expiration
- Password change functionality
- Download functionality (placeholder)
- Responsive design
- Dark mode support
- Error handling and loading states
- Form validation

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: `/api`)

## Development

The project uses modern React patterns:

- **Hooks**: useState, useEffect, useContext, useReducer
- **Error Boundaries**: Class components for error handling
- **Suspense**: For loading states
- **TypeScript**: For type safety
- **Component Composition**: Reusable UI components
