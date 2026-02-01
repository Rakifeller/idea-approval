# AI Influencer - Idea Approval Dashboard

A simple password-protected dashboard for approving or rejecting AI-generated content ideas.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-secure-password
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

## Features

- 🔐 Password-protected access
- 📋 View all pending content ideas
- ✅ Approve ideas (moves to approved status)
- ❌ Reject ideas (moves to rejected status)
- 🔄 Real-time refresh
- 📱 Responsive design

## Usage

1. Login with your admin password
2. Review each content idea card
3. Click "Approve" or "Reject" for each idea
4. Approved ideas will be ready for content generation workflow
5. Rejected ideas will be archived

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database & API
