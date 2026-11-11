import { HeroSection } from '@/components/home/HeroSection';
import { BiharLifelineStrip } from '@/components/home/BiharLifelineStrip';
import { SaatNischayBanner } from '@/components/home/SaatNischayBanner';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CategorySection } from '@/components/home/CategorySection';
import { GovernmentLevelSection } from '@/components/home/GovernmentLevelSection';
import { FeaturedSchemes } from '@/components/home/FeaturedSchemes';
import { OfficialSourceSection } from '@/components/home/OfficialSourceSection';
import { FinalCTA } from '@/components/home/FinalCTA';

export function HomePage() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <BiharLifelineStrip />
      <SaatNischayBanner />
      <FeaturedSchemes />
      <CategorySection />
      <GovernmentLevelSection />
      <HowItWorks />
      <OfficialSourceSection />
      <FinalCTA />
    </div>
  );
}
