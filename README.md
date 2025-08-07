# Teerthanker Aadinath Bright Dental Care Management System

A comprehensive MERN stack solution for dental clinic operations with three separate applications deployed on distinct subdomains.

## Project Structure

```
teerthanker-dental-care/
├── client/                          # React client portal (client.teerthankerdentalcare.com)
│   ├── src/
│   │   ├── shared/                  # Shared utilities and components
│   │   ├── components/              # Client-specific components
│   │   ├── pages/                   # Client pages
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # API services
│   │   ├── store/                   # Redux store
│   │   └── utils/                   # Client utilities
│   ├── public/                      # Static assets
│   ├── package.json
│   └── vite.config.js
├── admin/                           # React admin dashboard (admin.teerthankerdentalcare.com)
│   ├── src/
│   │   ├── shared/                  # Shared utilities and components
│   │   ├── components/              # Admin-specific components
│   │   ├── pages/                   # Admin pages
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # API services
│   │   ├── store/                   # Redux store
│   │   └── utils/                   # Admin utilities
│   ├── public/                      # Static assets
│   ├── package.json
│   └── vite.config.js
├── server/                          # Express.js backend (api.teerthankerdentalcare.com)
│   ├── src/
│   │   ├── controllers/             # Route controllers
│   │   ├── models/                  # MongoDB models
│   │   ├── routes/                  # API routes
│   │   ├── middleware/              # Custom middleware
│   │   ├── services/                # Business logic services
│   │   ├── utils/                   # Server utilities
│   │   └── config/                  # Configuration files
│   ├── package.json
│   └── server.js                    # Main server entry point
├── teerthanker-dental-shared/       # Shared utilities (standalone package)
│   ├── constants/                   # Shared constants
│   ├── types/                       # Type definitions
│   ├── utils/                       # Utility functions
│   ├── components/                  # Shared React components
│   ├── hooks/                       # Shared custom hooks
│   └── package.json
└── README.md
```

## Technology Stack

### Frontend (Client & Admin)

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Cloudinary** - File storage
- **Razorpay** - Payment gateway
- **MSG91** - OTP service

### Security & Performance

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **MongoDB Sanitization** - NoSQL injection prevention
- **Compression** - Response compression
- **Morgan** - HTTP request logging

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd teerthanker-dental-care
   ```

2. **Install dependencies for all applications**

   ```bash
   # Client portal
   cd client
   npm install
   cd ..

   # Admin dashboard
   cd admin
   npm install
   cd ..

   # Backend server
   cd server
   npm install
   cd ..

   # Shared utilities
   cd teerthanker-dental-shared
   npm install
   cd ..
   ```

3. **Set up environment variables**
   Create `.env` files in the server directory with required configuration.

### Development

Run all applications in development mode:

```bash
# Terminal 1 - Backend server (port 5000)
cd server
npm run dev

# Terminal 2 - Client portal (port 3000)
cd client
npm run dev

# Terminal 3 - Admin dashboard (port 3001)
cd admin
npm run dev
```

### Deployment

The applications are designed to be deployed on separate Hostinger subdomains:

- Client Portal: `https://client.teerthankerdentalcare.com`
- Admin Dashboard: `https://admin.teerthankerdentalcare.com`
- Backend API: `https://api.teerthankerdentalcare.com`

## Features

### Client Portal

- User registration with subscription plans
- OTP verification via MSG91
- Razorpay payment integration
- Multi-step appointment booking
- Profile management
- Document upload
- Payment history

### Admin Dashboard

- User management
- Appointment scheduling and rescheduling
- Session management with dental examination records
- Analytics and reporting
- Payment tracking

### Backend API

- RESTful API design
- JWT authentication
- Role-based access control
- File upload handling
- Payment processing
- OTP services
- Comprehensive error handling

## Shared Code Management

The `teerthanker-dental-shared` package contains:

- **Constants**: API endpoints, status codes, validation rules
- **Types**: TypeScript/JavaScript type definitions
- **Utils**: Formatters, validators, helpers
- **Components**: Reusable React components
- **Hooks**: Custom React hooks

This shared code is duplicated in both client and admin applications under `src/shared/` for development convenience.

## Security Features

- HTTPS enforcement
- JWT with HTTP-only cookies
- Input validation and sanitization
- NoSQL injection prevention
- Rate limiting
- CORS configuration
- Helmet security headers
- HIPAA compliance considerations

## Contributing

1. Follow the established project structure
2. Use the shared utilities for common functionality
3. Maintain consistency across client and admin applications
4. Write tests for new features
5. Follow security best practices

## License

This project is proprietary software for Teerthanker Aadinath Bright Dental Care.
