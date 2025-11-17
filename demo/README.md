# WellnessGrid

**Your Personal AI Health Coach — Designed for Teens**

WellnessGrid is a comprehensive health management platform that empowers teenagers with chronic conditions to take control of their health journey. Through AI-powered guidance, intuitive tracking tools, and smart analytics, teens can better understand and manage their health with confidence.

## 🏥 How WellnessGrid Works

### Core Features

**1. AI Health Coach**
- Chat 24/7 with an AI trained on medical knowledge
- Get personalized insights about your symptoms and patterns
- Ask questions about your condition in plain language
- Powered by BioMistral medical AI with RAG (Retrieval-Augmented Generation)

**2. Health Tracking**
- Track glucose levels, sleep, mood, medications, and more
- Simple, teen-friendly interface designed for daily use
- Automatic pattern detection and anomaly alerts
- Visual dashboards showing your wellness score and trends

**3. Smart Analytics**
- AI-generated insights from your health data
- Weekly trend visualizations and progress reports
- Identify correlations between symptoms, sleep, and activities
- Share reports with parents and doctors

**4. Health Records Management**
- Store lab results, prescriptions, and appointment notes
- Timeline view of your medical history
- Secure, HIPAA-compliant storage
- Easy sharing with healthcare providers

### Technology Stack

**The actual WellnessGrid app includes:**
- Supabase database for secure data storage
- BioMistral AI with medical knowledge base
- RAG system for context-aware responses
- Real-time health monitoring
- Supabase authentication
- PWA support — works as an app on iPhone and Android

## 📱 Demo Version

This directory contains a simplified demo version for easy evaluation and testing.

### What's Different in the Demo

The demo is a **standalone, simplified version** designed to showcase WellnessGrid's features without requiring complex setup:

- ✅ Uses mock data (no database needed)
- ✅ Keyword-based chat responses (no AI API calls)
- ✅ Self-contained Next.js app with built-in API routes
- ✅ Deploys anywhere in minutes
- ✅ No environment variables or API keys required

## 📁 Demo Structure

```
demo/frontend/
├── app/              # Next.js pages and API routes
│   ├── api/         # Built-in mock API endpoints
│   ├── dashboard/   # Health dashboard
│   ├── chat/        # AI chat interface
│   ├── analytics/   # Health insights
│   └── records/     # Medical records
├── lib/             # Mock data and utilities
├── components/      # Reusable UI components
└── package.json
```

## 🚀 Running the Demo

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Local Setup

```bash
cd demo/frontend
npm install
npm run dev
```

Visit `http://localhost:3002` in your browser.

**That's it!** No database, no API keys, no complex configuration needed.

## 🌐 Deploying the Demo

### Vercel (Recommended)

The demo deploys in minutes on Vercel's free tier:

```bash
cd demo/frontend
npm i -g vercel
vercel login
vercel --prod
```

Or use Vercel's dashboard:
1. Go to vercel.com/new
2. Import your repository
3. Set **Root Directory** to `demo/frontend`
4. Deploy

**No environment variables needed** — the demo is completely self-contained.

## 🎨 Demo Features

The demo showcases all core WellnessGrid features:

**Dashboard** — View wellness score, recent health metrics, and activity timeline

**AI Chat** — Ask health questions and get intelligent responses (keyword-based in demo)

**Analytics** — Explore health insights, trends, and pattern detection

**Health Records** — Browse sample medical records, lab results, and prescriptions

### Demo User: Sarah Chen
- 16 years old, managing Type 1 Diabetes
- Wellness Score: 78/100
- Sample data includes glucose tracking, sleep patterns, mood logs, and medications

All data is hardcoded in `lib/mock-data.json` and can be customized.

## 🔧 Customizing the Demo

**Mock Data:** Edit `lib/mock-data.json` to change user profile, health metrics, or chat responses

**Styling:** Uses Tailwind CSS — modify `app/globals.css` or component files

**API Routes:** Add new endpoints in `app/api/` directory

**Pages:** Create new pages in `app/` directory

## 📋 Demo vs Production

| Feature | Demo | Actual App |
|---------|------|------------|
| **Data Storage** | Hardcoded JSON | Supabase PostgreSQL |
| **AI Chat** | Keyword matching | BioMistral + RAG |
| **Authentication** | None | Supabase Auth |
| **Health Records** | Sample data | Real document storage |
| **Analytics** | Pre-computed | Real-time pattern detection |
| **Setup Time** | 2 minutes | 30+ minutes |
| **Mobile App** | Web only | PWA on iPhone & Android |
| **Cost** | Free | Requires API keys |

### Important Notes

**The demo is for evaluation purposes only:**
- ✅ Showcases all features and UI
- ✅ No setup or API keys required
- ✅ Deploys anywhere
- ❌ No data persistence
- ❌ No real AI models
- ❌ No authentication

**Never use the demo with real user data.**

## 🐛 Troubleshooting

**Server won't start:**
- Ensure Node.js 18+ is installed
- Check that port 3002 is available
- Run `npm install` in the frontend directory

**Build errors:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

**Styling issues:**
- Ensure all dependencies are installed
- Check that Tailwind CSS is properly configured

**API routes return 404:**
- Verify the file structure in `app/api/`
- Redeploy with a clean build

## 📚 Learn More

**About WellnessGrid:**
- See the [main README](../README.md) for the full production system
- Architecture documentation in the root directory
- Technical implementation details

**About the Demo:**
- Frontend code in `frontend/app/`
- API routes in `frontend/app/api/`
- Mock data in `frontend/lib/mock-data.json`

---

**Questions?** Check out the documentation or explore the code!

**Ready to deploy?** Follow the deployment instructions above.

