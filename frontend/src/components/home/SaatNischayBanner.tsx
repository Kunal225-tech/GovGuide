import { Sparkles, ArrowRight, BookOpen, Users, Droplets, Zap, Road, ShieldCheck, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface NischayPillar {
  number: number;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  flagship: string;
  flagshipHi: string;
  icon: typeof Sparkles;
  query: string;
}

const SAAT_NISCHAY_PILLARS: NischayPillar[] = [
  {
    number: 1,
    title: 'Economic Solution, Youth Empowerment',
    titleHi: 'आर्थिक हल, युवाओं को बल',
    subtitle: 'Higher education loans up to ₹4 Lakh at 1-4% interest & skill training.',
    subtitleHi: 'बिहार स्टूडेंट क्रेडिट कार्ड (₹4 लाख लोन), स्वयं सहायता भत्ता व कुशल युवा कार्यक्रम।',
    flagship: 'Student Credit Card, SHA, KYP',
    flagshipHi: 'स्टूडेंट क्रेडिट कार्ड, स्वयं सहायता भत्ता, KYP',
    icon: BookOpen,
    query: 'Student Credit Card',
  },
  {
    number: 2,
    title: "Reserved Employment, Women's Right",
    titleHi: 'आरक्षित रोजगार, महिलाओं का अधिकार',
    subtitle: '35% reservation in government jobs & ₹10 Lakh assistance under Mahila Udyami.',
    subtitleHi: 'सभी सरकारी नौकरियों में 35% आरक्षण एवं मुख्यमंत्री महिला उद्यमी योजना।',
    flagship: 'Mahila Udyami Yojana',
    flagshipHi: 'मुख्यमंत्री महिला उद्यमी योजना',
    icon: Users,
    query: 'Mahila Udyami',
  },
  {
    number: 3,
    title: 'Tap Water to Every Home',
    titleHi: 'हर घर नल का जल',
    subtitle: 'Safe, treated piped drinking water delivered to every rural and urban home.',
    subtitleHi: 'बिहार के प्रत्येक ग्रामीण एवं शहरी परिवार तक पाइप द्वारा शुद्ध पेयजल आपूर्ति।',
    flagship: 'Har Ghar Nal Ka Jal',
    flagshipHi: 'हर घर नल का जल योजना',
    icon: Droplets,
    query: 'Nal Ka Jal',
  },
  {
    number: 4,
    title: 'Uninterrupted Electricity',
    titleHi: 'हर घर बिजली लगातार',
    subtitle: 'Dedicated rural electrification and uninterrupted household power supply.',
    subtitleHi: 'राज्य के सभी गांवों व बसावटों में 24x7 निर्बाध गुणवत्तापूर्ण बिजली आपूर्ति।',
    flagship: 'Rural Electrification',
    flagshipHi: 'ग्रामीण विद्युतीकरण',
    icon: Zap,
    query: 'Bijli',
  },
  {
    number: 5,
    title: 'Paved Streets and Drainage',
    titleHi: 'घर तक पक्की गली-नालियां',
    subtitle: 'Concrete internal road connectivity and clean drainage in all rural habitations.',
    subtitleHi: 'सभी गांवों व मोहल्लों में पक्की सड़कों तथा ढकी हुई पक्की नालियों का निर्माण।',
    flagship: 'Gali Nali Yojana',
    flagshipHi: 'पक्की गली-नाली योजना',
    icon: Road,
    query: 'Gali Nali',
  },
  {
    number: 6,
    title: 'Toilet Construction, Home Dignity',
    titleHi: 'शौचालय निर्माण, घर का सम्मान',
    subtitle: 'Financial incentive for individual household latrines under Lohia Swachh Bihar.',
    subtitleHi: 'लोहिया स्वच्छ बिहार अभियान के तहत खुले में शौचमुक्त गांव व शौचालय निर्माण अनुदान।',
    flagship: 'Lohia Swachh Bihar',
    flagshipHi: 'लोहिया स्वच्छ बिहार अभियान',
    icon: ShieldCheck,
    query: 'Swachh Bihar',
  },
  {
    number: 7,
    title: 'Higher Opportunities, Continued Learning',
    titleHi: 'अवसर बढ़े, आगे पढ़ें',
    subtitle: 'Engineering college, polytechnic, and nursing training institute in every district.',
    subtitleHi: 'प्रत्येक जिले में इंजीनियरिंग कॉलेज, पॉलिटेक्निक, महिला आईटीआई व एएनएम संस्थान।',
    flagship: 'District Technical Colleges',
    flagshipHi: 'जिला तकनीकी एवं नर्सिंग कॉलेज',
    icon: Award,
    query: 'Education',
  },
];

export function SaatNischayBanner() {
  const { i18n } = useTranslation();
  const isHi = i18n.language === 'hi';

  return (
    <section className="py-14 bg-stone-50/60 dark:bg-[#111110] border-b border-stone-200 dark:border-[#2E2D2A]">
      <div className="gov-container px-4 sm:px-6">
        {/* Banner Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 dark:bg-[#292826] text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{isHi ? 'बिहार सरकार का संकल्प | 7 निश्चय' : 'Government of Bihar Vision | 7 Nischay'}</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-[#F4F4F0] tracking-tight">
            {isHi ? 'विकसित बिहार के 7 निश्चय कार्यक्रम' : "Bihar's 7-Nischay Flagship Mission"}
          </h2>
          
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
            {isHi
              ? 'शिक्षा, रोजगार, महिला सशक्तिकरण, बुनियादी ढांचे और स्वच्छ जीवन शैली के लिए बिहार सरकार के 7 प्रमुख स्तंभ। अपनी पसंदीदा श्रेणी पर क्लिक कर संबंधित योजनाएं खोजें।'
              : "Discover welfare benefits across Bihar's transformational 7-Nischay development pillars empowering youth, women, and rural households."}
          </p>
        </div>

        {/* 7-Pillars Modern Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SAAT_NISCHAY_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Link
                key={pillar.number}
                to={`/schemes?state=Bihar&q=${encodeURIComponent(pillar.query)}`}
                className="group relative rounded-md border border-stone-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] p-5 flex flex-col justify-between hover:border-[#D95D39] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="w-7 h-7 rounded-md bg-amber-100 dark:bg-[#292826] text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700/60">
                      #{pillar.number}
                    </span>
                    <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-[#292826] text-stone-700 dark:text-[#F4F4F0] flex items-center justify-center group-hover:text-[#D95D39] dark:group-hover:text-[#D95D39] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-[#F4F4F0] group-hover:text-[#D95D39] dark:group-hover:text-[#D95D39] transition-colors leading-snug">
                    {isHi ? pillar.titleHi : pillar.title}
                  </h3>

                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed line-clamp-2">
                    {isHi ? pillar.subtitleHi : pillar.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#2E2D2A] flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span className="truncate mr-2 font-medium text-[11px] text-stone-500 dark:text-[#A8A29E]">
                    {isHi ? pillar.flagshipHi : pillar.flagship}
                  </span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0 font-bold">
                    <span>{isHi ? 'योजनाएं' : 'Explore'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Callout Bar: Flat Matte Earth Architecture */}
        <div className="mt-8 rounded-md bg-[#1C1B19] border border-[#2E2D2A] text-[#F4F4F0] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-md bg-[#292826] border border-[#3A3834] flex items-center justify-center shrink-0 hidden sm:flex">
              <Sparkles className="w-6 h-6 text-[#D95D39]" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-[#F4F4F0]">
                {isHi ? 'क्या आप बिहार स्टूडेंट क्रेडिट कार्ड या स्वयं सहायता भत्ता के लिए पात्र हैं?' : 'Check Your Eligibility for Bihar 7-Nischay Schemes'}
              </h4>
              <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
                {isHi 
                  ? 'अपनी आयु, शिक्षा व आय दर्ज करें और तुरंत जानें कि आप किन-किन योजनाओं के लिए योग्य हैं।'
                  : 'Enter your profile demographics to get an instant, deterministic eligibility report in 2 minutes.'}
              </p>
            </div>
          </div>

          <Link
            to="/eligible"
            className="px-5 py-2.5 rounded-md bg-[#D95D39] hover:bg-[#C44D2B] text-white text-xs sm:text-sm font-bold shrink-0 transition-colors flex items-center gap-1.5"
          >
            <span>{isHi ? 'मेरी पात्रता जांचें' : 'Check Eligibility Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

