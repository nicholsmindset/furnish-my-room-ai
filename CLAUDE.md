# CLAUDE.md - Project Context for Claude Code

## Project Overview

**Furnish My Room AI (RoomReimagine)** - An AI-powered virtual staging and interior design SaaS platform. Users upload room photos and receive AI-generated interior design renderings using FAL.AI.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui (Radix UI components)
- **State:** TanStack React Query + React Context + React Hook Form
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Payments:** Stripe
- **AI:** FAL.AI for image generation
- **Email:** Resend

## Key Commands

```bash
npm run dev      # Start dev server (localhost:8080)
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── pages/           # Page components (Index, Auth, Pricing, Dashboard, Admin)
├── contexts/        # AuthContext (auth, subscription, credits)
├── hooks/           # useIsAdmin, use-mobile, use-toast
├── integrations/    # Supabase client & types
└── lib/             # Utilities

supabase/
├── functions/       # Deno edge functions
│   ├── generate-design/      # FAL.AI integration
│   ├── create-checkout/      # Stripe checkout
│   └── check-subscription/   # Subscription validation
└── migrations/      # Database schema (8 migration files)
```

## Key Files

- `src/App.tsx` - Main routing and provider setup
- `src/contexts/AuthContext.tsx` - Auth state, subscription, credits
- `src/pages/Index.tsx` - Core workflow (upload → select → generate → results)
- `src/pages/AdminDashboard.tsx` - Admin analytics and user management
- `supabase/functions/generate-design/index.ts` - AI image generation endpoint

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page / main app workflow |
| `/auth` | Sign in / sign up |
| `/pricing` | Subscription plans |
| `/dashboard` | User dashboard |
| `/favorites` | Saved designs |
| `/batch` | Batch processing (Business tier) |
| `/gallery` | Shared gallery |
| `/admin` | Admin dashboard |

## Application Flow

1. User uploads room image
2. Selects room type and design style
3. Frontend calls edge function with auth token
4. Edge function validates auth, deducts credits
5. FAL.AI generates transformed image
6. Result saved to `design_generations` table
7. Image displayed to user

## Database Tables

- `design_generations` - Generated images and metadata
- `user_credits` - Credit balance per user
- `user_roles` - Admin role assignments
- `subscriptions` - Stripe subscription data

## Subscription Tiers

- **Free:** 3 designs/month, 5 styles, 1080p
- **Pro ($29/mo):** 50 designs/month, 4K, all styles
- **Business ($99/mo):** Unlimited, 8K, API access, team features

## Environment Variables

```
VITE_SUPABASE_URL              # Supabase API endpoint
VITE_SUPABASE_PUBLISHABLE_KEY  # Anon key for client
VITE_SUPABASE_PROJECT_ID       # Project identifier
```

## Code Conventions

- Path alias: `@/*` maps to `./src/*`
- Components use TypeScript interfaces for props
- shadcn/ui components in `src/components/ui/`
- Dark mode via CSS variables (class-based toggle)
- Edge functions written in Deno/TypeScript

## Security Notes

- Auth tokens validated on all edge functions
- Credit balance checked before AI generation
- Image size limited to 10MB
- Admin role required for sensitive operations
- CORS headers configured on all endpoints

## Stripe Product IDs

- Pro: `prod_RZkgNtbGJ0eY8j`
- Business: `prod_RZkhKK9YPWl8YJ`
