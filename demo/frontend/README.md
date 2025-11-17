# WellnessGrid Demo Frontend

This is a simplified Next.js frontend for the WellnessGrid demo. It connects to the mock backend API to display health tracking features.

## Purpose

This demo frontend is designed for:
- Hack Club CAC certification
- Showcasing the WellnessGrid user experience
- Demonstration to judges and stakeholders
- **NOT for production use**

## Features

- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Dashboard with health metrics
- ✅ AI chat interface
- ✅ Health analytics and trends
- ✅ Health records viewer
- ✅ No authentication required (hardcoded demo user)
- ✅ Mobile-friendly design

## Prerequisites

- Node.js 18+ installed

## Installation

```bash
cd demo/frontend
npm install
```

## Running Locally

```bash
npm run dev
```

Open http://localhost:3002 in your browser

**Note:** No separate backend needed! API routes are built into this Next.js app.

## Available Pages

### Home (`/`)
Landing page explaining the demo with links to features

### Dashboard (`/dashboard`)
Main health dashboard showing:
- Wellness score
- Key health metrics (glucose, sleep, mood, activity)
- Recent tracking entries
- Quick action links

### Chat (`/chat`)
AI health assistant interface with:
- Interactive chat UI
- Pre-written responses based on keywords
- Quick prompt suggestions
- Message history

### Analytics (`/analytics`)
Health insights and trends showing:
- Automated health insights
- Weekly trend visualizations
- Progress indicators

### Health Records (`/records`)
Sample medical records including:
- Lab results
- Appointment notes
- Prescriptions

## Configuration

No environment variables needed! The API routes are built into the Next.js app and serve data from `lib/mock-data.json`.

## Project Structure

```
demo/frontend/
├── app/
│   ├── page.tsx              # Home/landing page
│   ├── dashboard/page.tsx    # Main dashboard
│   ├── chat/page.tsx         # AI chat interface
│   ├── analytics/page.tsx    # Health analytics
│   ├── records/page.tsx      # Health records
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── lib/
│   ├── demo-api.ts           # API client
│   └── utils.ts              # Utility functions
├── components/               # (Minimal - could add more)
├── public/                   # Static assets
└── package.json
```

## Key Technologies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Markdown** - Chat message rendering

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. From this directory: `vercel`
3. Done! No environment variables needed.

### Netlify

1. Build the project: `npm run build`
2. Deploy the `.next` folder
3. No environment variables needed!

### Other Platforms

Any platform that supports Next.js will work. Just deploy and it works - no configuration needed!

## Customization

### Changing the Demo User

The demo user data comes from the backend's `mock-data.json`. To change it, edit that file and restart the backend.

### Adding More Pages

Create new files in the `app/` directory. Next.js uses file-based routing.

### Styling

- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Use utility classes for component styling

## Demo Limitations

This is a simplified version with:
- No authentication system
- No real database
- No data persistence
- Simulated API delays
- Limited error handling
- Pre-written AI responses

For the full production system, see the main project README.

## Troubleshooting

### "Failed to fetch" errors
Make sure the demo backend is running on port 5001.

### Styles not loading
Run `npm install` to ensure all dependencies are installed.

### Build errors
Check that you're using Node.js 18 or higher: `node --version`

## Support

This is a demo project for CAC/Hack Club certification. For questions about the full WellnessGrid system, see the main README in the project root.

## Demo Flow for Judges

1. **Start at Home** (`/`) - Read about the project
2. **View Dashboard** (`/dashboard`) - See health metrics and wellness score
3. **Try Chat** (`/chat`) - Interact with AI assistant
4. **Check Analytics** (`/analytics`) - View health insights and trends
5. **Browse Records** (`/records`) - See sample health records

The entire demo can be shown in 5-10 minutes!

