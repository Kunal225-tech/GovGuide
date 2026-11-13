import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Bookmark,
  ChevronDown,
  User,
  ClipboardCheck,
  LogOut,
} from 'lucide-react';
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
import { cn, getInitials, formatDisplayName } from '@/utils';
import { useAuth } from '@/context/AuthContext';
import { useSavedSchemes } from '@/context/SavedSchemesContext';

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user, logout } = useAuth();
  const { savedSchemeIds, savedCount } = useSavedSchemes();
  const count = savedCount ?? savedSchemeIds.size;
  const isLoggedIn = isAuthenticated;
  const rawUserName: string = user?.name ?? '';
  const displayUserName = formatDisplayName(rawUserName);
  const userInitials = getInitials(rawUserName);

  const navLinks = [
    { name: t('nav.schemes', 'Schemes'), to: '/schemes' },
    { name: t('nav.categories', 'Categories'), to: '/categories' },
    { name: t('nav.eligibilityChecker', 'Check Eligibility'), to: '/eligible' },
    { name: t('nav.trackApplication', 'Track Applications'), to: '/applications' },
  ];

  // Close profile dropdown on route change
  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  function handleLogout() {
    setIsProfileMenuOpen(false);
    logout();
  }

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-white dark:bg-[#111110] border-b border-slate-200 dark:border-[#2E2D2A]">
      {/* Accent 3px National Identity Bar (Deep Saffron, White, India Green) */}
      <div className="w-full h-[3px] flex" aria-hidden="true">
        <div className="h-full flex-1 bg-[#EA580C]" />
        <div className="h-full flex-1 bg-white dark:bg-[#292826] border-y border-slate-200/40 dark:border-transparent" />
        <div className="h-full flex-1 bg-[#16A34A]" />
      </div>

      <div className="gov-container">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Left: Indian Emblem Stylization + GovGuide Logo */}
          <div className="flex items-center shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 tracking-tight hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-[#D95D39]/40 rounded-md py-1"
              aria-label="GovGuide Home"
            >
              <div
                className="flex flex-col items-center select-none h-9 w-auto justify-center shrink-0"
                aria-hidden="true"
              >
                <div className="w-2 h-0.5 bg-[#EA580C] rounded-t-xs" />
                <div className="w-2 h-0.5 bg-slate-300 dark:bg-stone-300" />
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
                <span className="text-xl font-bold text-slate-900 dark:text-[#F4F4F0] leading-tight whitespace-nowrap">
                  GovGuide <span className="text-[#EA580C]">Bihar</span>
                </span>
                <span className="text-[0.65rem] text-[#1E3A8A] dark:text-[#D95D39] font-medium tracking-wide uppercase leading-tight whitespace-nowrap">
                  बिहार जन-कल्याण पोर्टल
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex flex-shrink-0 justify-center" aria-label="Main Navigation">
            <div className="flex items-center space-x-0.5 xl:space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'px-2.5 xl:px-3 py-1.5 text-[13px] xl:text-sm font-medium transition-colors rounded-lg whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-[#D95D39]/40',
                      isActive
                        ? 'bg-slate-100 text-slate-900 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border dark:border-[#D95D39] font-semibold'
                        : 'text-slate-600 dark:text-[#A8A29E] hover:text-slate-900 dark:hover:text-[#F4F4F0] hover:bg-slate-100/70 dark:hover:bg-[#1C1B19]'
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Right: Saved, User Dropdown Pill, Language Toggle & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {isLoggedIn ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-lg px-2.5 font-medium text-slate-700 dark:text-[#F4F4F0] hover:bg-slate-100 dark:hover:bg-[#292826] hover:text-slate-900 shadow-none flex items-center gap-1.5 h-9 whitespace-nowrap"
                >
                  <Link to="/saved">
                    <Bookmark className="w-4 h-4 text-[#EA580C]" />
                    <span>{t('nav.saved', 'Saved')}</span>
                    {count > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-[#EA580C] text-white rounded-full leading-none tabular-nums">
                        {count}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* User Profile Dropdown Pill */}
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    aria-label={t('nav.myProfile', 'My Profile')}
                    className="h-9 pl-1.5 pr-2.5 rounded-full border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] hover:bg-slate-50 dark:hover:bg-[#292826] transition-colors flex items-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-[#D95D39]/40"
                  >
                    <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#292826] text-slate-800 dark:text-[#F4F4F0] font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-[#3A3834]">
                      {userInitials || <User className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-[#F4F4F0] max-w-[100px] xl:max-w-[140px] truncate">
                      {displayUserName || t('nav.myProfile', 'My Profile')}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-slate-500 dark:text-[#A8A29E] transition-transform duration-150 shrink-0',
                        isProfileMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Account menu"
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] shadow-md dark:shadow-none p-1.5 z-50"
                    >
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-[#F4F4F0] hover:bg-slate-100 dark:hover:bg-[#292826] rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-500 dark:text-[#A8A29E]" />
                        <span>{t('profile.title', 'Citizen Profile')}</span>
                      </Link>

                      <Link
                        to="/saved"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center justify-between gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-[#F4F4F0] hover:bg-slate-100 dark:hover:bg-[#292826] rounded-lg transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Bookmark className="w-4 h-4 text-[#EA580C]" />
                          <span>{t('nav.savedSchemes', 'Saved Schemes')}</span>
                        </span>
                        {count > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-[#292826] dark:text-[#F4F4F0] rounded-full tabular-nums">
                            {count}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/applications"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-[#F4F4F0] hover:bg-slate-100 dark:hover:bg-[#292826] rounded-lg transition-colors"
                      >
                        <ClipboardCheck className="w-4 h-4 text-slate-500 dark:text-[#A8A29E]" />
                        <span>{t('nav.trackApplication', 'Track Applications')}</span>
                      </Link>

                      <div
                        className="my-1.5 border-t border-slate-200 dark:border-[#2E2D2A]"
                        role="separator"
                      />

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.logout', 'Logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-lg px-3.5 font-semibold text-slate-800 dark:text-[#F4F4F0] border-slate-300 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] hover:bg-slate-50 dark:hover:bg-[#292826] shadow-none h-9 text-xs sm:text-sm"
                >
                  <Link to="/login">{t('nav.login', 'Sign In')}</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-lg px-4 font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none transition-colors h-9 text-xs sm:text-sm"
                >
                  <Link to="/register">{t('nav.signUp', 'Register')}</Link>
                </Button>
              </>
            )}

            {/* Language Selector & Theme Toggle */}
            <div className="flex items-center gap-1.5 pl-0.5">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile / Tablet Menu */}
          <div className="flex lg:hidden flex-1 justify-end items-center gap-1.5">
            <LanguageSelector />
            <ThemeToggle />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-800 dark:text-[#F4F4F0] hover:bg-slate-100 dark:hover:bg-[#292826] rounded-lg"
                  aria-label={t('nav.toggleMenu', 'Open Menu')}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('nav.toggleMenu', 'Open Menu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="top"
                className="bg-white dark:bg-[#111110] pt-14 border-b border-slate-200 dark:border-[#2E2D2A]"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] rounded-xl p-2 space-y-1">
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-white text-slate-900 border border-slate-200 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border-[#D95D39] font-semibold'
                              : 'text-slate-700 dark:text-[#F4F4F0] hover:bg-white/70 dark:hover:bg-[#292826]'
                          )
                        }
                      >
                        {link.name}
                      </NavLink>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-[#2E2D2A] flex flex-col gap-2">
                    {isLoggedIn ? (
                      <>
                        <div className="flex items-center gap-2.5 px-2 py-1.5">
                          <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#292826] text-slate-800 dark:text-[#F4F4F0] font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#3A3834]">
                            {userInitials || <User className="w-3.5 h-3.5" />}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-[#F4F4F0] truncate">
                            {displayUserName || t('nav.myProfile', 'My Profile')}
                          </span>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-slate-800 dark:text-[#F4F4F0] flex items-center gap-2.5"
                        >
                          <User className="w-4 h-4 text-slate-500 dark:text-[#A8A29E]" />
                          <span>{t('profile.title', 'Citizen Profile')}</span>
                        </Link>
                        <Link
                          to="/saved"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-slate-800 dark:text-[#F4F4F0] flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2.5">
                            <Bookmark className="w-4 h-4 text-[#EA580C]" />
                            <span>{t('nav.savedSchemes', 'Saved Schemes')}</span>
                          </span>
                          {count > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#EA580C] text-white rounded-full leading-none tabular-nums">
                              {count}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/applications"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-slate-800 dark:text-[#F4F4F0] flex items-center gap-2.5"
                        >
                          <ClipboardCheck className="w-4 h-4 text-slate-500 dark:text-[#A8A29E]" />
                          <span>{t('nav.trackApplication', 'Track Applications')}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('nav.logout', 'Logout')}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-center py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-slate-800 dark:text-[#F4F4F0]"
                        >
                          {t('nav.login', 'Sign In')}
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1E3A8A] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B]"
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
