# WellnessGrid Demo 🎯

> **Standalone demo version for easy evaluation and testing**

This directory contains a simplified demo version of WellnessGrid that showcases all core features without requiring any backend setup, API keys, or database configuration.

---

## 🚀 Quick Start

### Try Online

Visit the **[live demo](https://wellnessgrid.vercel.app)** (no signup required)

### Run Locally

```bash
cd demo/frontend
npm install
npm run dev
```

Visit `http://localhost:3002` in your browser.

**That's it!** No database, no API keys, no complex configuration needed.

---

## 📱 What's in the Demo

The demo showcases all core WellnessGrid features with mock data:

- **Interactive Dashboard** — View wellness score, recent health metrics, and activity timeline
- **AI Chat Assistant** — Ask health questions and get intelligent responses (keyword-based in demo)
- **Health Analytics** — Explore insights, trends, and pattern detection
- **Health Records** — Browse sample medical records, lab results, and prescriptions
- **Mobile-Responsive Design** — Works beautifully on desktop and mobile devices

### Demo User: Sarah Chen

- 16 years old, managing Type 1 Diabetes
- Wellness Score: 78/100
- Sample data includes glucose tracking, sleep patterns, mood logs, and medications

All data is hardcoded in `frontend/lib/mock-data.json` and can be customized.

---

## 🎨 Demo vs Production

| Feature | Demo Version | Production Version |
|---------|-------------|-------------------|
| **Data Storage** | Hardcoded JSON | Supabase PostgreSQL |
| **AI Chat** | Keyword matching | BioMistral + RAG system |
| **Authentication** | None (demo user) | Supabase Auth |
| **Real-time Sync** | No | Yes |
| **Data Persistence** | No | Yes |
| **Medical Knowledge** | Pre-written responses | 1000+ medical documents via RAG |
| **External APIs** | None | Multiple LLM services |
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

---

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
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Set **Root Directory** to `demo/frontend`
4. Deploy

**No environment variables needed** — the demo is completely self-contained.

---

## 📁 Demo Structure

```
demo/
├── frontend/
│   ├── app/              # Next.js pages and API routes
│   │   ├── api/         # Built-in mock API endpoints
│   │   ├── dashboard/   # Health dashboard
│   │   ├── chat/        # AI chat interface
│   │   ├── analytics/   # Health insights
│   │   └── records/     # Medical records
│   ├── lib/             # Mock data and utilities
│   ├── components/      # Reusable UI components
│   └── package.json
└── LICENSE              # MIT License
```

---

## 🔧 Customizing the Demo

**Mock Data:** Edit `frontend/lib/mock-data.json` to change user profile, health metrics, or chat responses

**Styling:** Uses Tailwind CSS — modify `frontend/app/globals.css` or component files

**API Routes:** Add new endpoints in `frontend/app/api/` directory

**Pages:** Create new pages in `frontend/app/` directory

---

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

---

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

## 📄 License

This demo is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

---

**Questions?** Check out the [main documentation](../README.md) or explore the code!

**Ready to deploy?** Follow the deployment instructions above.
