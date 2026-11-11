const fs = require('fs');
const path = require('path');

const biharSchemes = [
  // ==========================================
  // 1. EDUCATION & YOUTH SCHEMES
  // ==========================================
  {
    name: "Bihar Student Credit Card Scheme (BSCCS)",
    aliases: ["BSCCS", "Student Credit Card Bihar", "MNSSBY Student Loan", "बिहार स्टूडेंट क्रेडिट कार्ड"],
    category: "Education",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Flagship Saat Nischay scheme providing education loans up to Rs. 4 Lakh at concessional interest rates (1% for girls/divyang, 4% for boys) to 12th pass students pursuing higher education.",
    benefits: [
      "Education loan up to Rs. 4 Lakh for higher education (B.A., B.Sc., B.Tech, MBBS, MBA, Law, Polytechnic, etc.)",
      "Concessional simple interest: 1% for female, transgender, and divyang students; 4% for male students",
      "Moratorium period: Course duration plus 1 year; no repayment required during studies",
      "100% state government guarantee through Bihar State Education Finance Corporation (BSEFC)"
    ],
    eligibility: [
      "Permanent resident of Bihar state with valid domicile certificate",
      "Passed 10+2 / Intermediate from recognized Bihar board (BSEB) or CBSE/ICSE school within Bihar",
      "Age not exceeding 25 years at the date of application (extended to 30 years for postgraduate courses)",
      "Enrolled in a recognized college/university approved by NAAC/NIRF or state regulatory council"
    ],
    exclusions: [
      "Students already availing education loan from scheduled banks",
      "Students who discontinued higher education without institutional intimation"
    ],
    requiredDocuments: [
      "Aadhaar Card of student and co-applicant (parent/guardian)",
      "10th and 12th Board Marksheet and Passing Certificates",
      "Residential / Domicile Certificate of Bihar issued via RTPS",
      "College Admission Letter and Fee Structure Receipt",
      "Two passport-size photographs of student and co-applicant",
      "Aadhaar-seeded Bank Account Passbook"
    ],
    applicationProcess: [
      "Register online on official portal: 7nishchay-yuvaupmission.bihar.gov.in",
      "Fill application details and select preferred District Registration and Counseling Centre (DRCC)",
      "Book appointment and visit designated DRCC counter with original documents for biometric verification",
      "Loan sanction and direct digital disbursement of institutional fees to college account"
    ],
    officialUrl: "https://www.7nishchay-yuvaupmission.bihar.gov.in",
    applicationUrl: "https://www.7nishchay-yuvaupmission.bihar.gov.in/addStudentAction",
    source: "Education Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 17,
      maxAge: 25,
      states: ["Bihar"],
      educationLevels: ["12th Pass", "Polytechnic", "Undergraduate", "Graduate"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Balak / Balika Protsahan Yojana",
    aliases: ["Matric First Division Scholarship", "Medhasoft 10th Scholarship", "10th Pass Protsahan Yojana", "मुख्यमंत्री बालक बालिका प्रोत्साहन योजना"],
    category: "Education",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Direct Benefit Transfer grant of Rs. 10,000 for students who pass 10th Matriculation board exam in first division, and Rs. 8,000 for SC/ST second division students.",
    benefits: [
      "One-time direct cash incentive of Rs. 10,000 credited to student's bank account for 1st Division",
      "Incentive of Rs. 8,000 for SC and ST students passing in 2nd Division",
      "100% DBT transfer through Medhasoft e-Kalyan portal with Aadhaar payment bridge"
    ],
    eligibility: [
      "Permanent resident of Bihar",
      "Passed 10th (Matric) board examination from Bihar School Examination Board (BSEB)",
      "Secured 1st Division (any caste/category) or 2nd Division (for SC/ST categories)"
    ],
    exclusions: [
      "Students who failed or passed in 3rd division",
      "Students passing from boards outside Bihar without Bihar domicile"
    ],
    requiredDocuments: [
      "BSEB 10th Class Marksheet & Roll Code / Roll Number",
      "Aadhaar Card in student's name",
      "Aadhaar-seeded Bank Account Passbook (active single account in Bihar)",
      "Caste Certificate & Income Certificate (issued by Revenue Officer on RTPS)",
      "Active Mobile Number and Email ID"
    ],
    applicationProcess: [
      "Visit Medhasoft portal: medhasoft.bih.nic.in",
      "Click on 'Apply for Mukhyamantri Balak/Balika (10th Passed) Protsahan Yojana'",
      "Verify registration with BSEB Roll Number, Date of Birth, and Aadhaar",
      "Submit bank details for PFMS verification and receive DBT credit"
    ],
    officialUrl: "https://medhasoft.bih.nic.in",
    applicationUrl: "https://medhasoft.bih.nic.in",
    source: "Education Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 14,
      maxAge: 20,
      states: ["Bihar"],
      educationLevels: ["10th Pass"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Kanya Utthan Yojana - Graduation",
    aliases: ["Snatak Pass Scholarship", "Kanya Utthan Snatak", "50000 Graduation Scheme", "मुख्यमंत्री कन्या उत्थान योजना स्नातक"],
    category: "Women & Child",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Direct cash assistance of Rs. 50,000 to female graduates from recognized colleges and universities in Bihar to promote female higher education and empowerment.",
    benefits: [
      "Lump-sum direct cash incentive of Rs. 50,000 directly transferred to girl's bank account",
      "Available across all streams (Arts, Science, Commerce, Technical, Professional degrees)",
      "Encourages women to pursue self-reliance and competitive exams post-graduation"
    ],
    eligibility: [
      "Female resident citizen of Bihar",
      "Successfully completed graduation (degree course) from a recognized university or affiliated college in Bihar",
      "Must have an active individual bank account linked with Aadhaar"
    ],
    exclusions: [
      "Male candidates",
      "Students graduating from unaccredited private autonomous institutes not recognized by UGC/State Council"
    ],
    requiredDocuments: [
      "Graduation Final Year Marksheet & Degree Certificate",
      "University Registration Number and Roll Number",
      "Bihar Domicile / Residential Certificate (RTPS)",
      "Aadhaar Card",
      "Aadhaar-seeded Bank Passbook in beneficiary girl's name"
    ],
    applicationProcess: [
      "Visit Medhasoft e-Kalyan portal: medhasoft.bih.nic.in",
      "Click on 'Mukhyamantri Kanya Utthan Yojana - Graduation'",
      "Check name in University student result list and register with University Roll Number",
      "Upload marksheet and submit for nodal verification"
    ],
    officialUrl: "https://medhasoft.bih.nic.in",
    applicationUrl: "https://medhasoft.bih.nic.in",
    source: "Education Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Female"],
      states: ["Bihar"],
      educationLevels: ["Graduate", "Post Graduate"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Kanya Utthan Yojana - 12th Pass",
    aliases: ["Inter Pass Scholarship Bihar", "12th Pass Kanya Utthan", "25000 Inter Scheme", "मुख्यमंत्री कन्या उत्थान योजना इंटर"],
    category: "Women & Child",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Direct cash grant of Rs. 25,000 to unmarried girl students who pass the 12th Intermediate examination from Bihar School Examination Board.",
    benefits: [
      "One-time DBT grant of Rs. 25,000 directly into the girl's bank account",
      "Covers all passing divisions (1st, 2nd, and 3rd division)",
      "Prevents child marriage and supports continuation into collegiate education"
    ],
    eligibility: [
      "Unmarried female student resident in Bihar",
      "Passed 10+2 / Intermediate examination from Bihar School Examination Board (BSEB)",
      "Bank account must be active in a bank branch situated within Bihar"
    ],
    exclusions: [
      "Married female candidates",
      "Male students"
    ],
    requiredDocuments: [
      "BSEB 12th Intermediate Marksheet & Admit Card",
      "Aadhaar Card of the student",
      "Declaration of unmarried status",
      "Aadhaar-linked Bank Passbook",
      "Active Mobile Number linked to Aadhaar"
    ],
    applicationProcess: [
      "Access Medhasoft portal: medhasoft.bih.nic.in",
      "Select 'Mukhyamantri Kanya Utthan Yojana (12th Pass)'",
      "Verify registration with 12th Roll Code, Roll Number, and Aadhaar Name",
      "Submit bank account details and confirm registration"
    ],
    officialUrl: "https://medhasoft.bih.nic.in",
    applicationUrl: "https://medhasoft.bih.nic.in",
    source: "Education Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Female"],
      minAge: 15,
      maxAge: 24,
      states: ["Bihar"],
      educationLevels: ["12th Pass"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Nischay Swayam Sahayata Bhatta Yojana (MNSSBY)",
    aliases: ["Berozgari Bhatta Bihar", "Youth Self-Help Allowance", "1000 Allowance Scheme", "मुख्यमंत्री निश्चय स्वयं सहायता भत्ता योजना"],
    category: "Employment",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Unemployment financial assistance of Rs. 1,000 per month for up to 2 years (total Rs. 24,000) for job-seeking youth aged 20-25 who have passed 12th.",
    benefits: [
      "Direct financial support of Rs. 1,000 per month credited to bank account",
      "Paid for up to 24 continuous months (2 years) during active job search",
      "Mandatory inclusion in free Kushal Yuva Program (KYP) computer and communication training"
    ],
    eligibility: [
      "Permanent resident of Bihar aged 20 to 25 years",
      "Passed 12th (Intermediate) or equivalent, and not enrolled in further regular degree courses",
      "Currently unemployed and actively seeking employment",
      "Belonging to a family with no member in regular government service"
    ],
    exclusions: [
      "Youth currently pursuing higher education in regular colleges",
      "Youth currently availing Bihar Student Credit Card or other scholarships",
      "Self-employed or earning members in formal sector"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "10th and 12th Marksheet and Pass Certificate",
      "Residential / Domicile Certificate issued on RTPS",
      "Self-declaration of unemployment",
      "Aadhaar-seeded Bank Account Passbook"
    ],
    applicationProcess: [
      "Apply online at 7nishchay-yuvaupmission.bihar.gov.in",
      "Book slot for District Registration and Counseling Centre (DRCC)",
      "Physical biometric verification and document checking at DRCC",
      "Approval by DRCC Nodal Officer followed by monthly DBT credit"
    ],
    officialUrl: "https://www.7nishchay-yuvaupmission.bihar.gov.in",
    applicationUrl: "https://www.7nishchay-yuvaupmission.bihar.gov.in/addStudentAction",
    source: "Planning and Development Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 20,
      maxAge: 25,
      states: ["Bihar"],
      occupations: ["Unemployed", "Job Seeker"],
      educationLevels: ["12th Pass", "ITI", "Polytechnic", "Graduate", "Post Graduate"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Kushal Yuva Program (KYP)",
    aliases: ["KYP Bihar", "Skill Training Saat Nischay", "BSDM Training", "कुशल युवा कार्यक्रम"],
    category: "Employment",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Free 240-hour certified skill training program for youth in basic computer literacy, English/Hindi communication, and workplace soft skills under Bihar Skill Development Mission.",
    benefits: [
      "240 hours of practical IT and computer training (BS-CIT: Word, Excel, PowerPoint, Internet, Cyber Safety)",
      "Communication skills training in Hindi & English (BS-CLS)",
      "Life skills, workplace ethics, and personality development (BS-CSS)",
      "Government-recognized certificate upon passing assessment",
      "Refundable security deposit of Rs. 1,000 returned after course completion"
    ],
    eligibility: [
      "Resident of Bihar aged 15 to 28 years (relaxation up to 33 years for SC/ST/Divyang)",
      "Passed minimum 10th (Matriculation) from a recognized board"
    ],
    exclusions: [
      "Candidates who previously completed KYP training"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "10th Board Passing Marksheet and Certificate",
      "Residential Certificate of Bihar",
      "Aadhaar-seeded Bank Passbook (for security deposit refund)",
      "Passport-sized photograph"
    ],
    applicationProcess: [
      "Register online at 7nishchay-yuvaupmission.bihar.gov.in",
      "Complete document verification at local District DRCC counter",
      "Get allotted to nearest block-level Skill Development Centre (SDC)",
      "Attend training 2 hours daily for 3 months"
    ],
    officialUrl: "https://skillmissionbihar.org",
    applicationUrl: "https://www.7nishchay-yuvaupmission.bihar.gov.in",
    source: "Bihar Skill Development Mission (BSDM), Labour Resources Department",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 15,
      maxAge: 28,
      states: ["Bihar"],
      educationLevels: ["10th Pass", "12th Pass", "ITI", "Polytechnic", "Undergraduate", "Graduate", "Post Graduate"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "BPSC Civil Seva Protsahan Yojana",
    aliases: ["BPSC 50000 Scheme", "Mukhyamantri Civil Seva Protsahan Yojana - BPSC", "BPSC Prelims Passed Incentive", "मुख्यमंत्री सिविल सेवा प्रोत्साहन योजना बीपीएससी"],
    category: "Education",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "One-time lump sum grant of Rs. 50,000 to SC, ST, EBC, and Women candidates from Bihar who clear the BPSC Combined Competitive Preliminary Examination to prepare for Mains.",
    benefits: [
      "Direct financial grant of Rs. 50,000 credited to bank account",
      "Supports purchase of study material, test series, and mains preparation expenses",
      "No repayment required"
    ],
    eligibility: [
      "Permanent resident of Bihar",
      "Belonging to Scheduled Caste (SC), Scheduled Tribe (ST), Extremely Backward Class (EBC), or Women candidates of any category",
      "Must have successfully cleared BPSC CCE Preliminary Examination for the current recruitment cycle"
    ],
    exclusions: [
      "Candidates employed in central/state government or autonomous public sector corporations",
      "Candidates who already received this incentive once previously"
    ],
    requiredDocuments: [
      "BPSC Prelims Admit Card and Official Result Scorecard",
      "Aadhaar Card",
      "Caste Certificate issued on RTPS (for SC/ST/EBC)",
      "Bihar Domicile / Residential Certificate",
      "Cancelled Cheque or Bank Passbook copy"
    ],
    applicationProcess: [
      "Apply online on portal: bcebcwelfare.bihar.gov.in or scstwelfare.bih.nic.in",
      "Upload BPSC prelims roll number and marksheet",
      "Direct verification with BPSC result database and DBT transfer to bank"
    ],
    officialUrl: "https://scstwelfare.bih.nic.in",
    applicationUrl: "https://bcebcwelfare.bihar.gov.in",
    source: "SC/ST and Backward Classes Welfare Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      categories: ["SC", "ST", "EBC", "OBC"],
      categoryExemptGenders: ["Female"],
      states: ["Bihar"],
      educationLevels: ["Graduate", "Post Graduate", "Doctorate (PhD)"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Cleared BPSC CCE Preliminary Examination in current cycle", "Not already employed in regular government/PSU service"]
    }
  },
  {
    name: "UPSC Civil Seva Protsahan Yojana",
    aliases: ["UPSC 1 Lakh Scheme", "Mukhyamantri Civil Seva Protsahan Yojana - UPSC", "IAS Preparation Grant Bihar", "मुख्यमंत्री सिविल सेवा प्रोत्साहन योजना यूपीएससी"],
    category: "Education",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Lump sum grant of Rs. 1,00,000 (Rs. 1 Lakh) to SC, ST, EBC, and Women candidates from Bihar who clear the UPSC Civil Services Preliminary Examination to prepare for Mains & Interview.",
    benefits: [
      "One-time direct financial grant of Rs. 1,00,000 (One Lakh)",
      "Funds mains examination coaching, lodging in Delhi/state capital, and interview guidance",
      "100% state sponsored DBT grant"
    ],
    eligibility: [
      "Resident of Bihar state",
      "Belonging to SC, ST, EBC, or female candidates of Bihar domicile",
      "Must have cleared UPSC Civil Services Examination (Preliminary) in the active year"
    ],
    exclusions: [
      "Persons already employed in regular government civil posts",
      "Candidates who already availed this grant in a previous UPSC cycle"
    ],
    requiredDocuments: [
      "UPSC Civil Services Prelims Admit Card & Result Proof",
      "Aadhaar Card",
      "Bihar Residential Certificate",
      "Caste Certificate (RTPS)",
      "Bank Account details"
    ],
    applicationProcess: [
      "Submit application on welfare department portal (scstwelfare.bih.nic.in / bcebcwelfare.bihar.gov.in)",
      "Enter UPSC Roll Number and upload admit card",
      "Direct DBT transfer after departmental cross-verification with UPSC data"
    ],
    officialUrl: "https://scstwelfare.bih.nic.in",
    applicationUrl: "https://bcebcwelfare.bihar.gov.in",
    source: "General Administration & Welfare Departments, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      categories: ["SC", "ST", "EBC", "OBC"],
      categoryExemptGenders: ["Female"],
      states: ["Bihar"],
      educationLevels: ["Graduate", "Post Graduate", "Doctorate (PhD)"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Cleared UPSC Civil Services Preliminary Examination in current cycle", "Not already employed in regular government service"]
    }
  },
  {
    name: "Bihar Post-Matric Scholarship Scheme (PMS Bihar)",
    aliases: ["PMS Online Bihar", "Post Matric Scholarship", "बिहार पोस्ट मैट्रिक छात्रवृत्ति"],
    category: "Education",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Financial assistance covering compulsory tuition fees and maintenance allowance for SC, ST, BC, and EBC students pursuing post-matric studies in technical, professional, or general degree courses.",
    benefits: [
      "Full reimbursement of non-refundable compulsory institutional course fees",
      "Monthly maintenance and book allowance directly deposited to student's bank account",
      "Dedicated state portal (pmsonline.bih.nic.in) bypassing delays of National Scholarship Portal"
    ],
    eligibility: [
      "Permanent resident of Bihar",
      "Belonging to SC, ST, BC (Backward Class), or EBC (Extremely Backward Class)",
      "Enrolled in recognized post-matric course (11th, 12th, ITI, Polytechnic, Diploma, UG, PG, Medical, Engineering)",
      "Family annual income not exceeding Rs. 3,00,000 per annum"
    ],
    exclusions: [
      "Students pursuing second degree in the same educational level",
      "Students with annual family income above Rs. 3.0 Lakh"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Previous Examination Marksheet",
      "Valid Income Certificate (issued by Revenue Officer, less than 1 year old)",
      "Caste Certificate (RTPS)",
      "Bihar Domicile Certificate",
      "College Bonafide Certificate and Fee Structure Receipt"
    ],
    applicationProcess: [
      "Register on PMS Online portal: pmsonline.bih.nic.in",
      "Select scholarship category (SC/ST or BC/EBC)",
      "Upload institutional Bonafide certificate and fee receipt",
      "Institutional verification followed by District Welfare Officer sanction"
    ],
    officialUrl: "https://pmsonline.bih.nic.in",
    applicationUrl: "https://pmsonline.bih.nic.in",
    source: "Education and Welfare Departments, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      maxAnnualIncome: 300000,
      categories: ["SC", "ST", "BC", "EBC", "OBC"],
      states: ["Bihar"],
      occupations: ["Student"],
      educationLevels: ["10th Pass", "12th Pass", "ITI", "Polytechnic", "Undergraduate", "Graduate", "Post Graduate", "Doctorate (PhD)"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Cycle Yojana",
    aliases: ["Bicycle Scheme Bihar", "Balak Balika Cycle Yojana", "मुख्यमंत्री बालक बालिका साइकिल योजना"],
    category: "Education",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Direct DBT cash grant of Rs. 3,000 transferred into the bank account of 9th-grade students enrolled in government schools to purchase a bicycle for commuting to secondary schools.",
    benefits: [
      "Direct DBT grant of Rs. 3,000 to purchase a new bicycle",
      "Dramatic reduction in rural female school dropout rates",
      "Distributed across all government and government-aided high schools"
    ],
    eligibility: [
      "Bonafide student enrolled in Class 9 in any government secondary school in Bihar",
      "Minimum 75% school attendance in the academic session"
    ],
    exclusions: [
      "Students studying in unaided private schools"
    ],
    requiredDocuments: [
      "Student Aadhaar Card",
      "School Admission Register Number",
      "Aadhaar-linked Bank Passbook in student's or joint guardian name",
      "Bicycle purchase receipt / invoice voucher"
    ],
    applicationProcess: [
      "School Headmaster prepares beneficiary list through Medhasoft e-Kalyan",
      "Direct DBT disbursement by District Education Officer into verified bank account",
      "Student submits bicycle purchase cash memo to school within 90 days"
    ],
    officialUrl: "https://medhasoft.bih.nic.in",
    applicationUrl: "https://medhasoft.bih.nic.in",
    source: "Education Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 13,
      maxAge: 17,
      states: ["Bihar"],
      occupations: ["Student"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },

  // ==========================================
  // 2. ENTREPRENEURSHIP & BUSINESS SCHEMES
  // ==========================================
  {
    name: "Mukhyamantri SC ST Udyami Yojana",
    aliases: ["SC ST Udyami Bihar", "Mukhyamantri Udyami Yojana - SC/ST", "10 Lakh Business Loan Bihar", "Udyami Yojana SC ST", "मुख्यमंत्री अनुसूचित जाति एवं अनुसूचित जनजाति उद्यमी योजना"],
    category: "Entrepreneurship",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Assistance up to Rs. 10 Lakh (50% grant up to Rs. 5 Lakh + 50% interest-free loan) to SC/ST youth to set up manufacturing, service, or processing micro-enterprises.",
    benefits: [
      "Total project financial assistance of up to Rs. 10,00,000 (Ten Lakhs)",
      "50% of project cost (up to Rs. 5 Lakh) is 100% non-repayable grant/subsidy",
      "Remaining 50% is completely interest-free loan (0% interest)",
      "Repayable in 84 easy monthly installments starting after 1-year moratorium",
      "Free entrepreneurship development training at nodal incubation centers"
    ],
    eligibility: [
      "Permanent resident of Bihar",
      "Belonging to Scheduled Caste (SC) or Scheduled Tribe (ST)",
      "Age between 18 and 50 years",
      "Educational qualification: Minimum 10+2 / Intermediate, ITI, Polytechnic Diploma, or equivalent"
    ],
    exclusions: [
      "Government employees or their dependent family members",
      "Defaulters with banks or financial institutions"
    ],
    requiredDocuments: [
      "Aadhaar Card and PAN Card",
      "Bihar Domicile Certificate (RTPS)",
      "Caste Certificate (RTPS)",
      "10th, 12th / ITI / Diploma Certificate",
      "Current / Saving Bank Account statement and cancelled cheque",
      "Proposed unit project report / business profile"
    ],
    applicationProcess: [
      "Apply online on the official Udyami portal: udyami.bihar.gov.in",
      "Submit enterprise proposal from approved list of 102 industrial projects",
      "Randomized computerized selection followed by screening committee interview",
      "Disbursement in 3 installments based on physical machinery inspection"
    ],
    officialUrl: "https://udyami.bihar.gov.in",
    applicationUrl: "https://udyami.bihar.gov.in",
    source: "Industries Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 18,
      maxAge: 50,
      categories: ["SC", "ST"],
      states: ["Bihar"],
      educationLevels: ["12th Pass", "ITI", "Polytechnic", "Undergraduate", "Graduate", "Post Graduate", "Doctorate (PhD)"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri EBC Udyami Yojana",
    aliases: ["EBC Udyami Bihar", "Mukhyamantri Udyami Yojana - EBC", "Extremely Backward Class Udyami", "मुख्यमंत्री अत्यंत पिछड़ा वर्ग उद्यमी योजना"],
    category: "Entrepreneurship",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Financial support of up to Rs. 10 Lakh (Rs. 5 Lakh grant + Rs. 5 Lakh interest-free loan) for youth from Extremely Backward Classes (EBC) to establish new micro-enterprises.",
    benefits: [
      "Financial assistance up to Rs. 10 Lakh per enterprise",
      "50% grant / direct capital subsidy (up to Rs. 5,00,000)",
      "50% loan at 0% interest rate repayable over 7 years (84 installments)",
      "Training stipend of Rs. 25,000 provided during pre-establishment orientation"
    ],
    eligibility: [
      "Permanent resident of Bihar",
      "Belonging to Extremely Backward Class (EBC / BC-1 category in Bihar)",
      "Age between 18 and 50 years",
      "Minimum education: 10+2 / Intermediate, ITI, Polytechnic, or Graduate"
    ],
    exclusions: [
      "Existing business units expanding operations (scheme is for new greenfield units)",
      "Applicants with past loan defaults"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "EBC Caste Certificate issued on RTPS",
      "Residential Certificate of Bihar",
      "Intermediate / ITI / Diploma Marksheet",
      "Cancelled Cheque & Bank Account Statement",
      "Passport Photograph & Signature"
    ],
    applicationProcess: [
      "Register on udyami.bihar.gov.in during annual application window",
      "Select approved project model (Food processing, textiles, fabrication, light engineering)",
      "Verification by District Industries Centre (DIC) General Manager",
      "Phased fund transfer directly to firm's current bank account"
    ],
    officialUrl: "https://udyami.bihar.gov.in",
    applicationUrl: "https://udyami.bihar.gov.in",
    source: "Industries Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 18,
      maxAge: 50,
      categories: ["EBC", "OBC"],
      states: ["Bihar"],
      educationLevels: ["12th Pass", "ITI", "Polytechnic", "Undergraduate", "Graduate", "Post Graduate", "Doctorate (PhD)"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Mahila Udyami Yojana",
    aliases: ["Women Entrepreneurship Bihar", "Mahila Udyami 10 Lakh", "मुख्यमंत्री महिला उद्यमी योजना"],
    category: "Entrepreneurship",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Financial assistance up to Rs. 10 Lakh (50% grant up to Rs. 5 Lakh + 50% interest-free loan) exclusively for female entrepreneurs of all categories to start independent businesses.",
    benefits: [
      "Assistance up to Rs. 10,00,000 for women-owned enterprises",
      "50% (up to Rs. 5 Lakh) is non-refundable direct grant",
      "50% loan at 0% interest (completely interest-free for women across all social categories)",
      "Repayment across 84 months after 1-year moratorium",
      "Priority incubation and mentoring support"
    ],
    eligibility: [
      "Woman resident of Bihar (any caste or social category: General, EBC, BC, SC, ST)",
      "Age between 18 and 50 years",
      "Minimum educational qualification: 10+2 / Intermediate pass, ITI, or Diploma"
    ],
    exclusions: [
      "Enterprises where woman is not the majority (>=51%) proprietor or partner",
      "Male applicants"
    ],
    requiredDocuments: [
      "Aadhaar Card of the woman applicant",
      "Permanent Residence Certificate (RTPS)",
      "10+2 / Intermediate Pass Certificate",
      "PAN Card & Bank Statement / Cancelled Cheque",
      "Firm registration / Udhyam Aadhar (can be submitted post-selection)"
    ],
    applicationProcess: [
      "Submit application on udyami.bihar.gov.in",
      "Undergo computerized lottery selection by Industries Department",
      "2-week residential training at state incubation center (CIPET / EDI / NIESBUD)",
      "Direct milestone-based DBT loan and subsidy release"
    ],
    officialUrl: "https://udyami.bihar.gov.in",
    applicationUrl: "https://udyami.bihar.gov.in",
    source: "Industries Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Female"],
      minAge: 18,
      maxAge: 50,
      states: ["Bihar"],
      educationLevels: ["12th Pass", "ITI", "Polytechnic", "Undergraduate", "Graduate", "Post Graduate", "Doctorate (PhD)"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Yuva Udyami Yojana",
    aliases: ["Yuva Udyami Bihar", "General BC Udyami", "मुख्यमंत्री युवा उद्यमी योजना"],
    category: "Entrepreneurship",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Financial assistance up to Rs. 10 Lakh (50% grant up to Rs. 5 Lakh + 50% loan at concessional 1% interest) for young male entrepreneurs in General and Backward Classes (BC).",
    benefits: [
      "Up to Rs. 10 Lakh project support for manufacturing and service ventures",
      "50% capital subsidy / grant (up to Rs. 5 Lakh)",
      "Remaining 50% as term loan at concessional 1% simple interest rate",
      "7 years repayment tenure (84 monthly installments) with 12 months moratorium"
    ],
    eligibility: [
      "Male resident of Bihar belonging to General or Backward Class (BC-2)",
      "Age between 18 and 50 years",
      "Passed minimum 10+2 / Intermediate, ITI, Polytechnic, or equivalent"
    ],
    exclusions: [
      "Defaulters with nationalized banks",
      "Applicants under 18 or above 50 years"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Bihar Domicile Certificate",
      "Educational qualification certificates",
      "PAN Card and bank cancelled cheque",
      "Project business plan"
    ],
    applicationProcess: [
      "Online submission through udyami.bihar.gov.in",
      "Randomized digital shortlisting and scrutiny by District Industries Centre",
      "State-level committee sanction and phased installment release"
    ],
    officialUrl: "https://udyami.bihar.gov.in",
    applicationUrl: "https://udyami.bihar.gov.in",
    source: "Industries Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Male"],
      minAge: 18,
      maxAge: 50,
      categories: ["General", "BC", "OBC", "EWS", "Minority"],
      states: ["Bihar"],
      educationLevels: ["12th Pass", "ITI", "Polytechnic", "Undergraduate", "Graduate", "Post Graduate", "Doctorate (PhD)"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },

  // ==========================================
  // 3. SOCIAL SECURITY & PENSION SCHEMES
  // ==========================================
  {
    name: "Mukhyamantri Vridhajan Pension Yojana (MVPY)",
    aliases: ["MVPY Bihar", "Old Age Pension Bihar", "Bihar Vridha Pension", "मुख्यमंत्री वृद्धजन पेंशन योजना"],
    category: "Social Welfare",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Universal old-age pension providing Rs. 400 per month (age 60-79) and Rs. 500 per month (age 80+) to all senior citizens of Bihar without government pension.",
    benefits: [
      "Monthly pension of Rs. 400 for senior citizens aged 60 to 79 years",
      "Increased monthly pension of Rs. 500 for senior citizens aged 80 years and above",
      "100% state-funded DBT direct transfer on the 1st week of every month",
      "No BPL card or income ceiling required (universal coverage for all senior citizens)"
    ],
    eligibility: [
      "Permanent resident of Bihar",
      "Age 60 years or above",
      "Must not be receiving any pension from Central, State, or local government bodies"
    ],
    exclusions: [
      "Retired government employees receiving government pension",
      "Persons receiving other statutory social security pensions"
    ],
    requiredDocuments: [
      "Aadhaar Card (verifying age and identity)",
      "Voter ID Card (EPIC)",
      "Aadhaar-linked Bank Passbook (in a nationalized or rural bank branch in Bihar)",
      "Residential Certificate / Self-Declaration of Domicile",
      "Consent form for Aadhaar biometric/demographic authentication"
    ],
    applicationProcess: [
      "Apply online via SSPMIS portal (sspmis.bihar.gov.in) or RTPS Bihar (serviceonline.bihar.gov.in)",
      "Alternatively, visit local Block Development Office (BDO) or Common Service Centre (RTPS counter)",
      "Verification by Panchayat Secretary and Block Social Welfare Officer",
      "Sanction order issued and monthly DBT initiated directly to bank account"
    ],
    officialUrl: "https://www.sspmis.bihar.gov.in",
    applicationUrl: "https://www.sspmis.bihar.gov.in/RegisterBeneficiary",
    source: "Social Welfare Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 60,
      maxAge: 120,
      states: ["Bihar"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Laxmi Bai Social Security Pension Scheme",
    aliases: ["Laxmibai Widow Pension", "Bihar Vidhwa Pension", "लक्ष्मीबाई सामाजिक सुरक्षा पेंशन योजना"],
    category: "Social Welfare",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Monthly social security pension of Rs. 400 per month for widows aged 18 and above living below the poverty line or with family annual income under Rs. 60,000.",
    benefits: [
      "Regular financial support of Rs. 400 per month directly into bank account",
      "Continuous lifelong coverage until eligibility or remarriage",
      "State-funded direct transfer through SSPMIS"
    ],
    eligibility: [
      "Widowed woman resident in Bihar state",
      "Age 18 years or above",
      "Family annual income below Rs. 60,000 or holding a BPL ration card",
      "Not availing any other state or central pension"
    ],
    exclusions: [
      "Widows receiving Indira Gandhi National Widow Pension (IGNOAPS)",
      "Remarried women"
    ],
    requiredDocuments: [
      "Aadhaar Card of the applicant",
      "Husband's official Death Certificate",
      "Income Certificate (under Rs. 60,000/yr) or BPL Certificate",
      "Bihar Residential Certificate",
      "Aadhaar-linked Bank Account Passbook"
    ],
    applicationProcess: [
      "Submit application on ServicePlus Bihar (serviceonline.bihar.gov.in)",
      "Upload husband's death certificate and RTPS income certificate",
      "Approval by Block Development Officer (BDO) within 21 working days"
    ],
    officialUrl: "https://www.sspmis.bihar.gov.in",
    applicationUrl: "https://serviceonline.bihar.gov.in",
    source: "Social Welfare Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Female"],
      minAge: 18,
      maxAge: 59,
      maxAnnualIncome: 60000,
      states: ["Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Widowhood status verification (husband's death certificate)", "Not receiving IGNOAPS or other pension"]
    }
  },
  {
    name: "Bihar Divyangjan Pension Yojana",
    aliases: ["Disability Pension Bihar", "Viklang Pension Bihar", "बिहार राज्य निःशक्तता पेंशन योजना"],
    category: "Social Welfare",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Monthly pension of Rs. 400 directly to persons with 40% or more physical or mental disability residing in Bihar.",
    benefits: [
      "Monthly pension of Rs. 400 credited to bank account",
      "Free assistive devices (wheelchairs, hearing aids, tricycles) under ALIMCO tie-up",
      "State social security support"
    ],
    eligibility: [
      "Resident of Bihar of any age",
      "Minimum 40% certified disability verified by government medical board",
      "Family annual income below Rs. 60,000 or BPL card holder"
    ],
    exclusions: [
      "Persons receiving other government disability pensions exceeding Rs. 400"
    ],
    requiredDocuments: [
      "UDID Card or Disability Certificate from Civil Surgeon / Medical Board (>=40%)",
      "Aadhaar Card",
      "Bihar Residence Certificate",
      "Income Certificate / BPL Card",
      "Bank Passbook"
    ],
    applicationProcess: [
      "Apply through RTPS counter or online at serviceonline.bihar.gov.in",
      "Upload UDID and disability certificate",
      "Sanctioned by Assistant Director, District Social Security Cell"
    ],
    officialUrl: "https://www.sspmis.bihar.gov.in",
    applicationUrl: "https://serviceonline.bihar.gov.in",
    source: "Social Welfare Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      maxAnnualIncome: 60000,
      states: ["Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Minimum 40% certified disability verified by government medical board / UDID"]
    }
  },
  {
    name: "Mukhyamantri Kanya Vivah Yojana",
    aliases: ["Kanya Vivah Bihar", "Marriage Assistance Bihar", "मुख्यमंत्री कन्या विवाह योजना"],
    category: "Financial Assistance",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Financial grant of Rs. 5,000 at the time of registered legal marriage for daughters of families living below the poverty line or with income below Rs. 60,000.",
    benefits: [
      "One-time DBT grant of Rs. 5,000 credited to bride's bank account",
      "Encourages mandatory registration of marriages and prevents child marriage"
    ],
    eligibility: [
      "Bride must be a resident of Bihar",
      "Age of bride must be at least 18 years, and groom must be at least 21 years at marriage",
      "Family annual income must not exceed Rs. 60,000 (or BPL card holder)",
      "Marriage must be legally registered with the local Registrar / Gram Panchayat"
    ],
    exclusions: [
      "Marriages solemnized below the legal marriageable age (child marriages strictly excluded)",
      "Families with annual income exceeding Rs. 60,000"
    ],
    requiredDocuments: [
      "Official Marriage Registration Certificate",
      "Aadhaar Card of Bride and Groom (proving age >= 18 and >= 21)",
      "Income Certificate (under Rs. 60,000) or BPL Ration Card",
      "Residential Certificate of Bihar",
      "Bride's Bank Account Passbook"
    ],
    applicationProcess: [
      "Apply on ServicePlus RTPS portal: serviceonline.bihar.gov.in",
      "Submit application within 1 year of marriage registration",
      "Verification by Block Development Officer and DBT release"
    ],
    officialUrl: "https://serviceonline.bihar.gov.in",
    applicationUrl: "https://serviceonline.bihar.gov.in",
    source: "Social Welfare Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Female"],
      minAge: 18,
      maxAge: 35,
      maxAnnualIncome: 60000,
      states: ["Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Legally registered marriage certificate (bride >= 18 and groom >= 21 at marriage)"]
    }
  },

  // ==========================================
  // 4. AGRICULTURE & FARMER WELFARE SCHEMES
  // ==========================================
  {
    name: "Bihar Krishi Input Anudan Yojana",
    aliases: ["Krishi Input Subsidy", "Crop Loss Relief Bihar", "Fasal Kshati Anudan", "बिहार कृषि इनपुट अनुदान योजना"],
    category: "Agriculture",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Disaster crop compensation subsidy of Rs. 8,500/ha for rainfed, Rs. 17,000/ha for irrigated, and Rs. 22,500/ha for perennial crops affected by drought, excessive rainfall, or floods in notified blocks.",
    benefits: [
      "Compensation of Rs. 8,500 per hectare for un-irrigated (rainfed) crop loss (>33% damage)",
      "Compensation of Rs. 17,000 per hectare for assured irrigated farmland",
      "Compensation of Rs. 22,500 per hectare for perennial fruit orchards and sugarcane crops",
      "Covered up to a maximum of 2 hectares per farmer family",
      "Both landowning farmers (Raiyat) and tenant sharecroppers (Gair-Raiyat / Bataidar) are eligible"
    ],
    eligibility: [
      "Resident farmer of Bihar cultivating in officially disaster-notified blocks",
      "Must have a valid 13-digit Kisan Registration Number (DBT Agriculture Bihar)",
      "Incurred crop damage of 33% or more due to natural calamities"
    ],
    exclusions: [
      "Farmers outside notified calamity districts/blocks",
      "Commercial institutional farming companies"
    ],
    requiredDocuments: [
      "13-digit Farmer Registration Number (Kisan Panjikaran)",
      "LPC (Land Possession Certificate) or recent Land Revenue Rent Receipt (Rasid) for landholders",
      "Self-declaration affidavit counter-signed by Ward Member/Kisan Coordinator for sharecroppers (Bataidar)",
      "Aadhaar-seeded Bank Passbook"
    ],
    applicationProcess: [
      "Apply during disaster window on dbtagriculture.bihar.gov.in",
      "Select notified district, block, and panchayat",
      "Enter Khasra, Khesra, and affected acreage details",
      "Physical field verification by Agriculture Coordinator (Krishi Samanvayak) and direct DBT credit"
    ],
    officialUrl: "https://dbtagriculture.bihar.gov.in",
    applicationUrl: "https://dbtagriculture.bihar.gov.in",
    source: "Agriculture Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      occupations: ["Farmer", "Agriculture"],
      states: ["Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Cultivation in officially disaster-notified block with >= 33% verified crop damage", "Valid 13-digit DBT Agriculture Kisan Registration"]
    }
  },
  {
    name: "Bihar Diesel Anudan Yojana",
    aliases: ["Diesel Subsidy Bihar", "Irrigation Diesel Grant", "बिहार डीजल अनुदान योजना"],
    category: "Agriculture",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Diesel fuel subsidy of Rs. 75 per litre (up to Rs. 750 per acre per irrigation) to protect standing kharif and rabi crops during rainfall deficit.",
    benefits: [
      "Subsidy of Rs. 75 per litre on diesel purchased for pump-set irrigation",
      "Rs. 750 per acre for each irrigation cycle (up to 3 irrigations for paddy, maize, pulses, oilseeds)",
      "Maximum subsidy of Rs. 2,250 per acre for up to 8 acres"
    ],
    eligibility: [
      "Resident farmer of Bihar with active Kisan Panjikaran",
      "Utilizing diesel pump sets for irrigating crops in rain-deficient periods"
    ],
    exclusions: [
      "Farmland with functional government canal or solar tubewell irrigation"
    ],
    requiredDocuments: [
      "13-digit Kisan Registration Number",
      "Authorized digital petrol pump cash memo (mentioning Kisan Registration Number and date)",
      "LPC / Land Tax Receipt or Ward Member verification certificate",
      "Aadhaar-linked Bank details"
    ],
    applicationProcess: [
      "Apply online on DBT Agriculture Bihar: dbtagriculture.bihar.gov.in",
      "Upload petrol pump invoice and irrigation details",
      "Verification by Agriculture Coordinator and DAO sanction"
    ],
    officialUrl: "https://dbtagriculture.bihar.gov.in",
    applicationUrl: "https://dbtagriculture.bihar.gov.in",
    source: "Agriculture Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      occupations: ["Farmer", "Agriculture"],
      states: ["Bihar"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Bihar Krishi Yantrikikaran Yojana",
    aliases: ["OFMAS Bihar", "Tractor Subsidy Bihar", "Farm Machinery Subsidy", "कृषि यंत्रीकरण राज्य योजना बिहार"],
    category: "Agriculture",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Subsidy ranging from 40% to 80% on 90+ agricultural implements including rotavators, power tillers, reaper binders, and multi-crop threshers via OFMAS portal.",
    benefits: [
      "40% to 50% subsidy for General category farmers",
      "75% to 80% subsidy for SC, ST, and EBC farmers",
      "Covers 90+ machines: Rotavators, Zero Tillage Machines, Threshers, Reaper, Straw Reaper, Laser Land Levelers",
      "Subsidized farm machinery banks for Custom Hiring Centers (CHC) at Panchayat level"
    ],
    eligibility: [
      "Farmer resident in Bihar holding cultivable land",
      "Registered on DBT Agriculture portal (13-digit Kisan Panjikaran)"
    ],
    exclusions: [
      "Farmers who availed subsidy on the same equipment within the last 3-5 years"
    ],
    requiredDocuments: [
      "Kisan Registration Number",
      "Land Possession Certificate (LPC) / Online Malguzari Receipt",
      "Caste Certificate (for higher subsidy in SC/ST/EBC)",
      "Aadhaar Card and Bank Account statement"
    ],
    applicationProcess: [
      "Apply on OFMAS portal: farmech.bih.nic.in",
      "Select approved farm equipment and authorized dealer in Bihar",
      "Computerized permit issuance and delivery verification by Assistant Agricultural Engineer"
    ],
    officialUrl: "https://farmech.bih.nic.in",
    applicationUrl: "https://farmech.bih.nic.in",
    source: "Agriculture Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      occupations: ["Farmer", "Agriculture"],
      states: ["Bihar"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },

  // ==========================================
  // 5. HEALTHCARE & RURAL WELFARE
  // ==========================================
  {
    name: "Bal Hriday Yojana (Saat Nischay-2)",
    aliases: ["Child Heart Surgery Bihar", "Bal Hriday Saat Nischay", "मुख्यमंत्री बाल हृदय योजना"],
    category: "Healthcare",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Free pediatric surgery, flight/train travel, hospital stay, and complete treatment for children born with Hole in Heart (Ventricular/Atrial Septal Defect) under Saat Nischay-2.",
    benefits: [
      "100% free cardiac surgery at world-class partner super-specialty hospitals (e.g., Sri Sathya Sai Sanjeevani Hospital / Narayana Health)",
      "Free flight/train air-conditioned travel for the patient child and two parents/guardians",
      "Free lodging, food, and post-operative medications provided by Bihar Government",
      "Saves poor families from catastrophic healthcare debt"
    ],
    eligibility: [
      "Resident child of Bihar aged 0 to 18 years",
      "Diagnosed with congenital heart disease / hole in heart by registered cardiologist or district screening camp"
    ],
    exclusions: [
      "Children older than 18 years",
      "Non-residents of Bihar"
    ],
    requiredDocuments: [
      "Echo-cardiography (ECHO) report diagnosing congenital heart defect",
      "Birth Certificate of child or Aadhaar Card",
      "Parents' Aadhaar Card and Bihar Residence Certificate",
      "Referral slip from District Civil Surgeon or IGIC Patna"
    ],
    applicationProcess: [
      "Visit District Sadar Hospital screening camp or Indira Gandhi Institute of Cardiology (IGIC) Patna",
      "Registration by District Health Society under Bal Hriday Yojana",
      "State-arranged special travel and surgery at designated partner hospital"
    ],
    officialUrl: "https://state.bihar.gov.in/health",
    applicationUrl: "https://state.bihar.gov.in/health",
    source: "Health Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 0,
      maxAge: 18,
      states: ["Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Confirmed congenital heart disease diagnosis by registered cardiologist or RBSK screening camp"]
    }
  },
  {
    name: "Mukhyamantri Chikitsa Sahayata Kosh",
    aliases: ["Medical Relief Fund Bihar", "Chikitsa Sahayata", "मुख्यमंत्री चिकित्सा सहायता कोष"],
    category: "Healthcare",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Financial medical grant ranging from Rs. 10,000 to Rs. 5,00,000 for low-income patients suffering from serious critical illnesses like cancer, kidney failure, and neurosurgery.",
    benefits: [
      "Direct grant up to Rs. 5,00,000 for bone marrow, kidney, or liver transplants",
      "Up to Rs. 1,00,000 to Rs. 2,50,000 for cancer chemotherapy, radiation, and open heart surgeries",
      "Direct payment to hospital treasury relieving acute medical burden"
    ],
    eligibility: [
      "Permanent resident of Bihar",
      "Family annual income not exceeding Rs. 2,50,000 per annum",
      "Undergoing treatment in recognized government medical college (AIIMS, IGIMS, PMCH) or approved empanelled hospital"
    ],
    exclusions: [
      "Patients covered under full health insurance reimbursement from government service"
    ],
    requiredDocuments: [
      "Income Certificate (under Rs. 2.5L) issued via RTPS",
      "Bihar Domicile Certificate",
      "Medical treatment estimate certificate issued by Medical Superintendent / Head of Department",
      "Aadhaar Card and Patient Photograph"
    ],
    applicationProcess: [
      "Submit application to District Magistrate (DM) office or Health Department Patna",
      "State Medical Committee verification of treatment estimate",
      "Direct sanction and electronic fund transfer to treating hospital"
    ],
    officialUrl: "https://state.bihar.gov.in/health",
    applicationUrl: "https://state.bihar.gov.in/health",
    source: "Health Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      maxAnnualIncome: 250000,
      states: ["Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Active hospitalization or treatment cost estimate for covered critical illness at AIIMS, IGIMS, PMCH, or approved empanelled hospital"]
    }
  },
  {
    name: "Bihar Pravasi Mazdoor Durghatna Anudan Yojana",
    aliases: ["Migrant Worker Insurance Bihar", "Pravasi Mazdoor Anudan", "बिहार राज्य प्रवासी मजदूर दुर्घटना अनुदान योजना"],
    category: "Social Welfare",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Financial ex-gratia grant of Rs. 1,00,000 in case of accidental death and Rs. 75,000 for permanent disability of migrant workers from Bihar working outside the state.",
    benefits: [
      "Ex-gratia relief of Rs. 1,00,000 (One Lakh) to the next of kin in case of accidental death outside Bihar",
      "Compensation of Rs. 75,000 in case of complete permanent disability",
      "Compensation of Rs. 37,500 in case of partial permanent disability",
      "Free mortal remains transportation assistance to native village in Bihar"
    ],
    eligibility: [
      "Resident of Bihar aged 18 to 65 years",
      "Engaged as unorganized migrant wage labourer, artisan, or worker outside Bihar",
      "Incident occurred during migrant work outside Bihar territory"
    ],
    exclusions: [
      "Natural deaths without accident",
      "Suicide or self-inflicted injuries"
    ],
    requiredDocuments: [
      "Post-Mortem Report and FIR copy from local police station where incident occurred",
      "Death Certificate or Permanent Disability Certificate",
      "Deceased worker's Bihar Domicile Certificate and Aadhaar",
      "Nominee / Dependent Family Member Certificate issued by Circle Officer (CO)",
      "Nominee's Bank Account Passbook"
    ],
    applicationProcess: [
      "Submit application to District Labour Superintendent (Shram Adhikshak) in native Bihar district",
      "Verification of migrant status and dependent claim",
      "Direct grant credit to nominee bank account"
    ],
    officialUrl: "https://labour.bihar.gov.in",
    applicationUrl: "https://serviceonline.bihar.gov.in",
    source: "Labour Resources Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 18,
      maxAge: 65,
      occupations: ["Daily Wage Earner", "Worker", "Labourer", "Migrant Worker"],
      states: ["Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Accidental death or permanent disability while working as an unorganized migrant labourer outside Bihar"]
    }
  },
  {
    name: "Jeevika - Bihar Rural Livelihoods Promotion Society",
    aliases: ["Jeevika Bihar", "BRLPS Self Help Groups", "Jeevika Didi", "जीविका बिहार"],
    category: "Financial Assistance",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "World Bank assisted women self-help group movement providing collateral-free credit, revolving funds, and enterprise linkage to over 1.3 crore rural women across Bihar.",
    benefits: [
      "Revolving fund of Rs. 15,000 and Community Investment Fund (CIF) up to Rs. 1.5 Lakh per Self-Help Group",
      "Collateral-free bank credit linkages up to Rs. 2 Lakh to Rs. 5 Lakh at subsidized interest rates",
      "Skill training in poultry, dairy, goat rearing, tailoring, retail, and agri-nutri gardens",
      "Special status as 'Jeevika Didi' for running government hospital canteens (Didi Ki Rasoi)"
    ],
    eligibility: [
      "Rural women resident in Bihar",
      "Age 18 to 60 years",
      "Belonging to poor or marginal households willing to join a 10-15 member Self-Help Group"
    ],
    exclusions: [
      "Men (Jeevika SHG core membership is strictly reserved for women)"
    ],
    requiredDocuments: [
      "Aadhaar Card of the woman member",
      "Joint SHG group bank passbook",
      "Individual Aadhaar-seeded saving bank passbook",
      "Passport photograph"
    ],
    applicationProcess: [
      "Contact Village Community Mobilizer (CM) or Area Coordinator (AC)",
      "Form or join a 10-15 member Self-Help Group (SHG)",
      "Panchasutra grading after 3 months followed by institutional micro-credit linkage"
    ],
    officialUrl: "https://brlps.in",
    applicationUrl: "https://brlps.in",
    source: "Rural Development Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Female"],
      minAge: 18,
      maxAge: 60,
      states: ["Bihar"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Mukhyamantri Gram Parivahan Yojana (MGPY)",
    aliases: ["Gram Parivahan Bihar", "Vehicle Subsidy Bihar", "MGPY E-Rickshaw", "मुख्यमंत्री ग्राम परिवहन योजना"],
    category: "Employment",
    level: "state",
    state: "Bihar",
    applicableStates: ["Bihar"],
    schemeType: "state",
    description: "Subsidy of 50% up to Rs. 1,00,000 for purchasing 4 to 10-seater commercial passenger vehicles (auto/e-rickshaw/maxi-cab) to boost rural transport and self-employment for SC/ST/EBC youth.",
    benefits: [
      "50% subsidy on vehicle purchase cost, up to a maximum of Rs. 1,00,000 (One Lakh)",
      "Covers 4-seater to 10-seater commercial passenger motor vehicles and e-rickshaws",
      "Generates sustained daily livelihood in rural gram panchayats"
    ],
    eligibility: [
      "Resident of a rural Gram Panchayat in Bihar",
      "Belonging to SC, ST, or EBC (Extremely Backward Class)",
      "Age 21 years or above",
      "Must possess a valid commercial motor vehicle driving license (LMV/Transport)"
    ],
    exclusions: [
      "Persons already employed in government service",
      "Urban municipal area residents"
    ],
    requiredDocuments: [
      "Valid Driving License (Commercial / LMV-NT)",
      "Aadhaar Card and Bihar Domicile Certificate",
      "Caste Certificate (SC/ST/EBC)",
      "Educational qualification certificate (minimum 8th/10th pass)",
      "Bank Account details"
    ],
    applicationProcess: [
      "Apply online on Transport Department portal: transport.bihar.gov.in",
      "Select block and panchayat quota",
      "Sub-Divisional Officer (SDO) committee scrutiny and subsidy sanction"
    ],
    officialUrl: "https://state.bihar.gov.in/transport",
    applicationUrl: "https://state.bihar.gov.in/transport",
    source: "Transport Department, Government of Bihar",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 21,
      maxAge: 55,
      categories: ["SC", "ST", "EBC", "OBC"],
      states: ["Bihar"],
      occupations: ["Unemployed", "Job Seeker", "Driver", "Self Employed"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },

  // ==========================================
  // 6. CORE CENTRAL SCHEMES (APPLICABLE IN BIHAR)
  // ==========================================
  {
    name: "PM Kisan Samman Nidhi",
    aliases: ["PM-KISAN", "PM Kisan", "Pradhan Mantri Kisan Samman Nidhi", "पीएम किसान सम्मान निधि"],
    category: "Agriculture",
    level: "central",
    state: "All",
    applicableStates: ["All", "Bihar"],
    schemeType: "central-sector",
    description: "Central Sector scheme providing income support of Rs. 6,000 per year in three equal 4-monthly installments of Rs. 2,000 directly to bank accounts of all landholding farmer families across India.",
    benefits: [
      "Direct income support of Rs. 6,000 per year per eligible farmer family",
      "Transferred in three equal installments of Rs. 2,000 every four months",
      "100% centrally funded Direct Benefit Transfer (DBT) directly into Aadhaar-seeded bank accounts"
    ],
    eligibility: [
      "All landholding farmer families possessing cultivable agricultural land registered in official state land records",
      "Valid Aadhaar card linked with bank account and active e-KYC status on PM-KISAN portal",
      "Land record details (Khata/Khasra/Khatauni) registered and verified in the State Land Record Management System"
    ],
    exclusions: [
      "Institutional landholders (trusts, companies, societies)",
      "Former and present Ministers, MPs, MLAs, MLCs, Mayors of Municipal Corporations",
      "All persons who paid Income Tax in the last assessment year",
      "Government employees and pensioners earning >= Rs. 10,000 per month"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Land ownership documents / Land Possession Certificate (LPC) / Khatauni copy",
      "Aadhaar-seeded bank account passbook",
      "Active mobile number linked to Aadhaar for OTP/e-KYC"
    ],
    applicationProcess: [
      "Visit official portal (pmkisan.gov.in) and click on 'New Farmer Registration'",
      "Enter Aadhaar number and mobile number, select State (Bihar), and verify via OTP",
      "Fill landholding details and upload land document"
    ],
    officialUrl: "https://pmkisan.gov.in",
    applicationUrl: "https://pmkisan.gov.in/RegistrationFormNew.aspx",
    source: "Ministry of Agriculture and Farmers Welfare, Government of India",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 18,
      occupations: ["Farmer", "Agriculture"],
      states: ["All", "Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Must hold cultivable land ownership documented in digital land records", "Income tax payer exclusion"]
    }
  },
  {
    name: "Pradhan Mantri Awas Yojana - Gramin",
    aliases: ["PMAY-G", "PMAY Gramin", "PM Awas", "ग्रामीण आवास योजना"],
    category: "Housing",
    level: "central",
    state: "All",
    applicableStates: ["All", "Bihar"],
    schemeType: "centrally-sponsored",
    description: "Centrally sponsored rural housing scheme providing financial grant of Rs. 1,20,000 in plain areas like Bihar, plus Rs. 12,000 for toilet construction, to construct a pucca house.",
    benefits: [
      "Direct grant of Rs. 1,20,000 in plain areas (Bihar) transferred in 3 installments",
      "Additional Rs. 12,000 under Swachh Bharat Mission - Gramin for toilet construction",
      "90 to 95 days of unskilled labour wages under MGNREGA (~Rs. 20,000)",
      "Optional subsidized institutional loan up to Rs. 70,000 at concessional interest"
    ],
    eligibility: [
      "Houseless families or households living in zero, one, or two-room kutcha houses with temporary walls/roof",
      "Household must be listed in Socio-Economic and Caste Census (SECC 2011) or Awaas+ survey list",
      "No family member owns a pucca house anywhere in India"
    ],
    exclusions: [
      "Households owning motorized 2/3/4 wheeler or mechanized agricultural equipment",
      "Households with any member in government service or paying income tax",
      "Households possessing Kisan Credit Card with credit limit >= Rs. 50,000"
    ],
    requiredDocuments: [
      "Aadhaar card of all adult family members",
      "Aadhaar-linked bank account passbook",
      "MGNREGA Job Card number",
      "SECC 2011 / Awaas+ reference registration ID",
      "Land possession or homestead certificate"
    ],
    applicationProcess: [
      "Gram Sabha verifies prioritized beneficiary list from Awaas+ database",
      "Geotagging of old kutcha house via AwaasApp by Panchayat Secretary",
      "Sanction order and installment disbursement directly to beneficiary bank account"
    ],
    officialUrl: "https://pmayg.nic.in",
    applicationUrl: "https://pmayg.nic.in",
    source: "Ministry of Rural Development, Government of India",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 18,
      maxAnnualIncome: 180000,
      states: ["All", "Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["SECC 2011 / Awaas+ deprivation list inclusion", "Kutcha house verification"]
    }
  },
  {
    name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana",
    aliases: ["PM-JAY", "Ayushman Bharat", "Ayushman Card Bihar", "आयुष्मान भारत योजना"],
    category: "Healthcare",
    level: "central",
    state: "All",
    applicableStates: ["All", "Bihar"],
    schemeType: "centrally-sponsored",
    description: "World's largest government-funded health assurance scheme providing cashless hospitalisation cover of up to Rs. 5,00,000 per family per year across empanelled hospitals.",
    benefits: [
      "Cashless health insurance cover up to Rs. 5,00,000 per eligible family per year",
      "Covers secondary and tertiary care hospitalization across 1,949 medical procedures",
      "Pre and post hospitalization expenses covered (3 days prior and 15 days post discharge)",
      "Zero out-of-pocket payment at all empanelled government and private hospitals across India"
    ],
    eligibility: [
      "Families listed under defined deprivation criteria in SECC 2011 database",
      "Active National Food Security Act (NFSA) / Bihar State Ration Card holders (Ration card linked with Ayushman portal)"
    ],
    exclusions: [
      "Households owning pucca houses or motorized four-wheelers",
      "Government employees and families paying income tax"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Ration Card or PM-JAY Family Identification Letter (HHID)",
      "Active mobile number linked to Aadhaar for biometric/OTP e-KYC"
    ],
    applicationProcess: [
      "Check eligibility at beneficiary.nha.gov.in or nearest Common Service Centre / Sadar Hospital",
      "Complete e-KYC using Aadhaar OTP or fingerprint authentication",
      "Instant download of plastic Ayushman Bharat Golden Card"
    ],
    officialUrl: "https://beneficiary.nha.gov.in",
    applicationUrl: "https://beneficiary.nha.gov.in",
    source: "National Health Authority, Ministry of Health and Family Welfare",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      maxAnnualIncome: 250000,
      states: ["All", "Bihar"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["SECC 2011 / NFSA Ration Card list inclusion"]
    }
  },
  {
    name: "Pradhan Mantri Mudra Yojana (PMMY)",
    aliases: ["MUDRA Loan", "PMMY", "PM Mudra", "मुद्रा लोन योजना"],
    category: "Entrepreneurship",
    level: "central",
    state: "All",
    applicableStates: ["All", "Bihar"],
    schemeType: "central-sector",
    description: "Collateral-free micro-enterprise loan up to Rs. 20 Lakh in 4 tiers (Shishu, Kishore, Tarun, Tarun Plus) for small businesses, traders, artisans, and shopkeepers.",
    benefits: [
      "Shishu: Loans up to Rs. 50,000 for startup micro-units",
      "Kishore: Loans from Rs. 50,001 to Rs. 5,00,000 for expanding businesses",
      "Tarun: Loans from Rs. 5,00,001 to Rs. 10,00,000 for established enterprises",
      "Tarun Plus: Loans up to Rs. 20,00,000 for past successful repayers",
      "Zero collateral or third-party guarantee required"
    ],
    eligibility: [
      "Any Indian citizen residing in Bihar with a viable non-farm business proposal",
      "Age 18 to 65 years",
      "Satisfactory credit track record (no bank default)"
    ],
    exclusions: [
      "Corporate bodies and agricultural primary farm activities",
      "Willful bank defaulters"
    ],
    requiredDocuments: [
      "Identity proof (Aadhaar Card, Voter ID)",
      "Business address proof and Udhyam Registration",
      "Last 6 months bank statement",
      "Project quotation and business profile"
    ],
    applicationProcess: [
      "Apply online on UdyamiMitra portal (udyamimitra.in) or visit any public/private commercial bank or Grameen Bank branch in Bihar",
      "Submit application form with business quotation",
      "Sanction and Mudra debit card issuance"
    ],
    officialUrl: "https://www.mudra.org.in",
    applicationUrl: "https://www.udyamimitra.in",
    source: "Department of Financial Services, Ministry of Finance",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 18,
      maxAge: 65,
      states: ["All", "Bihar"],
      occupations: ["Self Employed", "Business Owner", "Trader", "Artisan", "Micro-Entrepreneur"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "Sukanya Samriddhi Yojana",
    aliases: ["SSY", "Sukanya Yojana", "Girl Child Savings", "सुकन्या समृद्धि योजना"],
    category: "Women & Child",
    level: "central",
    state: "All",
    applicableStates: ["All", "Bihar"],
    schemeType: "central-sector",
    description: "High-interest government-backed small savings scheme (current interest ~8.2%) for girl children below 10 years with complete triple tax exemption (EEE).",
    benefits: [
      "High guaranteed interest rate (8.2% per annum, compounded annually)",
      "Triple tax exemption under Section 80C (EEE: Deposit, Interest, and Maturity tax-free)",
      "Can be opened with minimum deposit of just Rs. 250 per year",
      "Partial withdrawal of up to 50% allowed after age 18 for higher education"
    ],
    eligibility: [
      "Girl child must be a resident Indian citizen",
      "Account opened by natural/legal guardian before the girl reaches 10 years of age",
      "Maximum two girl children per family"
    ],
    exclusions: [
      "Boys",
      "Girl children above 10 years of age at account opening"
    ],
    requiredDocuments: [
      "Birth Certificate of the girl child",
      "Identity and Address Proof of parent/guardian (Aadhaar, PAN)",
      "Passport photograph of child and guardian"
    ],
    applicationProcess: [
      "Visit any Post Office branch or authorized commercial bank branch in Bihar",
      "Fill Form-1 and submit initial deposit (minimum Rs. 250)",
      "Passbook issued in girl child's name"
    ],
    officialUrl: "https://www.indiapost.gov.in",
    applicationUrl: "https://www.indiapost.gov.in",
    source: "Department of Posts & Ministry of Finance, Government of India",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      genders: ["Female"],
      minAge: 0,
      maxAge: 10,
      states: ["All", "Bihar"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  },
  {
    name: "PM SVANidhi",
    aliases: ["Street Vendor Loan", "SVANidhi", "PM SVANidhi Bihar", "प्रधानमंत्री स्वनिधि योजना"],
    category: "Employment",
    level: "central",
    state: "All",
    applicableStates: ["All", "Bihar"],
    schemeType: "central-sector",
    description: "Collateral-free working capital micro-credit scheme for urban street vendors, providing initial Rs. 10,000 loan with 7% interest subsidy and up to Rs. 50,000 on timely repayments.",
    benefits: [
      "First tranche: Collateral-free working capital loan of up to Rs. 10,000",
      "Second tranche: Enhanced loan up to Rs. 20,000 on timely repayment",
      "Third tranche: Enhanced loan up to Rs. 50,000",
      "7% interest subsidy credited quarterly directly to bank account",
      "Digital transaction cashback incentive up to Rs. 100 per month (Rs. 1,200/year)"
    ],
    eligibility: [
      "Street vendors engaged in vending in urban local bodies (Nagar Nigam, Nagar Parishad, Nagar Panchayat) in Bihar on or before March 24, 2020",
      "Possessing Certificate of Vending / ID card or Letter of Recommendation (LoR) from local Urban Local Body (ULB)"
    ],
    exclusions: [
      "Non-vendors",
      "Willful bank defaulters"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Vending Certificate / Identity Card or LoR from Nagar Nigam / ULB",
      "Aadhaar-linked Bank Passbook"
    ],
    applicationProcess: [
      "Apply on pmsvanidhi.mohua.gov.in or PM SVANidhi mobile app",
      "Choose preferred lending bank branch in your town",
      "Direct disbursement within 10-15 days"
    ],
    officialUrl: "https://pmsvanidhi.mohua.gov.in",
    applicationUrl: "https://pmsvanidhi.mohua.gov.in",
    source: "Ministry of Housing and Urban Affairs, Government of India",
    sourcePlatform: "official-portal",
    status: "active",
    hasDeterministicRule: true,
    rule: {
      minAge: 18,
      occupations: ["Street Vendor", "Vendor", "Hawker", "Daily Wage Earner", "Self Employed"],
      states: ["All", "Bihar"],
      isVerified: true,
      isComplete: true,
      hasUnsupportedCriteria: false,
      unsupportedCriteria: []
    }
  }
];

const outputPath = path.resolve(__dirname, 'all_bihar_schemes.json');
fs.writeFileSync(outputPath, JSON.stringify(biharSchemes, null, 2), 'utf8');
console.log(`Successfully generated Master Bihar Schemes Dataset at ${outputPath}`);
console.log(`Total Schemes: ${biharSchemes.length}`);
console.log(`State Schemes: ${biharSchemes.filter(s => s.level === 'state').length}`);
console.log(`Central Schemes (applicable in Bihar): ${biharSchemes.filter(s => s.level === 'central').length}`);
