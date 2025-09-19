# ProjectX Full-Stack SaaS Boilerplate

> A modern, production-grade full-stack SaaS web application boilerplate built with cutting-edge technologies and best practices.

## 🚀 Overview

ProjectX is a comprehensive SaaS boilerplate designed to accelerate your development process. Built with modern tools and scalable architecture, it provides everything you need to launch your next SaaS product quickly and efficiently.

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework (App Router) | Latest |
| **TypeScript** | Type Safety | Latest |
| **Tailwind CSS** | Styling Framework | Latest |
| **Supabase** | Backend-as-a-Service | Latest |
| **TurboRepo** | Monorepo Management | Latest |
| **GitHub** | Version Control & CI/CD | - |

## 📁 Monorepo Structure

```
projectx/
├── apps/
│   ├── web/                 # Main frontend application
│   └── admin/               # Admin dashboard
├── packages/
│   ├── ui/                  # Shared reusable UI components
│   └── config/              # Shared configurations
├── .env.example             # Environment variables template
├── .env.local               # Local environment variables
├── turbo.json               # TurboRepo configuration
├── package.json             # Root package.json
└── README.md                # Project documentation
```

### 📂 Directory Breakdown

- **`/apps/web`** → Main customer-facing SaaS application
- **`/apps/admin`** → Administrative dashboard for managing users and data
- **`/packages/ui`** → Shared component library (buttons, inputs, modals, etc.)
- **`/packages/config`** → Shared Tailwind config and TypeScript paths

## ✨ Core Features

### 🎨 Frontend Features
- [x] **Fully Responsive Design** - Modern Tailwind CSS implementation
- [x] **Clean Architecture** - Scalable and modular file structure
- [x] **App Router Ready** - Next.js 13+ App Router with layouts
- [x] **TypeScript Integration** - Full type safety across the application
- [x] **Path Aliases** - Clean import statements with TypeScript paths

### 🔐 Authentication & Database
- [x] **Supabase Authentication** - Email/password + optional magic link
- [x] **Database Integration** - Supabase PostgreSQL preconfigured
- [x] **User Management** - Complete auth flow with protected routes

### 🧩 Component System
- [x] **Reusable UI Components** - Pre-built button, input, modal components
- [x] **Shared Component Library** - Consistent design system
- [x] **Tailwind Configuration** - Shared styling configuration

### ⚙️ Development Experience
- [x] **Environment Variables** - Proper `.env` setup with examples
- [x] **Git Integration** - Repository initialized and GitHub ready
- [x] **TurboRepo Scripts** - Optimized build and development workflows
- [x] **Hot Reload** - Fast development with instant updates

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (LTS version)
- npm or yarn
- Git
- A Supabase account

---

## 📋 Setup Instructions

### 1. ✅ Install Node.js, npm, and npx

Visit [nodejs.org](https://nodejs.org) and download the LTS version.

After installation, verify in your terminal:

```bash
node -v
npm -v
npx --version
```

You should see version numbers for all three commands.

---

### 2. 🛠️ Fix PowerShell Script Errors (Windows Only)

If PowerShell blocks script execution, run this command as Administrator:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

### 3. ✅ Install Git CLI

Download and install Git from [git-scm.com](https://git-scm.com/)

Verify installation:

```bash
git --version
```

---

### 4. ✅ Install Supabase CLI

Install the Supabase CLI globally:

```bash
npm install -g supabase
```

Verify installation:

```bash
supabase --version
```

---

### 5. 🔁 Clone & Install Project

Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR-USERNAME/projectx.git
cd projectx
npm install
```

---

### 6. 🔑 Connect to Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from the API settings
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

> 💡 **Tip:** Copy from `.env.example` and replace the placeholder values

---

### 7. ▶️ Run Development Server

#### Option 1: Run Individual Apps

```bash
# Run main web app
cd apps/web
npm run dev

# Run admin dashboard (in another terminal)
cd apps/admin
npm run dev
```

#### Option 2: Run All Apps with TurboRepo

```bash
# Run all apps simultaneously
npm run dev

# Or using turbo directly
turbo dev
```

Your applications will be available at:
- **Web App:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3001

---

### 8. 🔁 Set Up GitHub Repository

Initialize Git and push to GitHub:

```bash
git init
git remote add origin https://github.com/YOUR-USERNAME/projectx.git
git add .
git commit -m "Initial commit: ProjectX SaaS Boilerplate"
git push -u origin main
```

---

## 🏗️ Development Workflow

### Building the Project

```bash
# Build all apps
npm run build

# Or using turbo
turbo run build
```

### Running Tests

```bash
# Run tests for all packages
npm run test

# Run tests with turbo
turbo run test
```

### Linting and Formatting

```bash
# Lint all packages
npm run lint

# Format code
npm run format
```

## 📦 Key Files & Configurations

### Supabase Client Setup

Located in `/lib/supabase-client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Shared Tailwind Configuration

Located in `/packages/config/tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "../../apps/*/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Your custom theme extensions
    },
  },
  plugins: [],
}
```

### TypeScript Path Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/ui/*": ["../../packages/ui/*"]
    }
  }
}
```

## 🎯 Next Steps & Extensions

### Immediate Enhancements
- [ ] **Stripe Integration** - Add subscription billing
- [ ] **Role-Based Access Control** - Implement user roles and permissions
- [ ] **Email Templates** - Set up transactional emails
- [ ] **API Routes** - Add custom API endpoints
- [ ] **Database Migrations** - Set up Supabase migrations

### Advanced Features
- [ ] **Multi-tenancy** - Support for multiple organizations
- [ ] **Analytics Dashboard** - User behavior tracking
- [ ] **Notification System** - In-app and email notifications
- [ ] **File Upload** - Supabase Storage integration
- [ ] **Real-time Features** - WebSocket connections

### DevOps & Production
- [ ] **CI/CD Pipeline** - GitHub Actions workflow
- [ ] **Docker Configuration** - Containerization setup
- [ ] **Monitoring** - Error tracking and performance monitoring
- [ ] **Testing Suite** - Unit and integration tests
- [ ] **Documentation** - API documentation with Swagger

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Issue:** PowerShell execution policy errors
**Solution:** Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

**Issue:** Supabase connection errors
**Solution:** Verify your `.env.local` file has the correct URL and anon key

**Issue:** Port conflicts
**Solution:** Kill processes on ports 3000/3001 or change ports in package.json

### Getting Help

- 📖 [Next.js Documentation](https://nextjs.org/docs)
- 📖 [Supabase Documentation](https://supabase.com/docs)
- 📖 [TurboRepo Documentation](https://turbo.build/repo/docs)
- 📖 [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🎉 Conclusion

ProjectX provides a solid foundation for building modern SaaS applications. With its carefully chosen tech stack and well-organized structure, you can focus on building your unique features rather than setting up boilerplate code.

**Happy coding!** 🚀

---

*Built with ❤️ for the developer community*
