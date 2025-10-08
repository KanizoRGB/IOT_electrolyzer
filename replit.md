# IoT Electrolyzer Dashboard

## Overview

This is a comprehensive IoT monitoring dashboard for water electrolysis systems. The application provides real-time monitoring and historical analysis of electrolyzer operations, tracking critical parameters like voltage, current, temperature, pressure, pH levels, and gas flow rates. Built with React and Express, it features a modern industrial design optimized for mission-critical system monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses a modern React stack with TypeScript, built around a component-based architecture:
- **UI Framework**: React 18 with Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent industrial design
- **State Management**: TanStack React Query for server state and local React state for UI interactions
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Dark mode optimized for industrial monitoring with custom theme provider
- **Real-time Updates**: WebSocket integration for live sensor data streaming

### Backend Architecture
The server implements a RESTful API with WebSocket support:
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM providing type-safe database interactions
- **API Design**: RESTful endpoints for CRUD operations with WebSocket for real-time data
- **Data Simulation**: Built-in simulator for generating realistic electrolysis system data
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
PostgreSQL schema optimized for time-series IoT data:
- **Systems Table**: Stores electrolyzer system configurations and metadata
- **Sensor Readings**: Time-series data for electrical, physical, and flow parameters
- **Alert Thresholds**: Configurable warning and critical limits per system
- **Alerts**: Historical alert records with resolution tracking

### Real-time Data Flow
- WebSocket connections provide live sensor data streaming
- Data simulator generates realistic electrolysis parameters with configurable fault scenarios
- Client maintains connection state with automatic reconnection handling
- Historical data aggregation for trend analysis and performance monitoring

### Design System
- **Industrial Theme**: Dark-first design optimized for control room environments
- **Material Design Principles**: Consistent spacing, typography, and interaction patterns
- **Responsive Layout**: Grid-based layout adapting to various screen sizes
- **Accessibility**: WCAG-compliant color contrast and keyboard navigation support

### Component Architecture
Modular component design with clear separation of concerns:
- **Parameter Cards**: Real-time value display with trend indicators and status badges
- **Status Gauges**: Circular progress indicators with color-coded threshold ranges
- **Trend Charts**: Historical data visualization with configurable time ranges
- **Alert System**: Dismissible banners with action buttons and severity indicators

## External Dependencies

### Database
- **PostgreSQL**: Primary database for persistent storage via Neon serverless
- **Drizzle ORM**: Type-safe database queries and migrations

### UI Framework
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **Radix UI**: Headless UI components for accessibility and behavior
- **Lucide React**: Icon library for consistent iconography

### Data Visualization
- **Recharts**: React charting library for trend visualization and historical analysis

### Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for live data streaming

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Static type checking for enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds

### Authentication & Sessions
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Express Sessions**: Server-side session management

### Utilities
- **date-fns**: Date manipulation and formatting utilities
- **zod**: Runtime type validation and schema parsing
- **clsx/tailwind-merge**: Conditional CSS class utilities