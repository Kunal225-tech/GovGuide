import { ExternalLink, FileText, GraduationCap, Tractor, Briefcase, Landmark, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface LifelinePortal {
  id: string;
  name: string;
  nameHi: string;
  department: string;
  departmentHi: string;
  description: string;
  descriptionHi: string;
  url: string;
  icon: typeof FileText;
  badge: string;
  badgeHi: string;
  queryParam: string;
}

const BIHAR_PORTALS: LifelinePortal[] = [
  {
    id: 'rtps',
    name: 'RTPS ServicePlus Bihar',
    nameHi: 'आरटीपीएस सर्विसप्लस बिहार',
    department: 'General Administration Dept',
    departmentHi: 'सामान्य प्रशासन विभाग',
    description: 'Apply online for Domicile (Niwas), Caste (Jati), and Income (Aay) certificates without visiting offices.',
    descriptionHi: 'निवास, जाति एवं आय प्रमाण-पत्र घर बैठे ऑनलाइन बनवाएं।',
    url: 'https://serviceonline.bihar.gov.in',
    icon: FileText,
    badge: 'Certificates & Services',
    badgeHi: 'जाति, आय, निवास',
    queryParam: 'certificate',
  },
  {
    id: 'mnssby',
    name: 'MNSSBY 7-Nischay Portal',
    nameHi: '7-निश्चय युवा मिशन (MNSSBY)',
    department: 'Planning & Development Dept',
    departmentHi: 'योजना एवं विकास विभाग',
    description: 'Bihar Student Credit Card (₹4 Lakh), Swayam Sahayata Bhatta (SHA), and Kushal Yuva Program (KYP).',
    descriptionHi: 'स्टूडेंट क्रेडिट कार्ड (₹4 लाख), स्वयं सहायता भत्ता (₹1,000/माह) व कुशल युवा कार्यक्रम।',
    url: 'https://www.7nishchay-yuvaupmission.bihar.gov.in',
    icon: GraduationCap,
    badge: '7-Nischay Youth',
    badgeHi: '7-निश्चय युवा',
    queryParam: 'Credit Card',
  },
  {
    id: 'medhasoft',
    name: 'Medhasoft e-Kalyan',
    nameHi: 'मेधासॉफ्ट ई-कल्याण पोर्टल',
    department: 'Education Dept, Bihar',
    departmentHi: 'शिक्षा विभाग, बिहार सरकार',
    description: 'Direct Benefit Transfer (DBT) for Kanya Utthan (Graduation/12th), Balika Cycle, and Merit Scholarships.',
    descriptionHi: 'कन्या उत्थान (स्नातक/12वीं), 10वीं प्रथम श्रेणी प्रोत्साहन, साइकिल व छात्रवृत्ति राशि।',
    url: 'https://medhasoft.bih.nic.in',
    icon: Landmark,
    badge: 'Scholarships & DBT',
    badgeHi: 'छात्रवृत्ति व कन्या उत्थान',
    queryParam: 'Kanya Utthan',
  },
  {
    id: 'dbtagri',
    name: 'DBT Agriculture Bihar',
    nameHi: 'प्रत्यक्ष लाभ अंतरण कृषि विभाग',
    department: 'Agriculture Dept, Bihar',
    departmentHi: 'कृषि विभाग, बिहार सरकार',
    description: 'Farmer Registration, Krishi Input Anudan (disaster relief), Diesel Anudan, and Farm Mechanization.',
    descriptionHi: 'किसान पंजीकरण, कृषि इनपुट अनुदान, डीजल अनुदान व कृषि यंत्रीकरण सब्सिडी।',
    url: 'https://dbtagriculture.bihar.gov.in',
    icon: Tractor,
    badge: 'Farmer Subsidies',
    badgeHi: 'किसान व इनपुट अनुदान',
    queryParam: 'Agriculture',
  },
  {
    id: 'udyami',
    name: 'Udyami Bihar Portal',
    nameHi: 'मुख्यमंत्री उद्यमी योजना पोर्टल',
    department: 'Industries Dept, Bihar',
    departmentHi: 'उद्योग विभाग, बिहार सरकार',
    description: '₹10 Lakh assistance (50% grant + 50% interest-free loan) for SC, ST, EBC, Mahila, and Yuva entrepreneurs.',
    descriptionHi: 'नए उद्योग के लिए ₹10 लाख सहायता (₹5 लाख अनुदान + ₹5 लाख ब्याजमुक्त ऋण)।',
    url: 'https://udyami.bihar.gov.in',
    icon: Briefcase,
    badge: '₹10 Lakh Business Aid',
    badgeHi: '₹10 लाख उद्यमी सहायता',
    queryParam: 'Udyami',
  },
];

export function BiharLifelineStrip() {
  const { i18n } = useTranslation();
  const isHi = i18n.language === 'hi';

  return (
    <section className="py-10 bg-surface border-b border-border">
      <div className="gov-container px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EA580C]/10 text-[#EA580C] text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'बिहार सरकार आधिकारिक सेवा केंद्र' : 'Official Bihar Citizen Lifelines'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy tracking-tight">
              {isHi ? 'बिहार राज्य के प्रमुख जनकल्याणकारी पोर्टल' : 'Direct Access to Bihar Government Portals'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {isHi 
                ? 'सरकारी योजनाओं का लाभ लेने के लिए आवश्यक प्रमाण-पत्र, छात्रवृत्ति, और अनुदान सीधे संबंधित आधिकारिक पोर्टल से प्राप्त करें।'
                : 'Apply directly on verified Bihar Government portals for certificates, student credit cards, scholarships, and enterprise subsidies.'}
            </p>
          </div>
          
          <Link
            to="/schemes?state=Bihar"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0"
          >
            <span>{isHi ? 'बिहार की सभी योजनाएं देखें' : 'View All Bihar Schemes'}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* 5-Column Responsive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {BIHAR_PORTALS.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className="rounded-md border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/50 transition-colors group shadow-none"
              >
                <div>
                  {/* Top Bar: Icon + Category Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-[#292826] text-stone-800 dark:text-[#F4F4F0] border border-stone-200 dark:border-[#3A3834] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#292826] text-stone-700 dark:text-[#F4F4F0] border border-stone-200 dark:border-[#3A3834]">
                      {isHi ? portal.badgeHi : portal.badge}
                    </span>
                  </div>

                  {/* Title & Department */}
                  <h3 className="text-sm font-bold text-navy leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {isHi ? portal.nameHi : portal.name}
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5 line-clamp-1">
                    {isHi ? portal.departmentHi : portal.department}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">
                    {isHi ? portal.descriptionHi : portal.description}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    to={`/schemes?state=Bihar&q=${encodeURIComponent(portal.queryParam)}`}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-primary hover:underline"
                  >
                    {isHi ? 'योजनाएं देखें' : 'View Schemes'}
                  </Link>

                  <a
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#EA580C] hover:text-[#C2410C] dark:text-[#D95D39] hover:underline"
                    aria-label={`Open official portal for ${portal.name}`}
                  >
                    <span>{isHi ? 'पोर्टल खोलें' : 'Official Portal'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

