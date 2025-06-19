# WellnessGrid App 🏥

> An AI-powered personal health companion designed specifically for teens to track symptoms, manage health conditions, and receive personalized guidance.

## 🌟 Overview

WellnessGrid is a comprehensive health tracking and management platform that combines modern web technologies with AI-powered insights. The app helps teenagers take control of their health journey by providing personalized tracking tools, AI chat support, and evidence-based health information.

### ✨ Key Features

- **🤖 AI Health Companion**: 24/7 chat support with specialized medical AI models (BioGPT & BioBERT)
- **📊 Comprehensive Health Tracking**: Monitor symptoms, mood, medications, vital signs, and more
- **🎯 Personalized Protocols**: Custom care plans designed by healthcare professionals
- **📈 Smart Analytics**: Identify patterns and trends in your health data
- **👥 Family Sharing**: Generate reports to share with parents and doctors
- **🔒 Privacy-First**: Secure data handling with user-controlled privacy settings

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Shadcn/ui** - Modern UI component library
- **Recharts** - Data visualization

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)** - User data isolation
- **Supabase Auth** - User authentication and management

### AI Integration
- **Custom Flask Backend** - Running BioGPT and BioBERT models
- **BioGPT-Large** - Medical text generation
- **BioBERT** - Medical document embeddings and search
- **ngrok** - Secure tunneling for development

### Development Tools
- **pnpm** - Fast package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
- (Optional) Google Colab for AI backend

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/wellnessgrid-app.git
cd wellnessgrid-app
```
**Note:** Replace `yourusername` with your actual GitHub username.

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
FLASK_API_URL=your_flask_backend_url
```
**⚠️ Security Note:** Never commit your `.env.local` file to version control. Add it to your `.gitignore` file.

### 4. Database Setup
Follow the detailed instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) to:
- Create Supabase project
- Set up database schema
- Configure authentication
- Enable Row Level Security

### 5. Start Development Server
```bash
pnpm dev
# or
npm run dev
```

Visit `http://localhost:3000` to see the app in action!

## 🏗️ Project Structure

```
WellnessGrid App/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── chat/             # AI chat interface  
│   ├── profile/          # User profile management
│   └── track/            # Health tracking tools
├── components/            # Reusable React components
│   ├── ui/               # Shadcn/ui components
│   ├── *-tracker.tsx     # Health tracking components
│   └── navigation/       # Navigation components
├── lib/                  # Utility libraries
│   ├── database/         # Supabase integration
│   ├── store/           # State management
│   └── types/           # TypeScript definitions
├── hooks/               # Custom React hooks
├── styles/              # Global styles
└── public/              # Static assets
```

## 🔧 Configuration

### Supabase Setup
Detailed instructions available in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)

### AI Backend Setup  
See [`LLM_INTEGRATION.md`](./LLM_INTEGRATION.md) for Flask backend configuration

### Flask Backend Setup
Instructions in [`FLASK_BACKEND_SETUP.md`](./FLASK_BACKEND_SETUP.md)

## 🎯 Core Features

### Health Tracking Tools
- **Glucose Tracker** - Blood sugar monitoring for diabetes management
- **Mood Tracker** - Daily mood and mental health monitoring
- **Symptom Tracker** - Comprehensive symptom logging with severity tracking
- **Medication Logger** - Adherence tracking and reminder system
- **Vital Signs Tracker** - Blood pressure, heart rate, temperature monitoring
- **Sleep Tracker** - Sleep quality and duration monitoring
- **Nutrition Tracker** - Food intake and dietary monitoring
- **Hydration Tracker** - Daily water intake tracking

### AI-Powered Features
- **Intelligent Chat Assistant** - Contextual health advice using BioGPT
- **Document Search** - BioBERT-powered medical document retrieval
- **Pattern Recognition** - AI identifies trends in health data
- **Personalized Recommendations** - Context-aware health suggestions

### User Experience
- **Responsive Design** - Works seamlessly on mobile and desktop
- **Dark/Light Theme** - User preference support
- **Accessibility** - WCAG compliant interface
- **Progressive Web App** - Installable on mobile devices

## 🔐 Security & Privacy

- **End-to-End Security** - All data encrypted in transit and at rest
- **Row Level Security** - Database-level user isolation
- **HIPAA Considerations** - Privacy-first architecture
- **Local Data Control** - Users control their data sharing preferences
- **Audit Logging** - Track data access and modifications

## 📱 Usage

### Getting Started
1. **Create Account** - Sign up with email and password
2. **Complete Setup** - Add health conditions and preferences
3. **Select Tools** - Choose relevant tracking tools
4. **Start Tracking** - Begin logging health data daily
5. **Chat with AI** - Ask questions and get personalized advice

### Daily Workflow
1. **Morning Check-in** - Review overnight data and set daily goals
2. **Track Throughout Day** - Log symptoms, medications, meals
3. **Evening Review** - Analyze daily patterns and trends
4. **Weekly Reports** - Generate summaries for healthcare providers

## 🧪 Testing

### Run Tests
```bash
pnpm test
# or
npm test
```

### API Testing
Test Flask backend integration:
```bash
node examples/test-flask-api.js
```

Test Supabase connection:
```bash
node lib/test-supabase.ts
```

## 📊 Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript type checking
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for consistent formatting
- Husky for pre-commit hooks

## 🚀 Deployment

### Production Build
```bash
pnpm build
pnpm start
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key
FLASK_API_URL=your_production_flask_backend_url
```
**⚠️ Security Note:** Use secure environment variable management in production (e.g., Vercel Environment Variables, AWS Secrets Manager).

### Deployment Platforms
- **Vercel** - Recommended for Next.js apps
- **Netlify** - Alternative hosting platform
- **Self-hosted** - Docker containerization available

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed

## 📝 Documentation

- [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) - Database setup and configuration
- [`LLM_INTEGRATION.md`](./LLM_INTEGRATION.md) - AI backend integration guide
- [`FLASK_BACKEND_SETUP.md`](./FLASK_BACKEND_SETUP.md) - Flask server setup
- [`TOOLS_IMPLEMENTATION.md`](./TOOLS_IMPLEMENTATION.md) - Health tracking tools guide

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify environment variables are properly configured
- Check database connection and permissions
- Ensure user authentication is working

**AI Chat Not Working**
- Confirm backend services are accessible
- Check network connectivity and configurations
- Verify service dependencies are running

**Build Errors**
- Clear `node_modules` and reinstall dependencies
- Check TypeScript errors with `pnpm type-check`
- Verify all required environment variables are set

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Medical AI Models**: Microsoft BioGPT, BioBERT by DMIS Lab
- **UI Components**: Shadcn/ui, Radix UI
- **Backend Services**: Supabase team
- **Community**: All contributors and testers

## 📞 Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for community support
- **Documentation**: Check the docs folder for detailed guides

---

**Made with ❤️ for teen health empowerment**

*WellnessGrid - Taking control of your health journey, one day at a time.* 