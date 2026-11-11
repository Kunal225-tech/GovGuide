import { ShieldCheck, Globe, Zap, HeartHandshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TrustSection() {
  const { t } = useTranslation();

  const trustItems = [
    {
      icon: ShieldCheck,
      title: t('home.hero.features.officialTitle', '100% Official'),
      subtitle: t('home.hero.features.officialDesc', 'Direct Government Portals'),
    },
    {
      icon: Globe,
      title: t('home.hero.features.coverageTitle', 'Bihar & Central Coverage'),
      subtitle: t('home.hero.features.coverageDesc', 'All 38 Districts of Bihar'),
    },
    {
      icon: Zap,
      title: t('home.hero.features.speedTitle', 'Fast Eligibility'),
      subtitle: t('home.hero.features.speedDesc', 'Check in 2 Minutes'),
    },
    {
      icon: HeartHandshake,
      title: t('home.hero.features.freeTitle', '100% Free Service'),
      subtitle: t('home.hero.features.freeDesc', 'Zero Fees or Middlemen'),
    },
  ];

  return (
    <section className="w-full border-t border-stone-200 dark:border-[#2E2D2A] bg-white dark:bg-[#111110]">
      <div className="gov-container px-0 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 dark:divide-[#2E2D2A]">
          {trustItems.map((item, index) => (
            <div key={index} className="py-5 px-4 sm:px-6 flex items-center gap-3.5">
              <div className="flex-shrink-0 w-10 h-10 rounded-md bg-stone-100 dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] flex items-center justify-center text-stone-700 dark:text-[#F4F4F0]">
                <item.icon className="w-5 h-5 text-stone-700 dark:text-[#F4F4F0]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-stone-900 dark:text-[#F4F4F0] text-sm leading-tight truncate">
                  {item.title}
                </h3>
                <p className="text-stone-500 dark:text-[#A8A29E] text-xs mt-0.5 font-normal truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
