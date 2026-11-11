import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSelector } from '@/components/theme/LanguageSelector';
import { cn } from '@/utils';
import { useAuth } from '@/context/AuthContext';
import { useSavedSchemes } from '@/context/SavedSchemesContext';

export function Navbar() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const { savedSchemeIds, savedCount } = useSavedSchemes();
  const count = savedCount ?? savedSchemeIds.size;
  const isLoggedIn = isAuthenticated;
  const userName: string = user?.name ?? '';

  const navLinks = [
    { name: t('nav.schemes', 'Schemes'), to: '/schemes' },
    { name: t('nav.categories', 'Categories'), to: '/categories' },
    { name: t('nav.eligibilityChecker', 'Eligibility Checker'), to: '/eligible' },
    { name: t('nav.trackApplication', 'Track Application'), to: '/applications' },
  ];

  function handleLogout() {
    logout();
  }

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-white dark:bg-[#111110] border-b border-stone-200 dark:border-[#2E2D2A]">
      {/* Accent 3px National Identity Bar (Deep Saffron, White, India Green) */}
      <div className="w-full h-[3px] flex" aria-hidden="true">
        <div className="h-full flex-1 bg-[#EA580C]" />
        <div className="h-full flex-1 bg-white dark:bg-[#292826] border-y border-stone-200/40 dark:border-transparent" />
        <div className="h-full flex-1 bg-[#16A34A]" />
      </div>

      <div className="gov-container px-6">
        <div className="flex items-center justify-between h-16">

          {/* Left: Indian Emblem Stylization + GovGuide Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              to="/"
              className="flex items-center gap-3 tracking-tight hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#D95D39] rounded-sm py-1"
              aria-label="GovGuide Home"
            >
              <div className="flex flex-col items-center select-none h-9 w-auto justify-center shrink-0" aria-hidden="true">
                <div className="w-2 h-0.5 bg-[#EA580C] rounded-t-xs" />
                <div className="w-2 h-0.5 bg-stone-300 dark:bg-stone-300" />
                <div className="w-2 h-0.5 bg-[#16A34A]" />
                <div className="w-5 h-2 bg-[#0F172A] dark:bg-[#F4F4F0] rounded-t-full mt-0.5 relative overflow-hidden">
                  <div className="absolute bottom-0 w-full h-[1px] bg-white dark:bg-[#111110]" />
                </div>
                <div className="flex gap-0.5 mt-[1px]">
                  <div className="w-1.5 h-2.5 bg-[#0F172A] dark:bg-[#F4F4F0]" />
                  <div className="w-1.5 h-2.5 bg-[#0F172A] dark:bg-[#F4F4F0]" />
                  <div className="w-1.5 h-2.5 bg-[#0F172A] dark:bg-[#F4F4F0]" />
                </div>
                <div className="w-7 h-0.5 bg-[#0F172A] dark:bg-[#F4F4F0] mt-[1px]" />
                <div className="w-8 h-0.5 bg-[#0F172A] dark:bg-[#F4F4F0] mt-[1px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-stone-900 dark:text-[#F4F4F0] leading-tight">GovGuide <span className="text-[#EA580C]">Bihar</span></span>
                <span className="text-[0.65rem] text-[#1E3A8A] dark:text-[#D95D39] font-medium tracking-wide uppercase leading-tight">
                  बिहार जन-कल्याण पोर्टल
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex flex-shrink-0 justify-center" aria-label="Main Navigation">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-[#D95D39]",
                    isActive
                      ? "bg-stone-100 text-stone-900 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border dark:border-[#D95D39] font-semibold"
                      : "text-stone-600 dark:text-[#A8A29E] hover:text-stone-900 dark:hover:text-[#F4F4F0] hover:bg-stone-100/70 dark:hover:bg-[#1C1B19]"
                  )}
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Right: Language Selector, Theme Toggle & Auth Buttons */}
          <div className="hidden md:flex flex-1 justify-end items-center space-x-2">
            {isLoggedIn ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-md px-3 font-semibold text-stone-700 dark:text-[#F4F4F0] hover:bg-stone-100 dark:hover:bg-[#292826] shadow-none flex items-center gap-1.5 h-9"
                >
                  <Link to="/saved">
                    <Bookmark className="w-4 h-4 text-[#EA580C]" />
                    <span>{t('nav.saved', 'Saved')}</span>
                    {count > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-[#EA580C] text-white rounded-md leading-none">
                        {count}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-md px-3.5 font-semibold text-stone-800 dark:text-[#F4F4F0] border-stone-300 dark:border-[#2E2D2A] bg-transparent dark:bg-[#1C1B19] hover:bg-stone-100 dark:hover:bg-[#292826] shadow-none max-w-[160px] h-9"
                >
                  <Link to="/profile" className="truncate">
                    {userName || t('nav.myProfile', 'My Profile')}
                  </Link>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="rounded-md px-3 font-medium text-stone-600 dark:text-[#A8A29E] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors h-9"
                >
                  {t('nav.logout', 'Sign Out')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-md px-3.5 font-semibold text-stone-800 dark:text-[#F4F4F0] border-stone-300 dark:border-[#2E2D2A] bg-transparent dark:bg-[#1C1B19] hover:bg-stone-100 dark:hover:bg-[#292826] shadow-none h-9 text-xs sm:text-sm"
                >
                  <Link to="/login">{t('nav.login', 'Sign In')}</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-md px-4 font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none transition-colors h-9 text-xs sm:text-sm"
                >
                  <Link to="/register">{t('nav.signUp', 'Register')}</Link>
                </Button>
              </>
            )}

            {/* Language Selector & Theme Toggle */}
            <div className="flex items-center space-x-1 pl-1">
              <div className="bg-white dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] rounded-md p-0.5">
                <LanguageSelector />
              </div>
              <div className="bg-white dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] rounded-md p-0.5">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden flex-1 justify-end items-center space-x-1.5">
            <LanguageSelector />
            <ThemeToggle />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-stone-800 dark:text-[#F4F4F0] hover:bg-stone-100 dark:hover:bg-[#292826] rounded-md" aria-label={t('nav.toggleMenu', 'Open Menu')}>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{t('nav.toggleMenu', 'Open Menu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="bg-white dark:bg-[#111110] pt-14 border-b border-stone-200 dark:border-[#2E2D2A]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="bg-stone-50 dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] rounded-md p-2 space-y-1">
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) => cn(
                          "block px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-stone-100 text-stone-900 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border dark:border-[#D95D39] font-semibold"
                            : "text-stone-700 dark:text-[#F4F4F0] hover:bg-stone-100 dark:hover:bg-[#292826]"
                        )}
                      >
                        {link.name}
                      </NavLink>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-200 dark:border-[#2E2D2A] flex flex-col gap-2">
                    {isLoggedIn ? (
                      <>
                        <Link
                          to="/saved"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-center py-2.5 rounded-md text-sm font-semibold border border-stone-300 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-stone-800 dark:text-[#F4F4F0] flex items-center justify-center gap-2"
                        >
                          <Bookmark className="w-4 h-4 text-[#EA580C]" />
                          <span>{t('nav.saved', 'Saved')}</span>
                          {count > 0 && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-[#EA580C] text-white rounded-md leading-none">
                              {count}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-center py-2.5 rounded-md text-sm font-semibold border border-stone-300 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-stone-800 dark:text-[#F4F4F0]"
                        >
                          {userName || t('nav.myProfile', 'My Profile')}
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-center py-2.5 rounded-md text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          {t('nav.logout', 'Sign Out')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-center py-2.5 rounded-md text-sm font-semibold border border-stone-300 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-stone-800 dark:text-[#F4F4F0]"
                        >
                          {t('nav.login', 'Sign In')}
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-center py-2.5 rounded-md text-sm font-semibold text-white bg-[#1E3A8A] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B]"
                        >
                          {t('nav.signUp', 'Register')}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
}
