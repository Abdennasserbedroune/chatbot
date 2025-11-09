# Chat App

A modern chat application built with Next.js 15, TypeScript, and Tailwind CSS. This project provides a polished UI foundation for building AI-powered chat interfaces.

## 🚀 Features

- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS v4** for modern, responsive styling
- **TypeScript Path Aliases** for clean imports (`@/components`, `@/lib`, etc.)
- **Environment Configuration** ready for API keys
- **Dark Mode Support** with system preference detection
- **Optimized Fonts** using `next/font` with Geist Sans and Mono

## 📋 Prerequisites

- **Node.js** 18.17+ or 20+
- **pnpm** (recommended) or npm

## 🛠️ Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd chat-app
   pnpm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your API keys:
   ```env
   # Get your API key from: https://makersuite.google.com/app/apikey
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and Tailwind config
│   ├── layout.tsx         # Root layout with fonts
│   └── page.tsx           # Main chat interface
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── styles/                # Additional CSS files
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🎨 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🔧 Configuration

### TypeScript Path Aliases

The project includes preconfigured path aliases in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./*"],
    "@/components/*": ["./components/*"],
    "@/lib/*": ["./lib/*"],
    "@/styles/*": ["./styles/*"]
  }
}
```

### Tailwind CSS v4

This project uses Tailwind CSS v4 with inline configuration in `app/globals.css`. The theme includes:

- Custom color tokens for consistent design system
- Dark mode support with system preference detection
- Optimized font loading with Geist Sans and Mono

## 🌟 Environment Variables

The application supports the following environment variables:

- `GOOGLE_GEMINI_API_KEY` - Your Google Gemini API key for AI chat functionality

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/new)
3. Add environment variables in your Vercel dashboard
4. Deploy automatically

### Other Platforms

```bash
pnpm build
pnpm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
