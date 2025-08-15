# Horse Riding School CRM System

## Overview

This is a comprehensive CRM (Customer Relationship Management) system designed for a horse riding school called "Солнечная Поляна" (Sunny Meadow). The system manages all aspects of the riding school operations including horses, instructors, clients, lessons, certificates, and user management. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL as the database with Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Major Updates (January 2025)

### Docker Deployment Setup
- **Complete Docker Configuration**: Created production-ready Dockerfile with multi-stage build and security optimizations
- **Docker Compose Stack**: Full orchestration with Nginx, PostgreSQL, and application containers
- **GitHub CI/CD Pipeline**: Automated deployment workflow with testing, building, and deployment stages
- **SSL Certificate Management**: Automated SSL certificate upload and configuration scripts with Let's Encrypt support
- **Production Nginx Config**: Optimized reverse proxy configuration with security headers and SSL termination
- **One-Click Auto Deploy**: Complete auto-deployment script for VPS with domain setup and SSL configuration
- **Advanced Auto-Update System**: GitHub-based updates with full data protection, automatic rollback, and health checks
- **Comprehensive Data Protection**: All content (CRM data, landing page content, user data) is fully preserved during updates

## Recent Major Updates (January 2025)

### Content Management System for Landing Page
- **News Management**: Complete CRUD operations for news articles with image support and publication dates
- **Events Management**: Full event management system with location, participant tracking, and status controls
- **Services Management**: Dynamic service management without icons, including pricing, duration, and display order
- **Administrator Controls**: Edit/delete buttons visible only to administrators for all content types
- **Modal Interfaces**: User-friendly modal forms for creating and editing all content with validation
- **Real-time Updates**: All content changes reflect immediately without page refresh

### Edit Functionality Restoration
- **Complete Edit Modal System**: Fixed all broken edit functionality across the application
- **Edit Lesson Modal**: Created comprehensive lesson editing with pre-populated fields, instructor/horse selection, and validation
- **Edit Horse Modal**: Added missing horse edit modal with all required fields and proper validation
- **Dashboard Enhancements**: Updated upcoming lessons display to show both date (DD.MM) and time (HH:MM)
- **Certificate Creation Fix**: Resolved Zod validation errors by updating schema to handle both string and number inputs
- **Real-time Data Updates**: All edit operations trigger automatic cache invalidation for immediate UI updates

## Recent Major Updates (December 2024)

### Subscription Management System
- **Complete Subscription Page**: Created dedicated subscription management interface
- **Subscription Creation**: Modal for creating subscriptions with client selection or new client creation
- **Subscription Status Tracking**: Visual status indicators (active, expired, used) with progress bars
- **Subscription Details**: Modal showing subscription usage history and associated lessons
- **Dynamic Payment Options**: Lesson creation now shows subscription availability and remaining lessons
- **Subscription Integration**: Payment type selection intelligently shows/hides subscription options

### Lesson Enhancement System
- **Duration Tracking**: Added lesson duration field (default 45 minutes) for accurate time tracking
- **Quick Completion**: Fast lesson completion buttons on both dashboard and lessons list
- **Payment Status Tags**: Visual indicators for paid lessons ("Оплачено") and unpaid lessons ("Долг")
- **Completion Modal**: Comprehensive lesson completion workflow with payment confirmation
- **Horse Time Tracking**: Lesson duration automatically added to horse workload statistics

### Dashboard Improvements
- **Upcoming Lessons**: Fixed to show next week's lessons instead of just today
- **Completion Buttons**: Added quick completion functionality to dashboard lesson cards
- **Real-time Updates**: Automatic data refresh every 15-30 seconds without page reload
- **Smart Query Invalidation**: Related data updates automatically when actions are performed

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: VK ID OAuth integration with session-based authentication
- **Database**: PostgreSQL (using Neon serverless)
- **File Storage**: Google Cloud Storage integration (with Uppy for file uploads)

### Database Schema Design
The system uses a comprehensive relational database schema with the following main entities:
- **Users**: Role-based access (observer, instructor, administrator)
- **Horses**: Horse management with status tracking (active, rest, unavailable)
- **Instructors**: Instructor profiles with specializations
- **Clients**: Client management with contact information
- **Certificates**: Gift certificate system with status tracking
- **Lessons**: Lesson scheduling with multiple instructors and horses per lesson, includes duration tracking (default 45 minutes)
- **Subscriptions**: Comprehensive subscription management with status tracking (active, expired, used), duration in months (default 6), and lesson count (default 4)

### Authentication & Authorization
- **VK ID Integration**: OAuth authentication using VK (VKontakte) social network
- **Role-Based Access Control**: Three user roles with different permissions:
  - Observer: Read-only access to basic information
  - Instructor: Can manage lessons, clients, horses, and certificates
  - Administrator: Full system access including user management
- **Session Management**: Server-side session handling with secure authentication middleware

### API Architecture
- **RESTful Design**: Standard REST endpoints for all resources
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Request/Response**: JSON-based communication with TypeScript type safety
- **Statistics Endpoints**: Specialized endpoints for reporting and analytics
- **Subscription Management**: Complete CRUD operations for subscription lifecycle
- **Lesson Completion System**: Quick lesson completion with payment tracking and automatic subscription usage

### File Upload System
- **Provider**: Google Cloud Storage for file storage
- **Frontend**: Uppy.js for drag-and-drop file uploads
- **Integration**: AWS S3-compatible API for seamless cloud storage

### Development & Build System
- **Package Management**: npm with lockfile for dependency management
- **TypeScript**: Full TypeScript support across frontend and backend
- **Development**: Hot module replacement with Vite
- **Production**: Optimized builds with code splitting and bundling
- **Database Migrations**: Drizzle Kit for database schema management

### Shared Code Architecture
- **Schema Sharing**: Common TypeScript types shared between frontend and backend
- **Validation**: Zod schemas for runtime type validation
- **Path Aliases**: Configured path aliases for clean imports (@/, @shared/)

## External Dependencies

### Database & Backend Services
- **PostgreSQL**: Primary database using Neon serverless platform
- **Google Cloud Storage**: File storage and management
- **VK API**: Authentication and user profile data

### UI & Frontend Libraries
- **Radix UI**: Accessible component primitives for form controls, dialogs, and navigation
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide Icons**: Icon library for consistent iconography
- **TanStack Query**: Server state management and caching

### Development & Build Tools
- **Vite**: Build tool and development server
- **ESBuild**: JavaScript bundler for production builds
- **Drizzle Kit**: Database schema management and migrations
- **TypeScript**: Type checking and development tooling

### File Upload & Media
- **Uppy.js**: File upload handling with drag-and-drop interface
- **AWS S3 SDK**: Cloud storage integration (compatible with Google Cloud Storage)

### Authentication & Session Management
- **Express Session**: Server-side session management
- **VK OAuth**: Social authentication integration