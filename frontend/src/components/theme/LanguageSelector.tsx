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
  const currentOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

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
        className="rounded-md px-3 py-1.5 h-9 flex items-center gap-1.5 text-stone-800 dark:text-[#F4F4F0] hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary border border-stone-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] shadow-none"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
        <span className="font-bold tracking-tight">
          {currentOption.nativeLabel}
        </span>
        <span className="text-[10px] text-muted-foreground font-bold px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-[#292826] border border-stone-200 dark:border-[#3A3834]">
          {currentLang === 'hi' ? 'EN' : 'हिन्दी'}
        </span>
      </Button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 mt-1.5 w-36 rounded-md bg-card border border-border p-1 z-50 animate-in fade-in zoom-in-95 duration-100 shadow-none"
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
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left',
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <div className="flex flex-col">
                  <span>{lang.nativeLabel}</span>
                  {lang.code === 'hi' && <span className="text-[10px] text-muted-foreground">Hindi</span>}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
