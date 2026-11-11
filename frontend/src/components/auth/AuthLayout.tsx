import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const CHECKLIST_STEPS = [
  {
    step: '1',
    title: 'Complete basic profile',
    description: 'Enter your age, location, and social category once.',
  },
  {
    step: '2',
    title: 'Instant eligibility match',
    description: 'Deterministic rule engine checks requirements in seconds.',
  },
  {
    step: '3',
    title: 'Direct official portal links',
    description: 'Apply with zero fees directly on verified government domains.',
  },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#111110]">

      {/* Left Column: Solid True Carbon (#141413) Institutional Information Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-[#141413] text-[#F4F4F0] flex-col justify-between p-10 xl:p-14 border-r border-[#2E2D2A] shrink-0">
        
        {/* Top: Brand Header & Tricolor Stripe */}
        <div>
          <div className="flex items-center gap-1 w-14 h-1 rounded-sm overflow-hidden mb-6">
            <div className="h-full flex-1 bg-[#EA580C]" />
            <div className="h-full flex-1 bg-white dark:bg-stone-200" />
            <div className="h-full flex-1 bg-[#16A34A]" />
          </div>

          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#D95D39] rounded-sm w-max"
            aria-label="GovGuide Home"
          >
            <div className="flex flex-col items-center select-none" aria-hidden="true">
              <div className="w-2 h-1 bg-[#EA580C] rounded-t-xs" />
              <div className="w-2 h-1 bg-white dark:bg-stone-200" />
              <div className="w-2 h-1 bg-[#16A34A]" />
              <div className="w-6 h-3 bg-white dark:bg-[#F4F4F0] rounded-t-full mt-1 relative overflow-hidden">
                <div className="absolute bottom-0 w-full h-[1px] bg-[#141413]" />
              </div>
              <div className="flex gap-0.5 mt-[1px]">
                <div className="w-1.5 h-3 bg-white dark:bg-[#F4F4F0]" />
                <div className="w-1.5 h-3 bg-white dark:bg-[#F4F4F0]" />
                <div className="w-1.5 h-3 bg-white dark:bg-[#F4F4F0]" />
              </div>
              <div className="w-8 h-1 bg-white dark:bg-[#F4F4F0] mt-[1px]" />
              <div className="w-10 h-1 bg-white dark:bg-[#F4F4F0] mt-[1px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-white leading-none">
                GovGuide <span className="text-[#EA580C]">Bihar</span>
              </span>
              <span className="text-[0.65rem] text-[#D95D39] font-medium tracking-wide uppercase leading-none mt-1">
                बिहार जन-कल्याण पोर्टल
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Practical Citizen Value & 3-Step Verification Checklist */}
        <div className="my-auto py-6 space-y-6">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold leading-snug text-[#F4F4F0]">
              Single Citizen Profile for Bihar State & Central Schemes
            </h1>
            <p className="text-sm text-stone-300 mt-2.5 leading-relaxed">
              GovGuide verifies deterministic rules to match you with valid government benefits, subsidies, and educational grants.
            </p>
          </div>

          {/* 3-Step Checklist */}
          <div className="space-y-3.5">
            {CHECKLIST_STEPS.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-md bg-[#292826] border border-[#3A3834] flex items-center justify-center text-xs font-bold text-[#F4F4F0] shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#F4F4F0] leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-xs text-[#A8A29E] mt-0.5 leading-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Official Data Privacy Assurance Badge */}
          <div className="p-3 rounded-md bg-[#1C1B19] border border-[#2E2D2A] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-[#F4F4F0] block">100% Free Public Utility • No Middlemen</span>
              <span className="text-[#A8A29E] text-[11px]">Strictly adheres to citizen data protection standards.</span>
            </div>
          </div>
        </div>

        {/* Bottom: Official Footer Line */}
        <div className="pt-4 border-t border-[#2E2D2A] flex items-center justify-between text-xs text-[#A8A29E]">
          <span>&copy; {new Date().getFullYear()} GovGuide Bihar</span>
          <div className="flex items-center gap-1.5 font-medium text-stone-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Built for Bihar Citizens</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
        
        {/* Top Return Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 dark:border-[#2E2D2A] bg-white dark:bg-[#111110]">
          <Link
            to="/"
            className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-[#F4F4F0] hover:text-[#D95D39] dark:hover:text-[#D95D39] flex items-center gap-2 transition-colors px-3 py-1.5 rounded-md border border-stone-300 dark:border-[#2E2D2A] hover:bg-stone-50 dark:hover:bg-[#292826]"
            aria-label="Return to GovGuide Homepage"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600 dark:text-[#A8A29E]" />
            <span>Back to Home</span>
          </Link>
          <div className="bg-white dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] rounded-md p-0.5">
            <ThemeToggle />
          </div>
        </div>

        {/* Center Container: Card with 3px Saffron-Green Top Border */}
        <div className="w-full max-w-[440px] mx-auto px-4 py-3 sm:px-6 my-auto">
          
          {/* Card with 3px Accent Identity Strip */}
          <div className="bg-white dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] rounded-md overflow-hidden">
            
            {/* 3px Accent Top Identity Bar */}
            <div className="w-full h-[3px] flex" aria-hidden="true">
              <div className="h-full flex-1 bg-[#EA580C]" />
              <div className="h-full flex-1 bg-white dark:bg-stone-300" />
              <div className="h-full flex-1 bg-[#16A34A]" />
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-3.5">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-[#F4F4F0] tracking-tight">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-[#A8A29E] mt-1 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {children}
            </div>
          </div>

          {/* Simple Bottom Disclaimer */}
          <div className="mt-3 text-center text-[11px] text-stone-500 dark:text-[#A8A29E] flex flex-wrap items-center justify-center gap-1.5 leading-normal">
            <span>&copy; {new Date().getFullYear()} GovGuide Bihar</span>
            <span>•</span>
            <span>Independent Welfare Discovery Portal — Links directly to official .gov.in portals</span>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
