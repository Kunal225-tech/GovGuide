import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

interface LanguageOption {
  code: 'en' | 'hi';
  label: string;
  nativeLabel: string;
}

// STRICT REQUIREMENT: Only English and Hindi are supported.
const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export function LanguageSelector({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default to 'en' if language is not 'hi'
  const currentLang = i18n.language === 'hi' ? 'hi' : 'en';

  function handleSelect(code: 'en' | 'hi') {
    i18n.changeLanguage(code);
    setIsOpen(false);
  }

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-lg px-2.5 h-9 flex items-center gap-1.5 text-slate-700 dark:text-[#F4F4F0] hover:bg-slate-50 dark:hover:bg-[#292826] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 dark:focus:ring-[#D95D39]/40 border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] shadow-xs whitespace-nowrap"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
        <span className="flex items-center gap-1">
          <span
            className={cn(
              currentLang === 'en'
                ? 'font-semibold text-slate-900 dark:text-[#F4F4F0]'
                : 'font-medium text-slate-400 dark:text-[#A8A29E]'
            )}
          >
            <span className="sm:hidden lg:inline xl:hidden">EN</span>
            <span className="hidden sm:inline lg:hidden xl:inline">English</span>
          </span>
          <span className="text-slate-300 dark:text-[#3A3834]" aria-hidden="true">
            |
          </span>
          <span
            className={cn(
              currentLang === 'hi'
                ? 'font-semibold text-slate-900 dark:text-[#F4F4F0]'
                : 'font-medium text-slate-400 dark:text-[#A8A29E]'
            )}
          >
            <span className="sm:hidden">हिं</span>
            <span className="hidden sm:inline">हिन्दी</span>
          </span>
        </span>
      </Button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] p-1 z-50 shadow-md dark:shadow-none"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left',
                  isSelected
                    ? 'bg-slate-100 text-[#1E3A8A] dark:bg-[#292826] dark:text-[#D95D39] font-semibold'
                    : 'text-slate-700 dark:text-[#F4F4F0] hover:bg-slate-50 dark:hover:bg-[#292826]'
                )}
              >
                <div className="flex flex-col">
                  <span>{lang.nativeLabel}</span>
                  {lang.code === 'hi' && (
                    <span className="text-[10px] text-slate-500 dark:text-[#A8A29E]">Hindi</span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-[#D95D39] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
