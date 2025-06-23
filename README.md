# WellnessGrid App 🏥

A comprehensive health and wellness tracking application built with Next.js, TypeScript, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## 📁 Project Structure

```
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── ...               # Feature-specific components
├── lib/                   # Utilities and shared logic
│   ├── database/         # Database schemas and types
│   ├── store/           # State management
│   └── types/           # TypeScript type definitions
├── docs/                  # 📚 Documentation
│   ├── supabase-setup.md
│   ├── tools-implementation.md
│   ├── rag-upgrade-guide.md
│   └── archive/         # Deprecated docs
├── notebooks/             # 📓 Jupyter notebooks
│   └── query_rag_system.ipynb
├── scripts/               # 🐍 Python scripts
│   └── embed_documents.py
├── tests/                 # 🧪 Test files
├── public/               # Static assets
└── styles/               # Global styles
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI/ML**: RAG system with PubMedBERT embeddings
- **State Management**: Custom React Context
- **Styling**: Tailwind CSS + shadcn/ui

## 🔧 Key Features

- 📊 Health tracking tools (sleep, nutrition, mood, etc.)
- 🤖 AI-powered medical chat assistant
- 📱 Responsive mobile-first design
- 🔐 Secure authentication and data storage
- 📈 Health analytics and insights
- 📚 Medical knowledge base with RAG

## 📚 Documentation

Visit the [`docs/`](./docs/) directory for detailed setup guides:

- [Supabase Setup](./docs/supabase-setup.md)
- [Tools Implementation](./docs/tools-implementation.md)
- [RAG System Guide](./docs/rag-upgrade-guide.md)

## 🧪 Testing

```bash
# Run development server
npm run dev

# Set up medical database
python scripts/embed_documents.py

# Test API endpoints
npx ts-node tests/test-ask-api.ts

# Test Supabase connection
npx ts-node tests/test-supabase.ts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.



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