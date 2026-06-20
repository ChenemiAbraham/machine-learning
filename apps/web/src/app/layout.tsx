import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Juicyway Growth Platform',
  description: 'Growth engineering and ML platform demonstrating attribution, experimentation, and reconciliation',
};

const navigation = [
  { name: 'Overview', href: '/' },
  { name: 'Attribution', href: '/attribution' },
  { name: 'Experiments', href: '/experiments' },
  { name: 'Funnels', href: '/funnels' },
  { name: 'Reconciliation', href: '/reconciliation' },
  { name: 'Demo', href: '/demo' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">J</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">Juicyway</span>
                    <span className="text-sm text-gray-500 ml-2">Growth Platform</span>
                  </Link>
                </div>

                <nav className="flex space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <p>Built with 💚 for Juicyway</p>
                  <p className="text-xs mt-1">
                    Demonstrating growth engineering solutions: Attribution, Experimentation & ML
                  </p>
                </div>
                <div className="flex space-x-6">
                  <a
                    href="https://github.com/yourhandle/juicyway-growth-platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600"
                  >
                    GitHub
                  </a>
                  <a
                    href="/docs/ARCHITECTURE.md"
                    target="_blank"
                    className="hover:text-primary-600"
                  >
                    Architecture
                  </a>
                  <a
                    href="/docs/CASE_STUDY.pdf"
                    target="_blank"
                    className="hover:text-primary-600"
                  >
                    Case Study
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
