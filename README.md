# Emtelaak Platform - Property Fractions Investment System

**A comprehensive real estate fractional ownership and investment platform built with modern web technologies.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596BE)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com/)

---

## 🌟 Overview

Emtelaak is a full-featured platform for real estate fractional ownership, enabling investors to purchase shares in premium properties. The platform includes comprehensive admin dashboards, investment flow management, KYC verification, and multi-language support (English/Arabic).

### Key Features

- **🏢 Property Management** - List, manage, and track real estate properties
- **💰 Investment Flow** - Complete investment lifecycle from reservation to payment
- **📊 Admin Dashboard** - Comprehensive admin and super admin control panels
- **👥 User Management** - Role-based access control (Admin, Fundraiser, Investor, Agent)
- **📈 Offering Management** - Create and manage property offerings with multi-stage approval
- **💳 Payment Processing** - Integrated payment tracking and escrow management
- **📋 KYC Verification** - Built-in Know Your Customer verification workflow
- **📧 Email System** - Customizable email templates and notifications
- **🌍 Multi-Language** - Full English and Arabic support with RTL
- **📱 Responsive Design** - Mobile-first design with bottom navigation
- **🔐 Security** - IP blocking, rate limiting, and comprehensive security settings

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui component library
- Wouter for routing
- tRPC React Query for data fetching

**Backend:**
- Node.js with Express 4
- tRPC 11 for end-to-end type safety
- Drizzle ORM for database operations
- MySQL/TiDB database
- JWT-based authentication

**Infrastructure:**
- Vite for build tooling
- pnpm for package management
- TypeScript for type safety
- ESLint + Prettier for code quality

---

## 📁 Project Structure

```
emtelaak-platform/
├── client/                  # Frontend React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Language, Theme)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries (tRPC client, utils)
│   │   ├── pages/          # Page components
│   │   │   ├── Admin*.tsx  # Admin dashboard pages (15 pages)
│   │   │   ├── SuperAdmin*.tsx # Super admin pages
│   │   │   ├── Offering*.tsx   # Offering management pages
│   │   │   └── ...         # Other pages (58 total)
│   │   ├── App.tsx         # Main app component with routing
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles
│   └── index.html          # HTML template
│
├── server/                  # Backend Node.js application
│   ├── _core/              # Core server infrastructure
│   │   ├── auth.ts         # Authentication logic
│   │   ├── context.ts      # tRPC context
│   │   ├── trpc.ts         # tRPC setup
│   │   ├── llm.ts          # LLM integration
│   │   └── ...             # Other core modules
│   ├── db/                 # Database helper functions
│   │   ├── offeringsDb.ts  # Offering CRUD operations
│   │   ├── investmentFlowDb.ts # Investment flow operations
│   │   └── ...             # Other DB helpers
│   ├── routes/             # tRPC route handlers
│   │   ├── offerings.ts    # Offering endpoints
│   │   ├── investmentFlow.ts # Investment endpoints
│   │   └── ...             # Other routes
│   ├── routers.ts          # Main tRPC router
│   └── storage.ts          # S3 storage helpers
│
├── drizzle/                 # Database schema and migrations
│   ├── schema.ts           # Main schema file
│   ├── offerings-schema.ts # Offering tables
│   ├── investments-schema.ts # Investment tables
│   └── investment-flow-schema.ts # Investment flow tables
│
├── shared/                  # Shared types and constants
│   └── const.ts            # Shared constants
│
├── storage/                 # S3 storage utilities
│
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
└── drizzle.config.ts       # Drizzle ORM configuration
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x or higher
- pnpm 9.x or higher
- MySQL 8.x or TiDB database
- S3-compatible storage (optional, for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emtelaak-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL` - MySQL/TiDB connection string
   - `JWT_SECRET` - Secret for JWT token signing
   - Other required variables (see `.env.example`)

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api/trpc

---

## 📊 Database Schema

### Core Tables

**Users & Authentication:**
- `users` - User accounts with role-based access
- `sessions` - User sessions

**Properties & Offerings:**
- `properties` - Real estate property listings
- `offerings` - Investment offerings for properties
- `offering_timeline` - Milestone tracking for offerings
- `offering_status_history` - Audit trail for offering status changes
- `offering_approvals` - Multi-stage approval workflow

**Investments:**
- `investments` - Main investment records
- `investment_reservations` - Time-limited share reservations
- `investment_eligibility` - Investor eligibility checks
- `investment_payments` - Payment tracking
- `escrow_accounts` - Escrow management
- `offering_investments` - Offering-based investments
- `offering_distributions` - Income distributions

**Content & Settings:**
- `email_templates` - Customizable email templates
- `legal_documents` - Legal documents and agreements
- `custom_fields` - Dynamic custom fields
- `platform_settings` - Platform configuration

**Security:**
- `ip_blocks` - IP blocking rules
- `security_settings` - Security configuration

---

## 👥 User Roles

### Super Admin
- Full platform access
- Manage all users and roles
- Configure platform settings
- Access all admin features

### Admin
- Manage users and properties
- Review and approve offerings
- Manage KYC submissions
- Access admin dashboard

### Fundraiser
- Create and manage offerings
- Track fundraising progress
- Manage property listings

### Investor
- Browse and invest in properties
- Track portfolio and returns
- Complete KYC verification

### Agent
- Manage property listings
- Track leads and cases
- Access CRM features

---

## 🎨 Admin Dashboard Features

### Super Admin Dashboard (`/super-admin`)
- Platform-wide statistics
- User management
- Role and permission management
- Security settings
- IP blocking management
- Platform configuration

