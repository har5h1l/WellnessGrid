# WellnessGrid 🏥

> **Empowering teens to take control of their health journey**

A comprehensive health tracking and AI wellness platform designed specifically for teenagers managing chronic conditions like Type 1 Diabetes. WellnessGrid combines intuitive health tracking tools with AI-powered insights to help teens stay on top of their wellness. This app was a submission for the Congressional App Challenge.

---

## 🎯 Quick Links

- **[Live Demo](https://your-demo-url.vercel.app)** - Try the demo version (no signup required)
- **[Demo Documentation](./demo/)** - Learn about the demo setup
- **[Full Documentation](./docs/)** - Detailed guides for the production system

---

## 🚀 About This Project

WellnessGrid was created to address a real need: teenagers with chronic health conditions often struggle with managing their health data across multiple apps and sources. This platform brings everything together in one place with a teen-friendly interface and AI assistance.

### The Problem
- Health tracking apps are often designed for adults
- Teens need simplified, engaging interfaces
- Managing chronic conditions requires consistent tracking and insights
- Medical information can be overwhelming and hard to understand

### Our Solution
WellnessGrid provides:
- **Intuitive tracking tools** for glucose, medications, sleep, mood, nutrition, and more
- **AI health assistant** trained on medical knowledge to answer questions
- **Automated insights** that identify patterns and trends
- **Teen-focused design** that's modern, fast, and mobile-friendly
- **Privacy-first approach** with secure data storage

---

## 📺 Demo Version

We've created a standalone demo version that showcases WellnessGrid's features without requiring any backend setup or API keys. The demo uses mock data and simulated responses.

### Try the Demo

1. **Online**: Visit [wellnessgrid.vercel.app](https://wellnessgrid.vercel.app)
2. **Run Locally**: See [demo/README.md](./demo/README.md) for instructions

### What's in the Demo

- Interactive dashboard with health metrics
- AI chat assistant with realistic responses
- Health analytics and trend visualization
- Sample health records
- Mobile-responsive design
- No API keys or setup required

### Demo vs Production

| Feature | Demo Version | Production Version |
|---------|-------------|-------------------|
| Data Storage | Hardcoded JSON | Supabase PostgreSQL |
| AI Responses | Keyword matching | BioMistral + RAG system |
| Authentication | None (demo user) | Supabase Auth |
| Real-time Sync | No | Yes |
| Data Persistence | No | Yes |
| Medical Knowledge | Pre-written responses | 1000+ medical documents via RAG |
| External APIs | None | Multiple LLM services |

---

## 🏗️ Production System Architecture

The full WellnessGrid system is a sophisticated health platform with enterprise-grade features.

### Tech Stack

**Frontend:**
- Next.js 15 (React 19)
- TypeScript
- Tailwind CSS + shadcn/ui
- Progressive Web App (PWA)

**Backend:**
- Supabase (PostgreSQL, Auth, Storage)
- Flask API server for RAG system
- Python + PubMedBERT embeddings
- BioMistral 7B medical AI model

**AI/ML:**
- RAG (Retrieval-Augmented Generation)
- PubMedBERT for medical document embeddings
- BioMistral 7B for medical response generation
- Gemini API for prompt enhancement
- OpenRouter as LLM fallback

### Key Features

#### 1. Health Tracking Tools
- **Glucose Tracker** - Blood sugar monitoring with trend analysis
- **Medication Logger** - Track doses, times, and adherence
- **Sleep Tracker** - Monitor sleep duration and quality
- **Mood Tracker** - Emotional wellness monitoring
- **Nutrition Tracker** - Food intake and carb counting
- **Symptom Tracker** - Log symptoms and severity
- **Vital Signs** - Blood pressure, heart rate, temperature
- **Hydration Tracker** - Daily water intake

#### 2. AI Health Assistant
- Chat interface with medical AI
- RAG system with 1000+ medical documents
- Context-aware responses based on user health data
- Multi-turn conversations with session memory
- Medical terminology simplified for teens

#### 3. Smart Analytics
- Automated health insights
- Pattern recognition across metrics
- Trend visualization
- Correlation analysis (e.g., sleep vs glucose)
- Wellness score calculation

#### 4. Data Management
- Secure health record storage
- Document upload and organization
- Export capabilities
- Privacy controls

---

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (for RAG system)
- Supabase account (free tier works)
- API keys (see below)

### Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LLM Services
GEMINI_API_KEY=your_google_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
FLASK_API_URL=http://localhost:5000
```

**⚠️ SECURITY**: Never commit API keys to Git. Use `.env.local` for local development and secure environment variable management in production.

### Installation

```bash
# Install frontend dependencies
npm install

# Set up Python environment for RAG system
cd scripts/data-processing
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Set up database
# Follow docs/supabase-setup.md for detailed instructions
```

### Running the Development Server

```bash
# Frontend (Next.js)
npm run dev

# Backend RAG server (separate terminal)
cd api-servers
python enhanced_flask_server.py
```

---

## 📚 Documentation

Detailed guides are available in the `/docs` directory:

- **[Supabase Setup](./docs/supabase-setup.md)** - Database configuration
- **[LLM Integration](./docs/llm-integration-setup.md)** - AI setup guide
- **[Tools Implementation](./docs/tools-implementation.md)** - Health tracking tools
- **[RAG System Guide](./docs/rag-upgrade-guide.md)** - Medical knowledge base

---

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Test API endpoints
node tests/test-api.js

# Test database connection
npx ts-node tests/test-supabase.ts
```

---

## 📝 Project Status

**Current Version**: 1.0.0 (Demo Ready)

- ✅ Core health tracking features
- ✅ AI chat assistant with RAG
- ✅ Analytics and insights
- ✅ Mobile-responsive design
- ✅ Demo version for showcasing
- 🚧 Advanced analytics (in progress)
- 🚧 Social features (planned)
- 🚧 Integration with wearables (planned)
- 🚧 Telemedicine features (planned)

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- **Medical AI Models**: BioMistral (HuggingFace), PubMedBERT (Microsoft)
- **UI Components**: shadcn/ui, Radix UI
- **Backend Services**: Supabase team
- **Inspiration**: Every teenager managing a chronic condition

---

## 📞 Contact & Support

- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check `/docs` directory
- **Demo**: Visit the live demo for quick overview

---

**Made with ❤️ for teen health empowerment**

*WellnessGrid - Because managing your health should be as easy as checking social media.*

---

## 🗂️ Repository Structure

```
WellnessGrid App/
├── app/                     # Next.js app directory (pages)
├── components/              # React components
├── lib/                     # Utilities, services, types
├── docs/                    # Documentation
├── demo/                    # 🎯 Demo version (for judges)
│   ├── backend/            # Mock API server
│   └── frontend/           # Simplified Next.js frontend
├── api-servers/            # Flask RAG server
├── scripts/                # Database & data processing
├── public/                 # Static assets
└── README.md              # You are here!
```

---
