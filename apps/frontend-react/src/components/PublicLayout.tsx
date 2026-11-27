import { Menu, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Product', to: '/product' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Security', to: '/security' },
  { label: 'Docs', to: '/docs' },
  { label: 'Pricing', to: '/pricing' },
];

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname, hash]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' || pathname === '/home' : pathname === to;

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white font-sans flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
              <span className="w-1.5 h-5 bg-neutral-950 rounded-full inline-block" />
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-950">Schedulux AI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={scrollToTop}
                className={`transition-colors ${
                  isActive(item.to)
                    ? 'text-neutral-950 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Nav Actions */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            {isAuthenticated ? (
              <Link
                to="/tenant/dashboard"
                className="rounded-full bg-neutral-950 text-white text-sm font-medium px-5 py-2 hover:bg-neutral-800 transition shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {user?.business_name || 'Dashboard'}
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-950 transition-colors px-2 py-1"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-neutral-950 text-white text-sm font-medium px-5 py-2 hover:bg-neutral-800 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-100 bg-white px-6 py-5 flex flex-col gap-4">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-medium py-1 ${
                  isActive(item.to)
                    ? 'text-neutral-950 font-semibold'
                    : 'text-neutral-700 hover:text-neutral-950'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <Link
                  to="/tenant/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-full bg-neutral-950 text-white text-sm font-medium py-2.5"
                >
                  {user?.business_name || 'Dashboard'}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-full border border-neutral-200 text-neutral-800 text-sm font-medium py-2.5"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-full bg-neutral-950 text-white text-sm font-medium py-2.5"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <div className="flex-1">{children}</div>

      {/* Industry-Standard SaaS Footer */}
      <footer className="border-t border-neutral-200 py-14 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-4 bg-neutral-950 rounded-full inline-block" />
                <span className="w-1.5 h-4 bg-neutral-950 rounded-full inline-block" />
              </div>
              <span className="font-bold text-sm tracking-tight text-neutral-950">Schedulux AI</span>
            </Link>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
              Multi-tenant AI booking agent builder. Crawl your website, refine rules on a live
              canvas, and embed with one script tag.
            </p>
            <p className="text-[11px] text-neutral-400">
              &copy; {new Date().getFullYear()} Schedulux Inc. All rights reserved.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950">Product</h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li>
                <Link to="/product" className="hover:text-neutral-950 transition-colors">
                  Agent Builder Studio
                </Link>
              </li>
              <li>
                <Link to="/product#scheduling" className="hover:text-neutral-950 transition-colors">
                  Scheduling Engine
                </Link>
              </li>
              <li>
                <Link to="/product#rag" className="hover:text-neutral-950 transition-colors">
                  Hybrid RAG Knowledge
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-neutral-950 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li>
                <Link to="/solutions" className="hover:text-neutral-950 transition-colors">
                  Medical &amp; Dental
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-neutral-950 transition-colors">
                  Salons &amp; Wellness
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-neutral-950 transition-colors">
                  Auto &amp; Repair Bays
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-neutral-950 transition-colors">
                  Hospitality &amp; Consulting
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950">
              Trust &amp; Docs
            </h4>
            <ul className="space-y-2 text-xs text-neutral-500 font-medium">
              <li>
                <Link to="/security" className="hover:text-neutral-950 transition-colors">
                  Security &amp; Isolation
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-neutral-950 transition-colors">
                  Widget Embed Docs
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-neutral-950 transition-colors">
                  Workspace Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-neutral-950 transition-colors">
                  Create Free Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