### Admin Dashboard (`/admin`)
- **User Management** (`/admin/user-management`) - Manage all users
- **Property Management** (`/admin/property-management`) - Oversee all properties
- **Offering Approval** (`/admin/offering-approvals`) - Review and approve offerings
- **KYC Review** (`/admin/kyc-review`) - Verify investor identities
- **Wallet Management** (`/admin/wallet`) - Manage platform wallets
- **Invoices** (`/admin/invoices`) - Track all invoices
- **Email Templates** (`/admin/email-templates`) - Customize email templates
- **Legal Documents** (`/admin/legal-documents`) - Manage legal documents
- **Platform Settings** (`/admin/platform-settings`) - Configure platform
- **Roles & Permissions** (`/admin/roles`, `/admin/permissions`) - Manage access control
- **Income Distribution** (`/admin/income-distribution`) - Manage distributions
- **Custom Fields** (`/admin/custom-fields`) - Configure custom fields
- **Property Analytics** (`/admin/property-analytics`) - View analytics

---

## 🔐 Authentication & Security

### Authentication Flow
1. User logs in via Manus OAuth
2. JWT token issued and stored in HTTP-only cookie
3. Token validated on each request via tRPC context
4. Role-based access control enforced

### Security Features
- **Rate Limiting** - Prevent abuse
- **IP Blocking** - Block malicious IPs
- **CORS Protection** - Secure cross-origin requests
- **SQL Injection Prevention** - Parameterized queries via Drizzle ORM
- **XSS Protection** - Content Security Policy headers
- **CSRF Protection** - SameSite cookies

---

## 📧 Email System

### Email Templates
Customizable templates for:
- Welcome emails
- Investment confirmations
- KYC verification
- Distribution notifications
- Admin notifications

### Email Configuration
Configure SMTP settings in admin dashboard:
- SMTP host, port, and credentials
- From address and name
- Template customization

---

## 🌍 Multi-Language Support

### Supported Languages
- **English** (default)
- **Arabic** (with RTL support)

### Implementation
- Language context provider
- Translation keys for all UI elements
- Automatic RTL layout switching
- Breadcrumb translations
- Date/time localization

---

## 💳 Investment Flow

### Complete Investment Lifecycle

1. **Browse Properties** - Investor views available properties
2. **Create Reservation** - Reserve shares (30-minute time limit)
3. **Eligibility Check** - Verify accreditation and jurisdiction
4. **Payment** - Submit payment proof
5. **Admin Verification** - Admin verifies payment
6. **Escrow** - Funds held in escrow
7. **Completion** - Investment confirmed, shares issued
8. **Distributions** - Receive income distributions

### API Endpoints

**Reservations:**
- `createReservation` - Create share reservation
- `getReservation` - Get reservation details
- `cancelReservation` - Cancel reservation
- `expireReservations` - Auto-expire old reservations

**Eligibility:**
- `checkEligibility` - Check investor eligibility
- `updateEligibility` - Update eligibility status

**Payments:**
- `createPayment` - Submit payment proof
- `verifyPayment` - Admin payment verification
- `getPaymentsByInvestment` - Get payment history

**Escrow:**
- `createEscrowAccount` - Create escrow account
- `updateEscrowBalance` - Update escrow balance
- `releaseEscrow` - Release funds from escrow

---

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm preview          # Preview production build

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database GUI)

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
```

### Development Workflow

1. **Make changes** to code
2. **Hot reload** automatically updates
3. **Type checking** happens in real-time
4. **Test changes** in browser
5. **Commit** when ready

### Code Style

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

---

## 🧪 Testing

### Manual Testing

1. **Admin Features**
   - Login as admin user
   - Test all admin dashboard pages
   - Verify CRUD operations
   - Check role-based access

2. **Investment Flow**
   - Create reservation
   - Submit payment
   - Admin verification
   - Check escrow

3. **Multi-Language**
   - Switch between English/Arabic
   - Verify translations
   - Check RTL layout

### Test Accounts

See `DEPLOYMENT.md` for test account credentials.

---

## 📦 Deployment

### Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Environment Variables

Required for production:
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Strong secret for JWT signing
- `NODE_ENV=production`
- S3 credentials for file storage
- SMTP credentials for emails

See `.env.example` for complete list.

### Deployment Platforms

Compatible with:
- **Vercel** - Recommended for easy deployment
- **Railway** - Good for full-stack apps
- **Render** - Alternative hosting
- **Docker** - Containerized deployment
- **VPS** - Self-hosted option

---

## 📚 Documentation

- **README.md** - This file (project overview)
- **DEPLOYMENT.md** - Detailed deployment guide
- **INVESTMENT_FLOW_IMPLEMENTATION.md** - Investment system documentation
- **BREADCRUMB_IMPLEMENTATION.md** - Breadcrumb navigation guide
- **OOM_INVESTIGATION_REPORT.md** - Memory optimization guide
- **todo.md** - Development task tracking

---

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comments for complex logic
- Write meaningful commit messages

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Support

For support and questions:
- **Documentation**: See `/docs` folder
- **Issues**: Open an issue on GitHub
- **Email**: support@emtelaak.com

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful UI components
- **tRPC** - End-to-end type safety
- **Drizzle ORM** - Type-safe database queries
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Beautiful icon library

---

## 📊 Project Stats

- **Total Pages**: 58
- **Admin Pages**: 16
- **API Endpoints**: 100+
- **Database Tables**: 30+
- **Languages**: 2 (EN, AR)
- **Lines of Code**: 50,000+

---

**Built with ❤️ by the Emtelaak Team**
