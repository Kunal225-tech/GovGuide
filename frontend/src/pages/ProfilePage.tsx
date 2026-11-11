import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  LogIn,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-react";
import { getProfile, updateProfile, AuthError } from "@/services/profileApi";
import type { UpdateProfilePayload, UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// ProfilePage
// Route: /profile
// ============================================================

interface FormFields {
  age: string;
  gender: string;
  state: string;
  district: string;
  annualIncome: string;
  occupation: string;
  education: string;
  category: string;
}

type PageState = "loading" | "fetch-error" | "auth-error" | "ready";
type SaveState = "idle" | "saving" | "saved" | "error";

type FormErrors = Partial<Record<keyof FormFields, string>>;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const STATE_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla", "Chittoor",
    "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna",
    "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore",
    "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa",
  ],
  "Arunachal Pradesh": [
    "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Itanagar", "Kamle",
    "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley",
    "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi",
    "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang",
  ],
  "Assam": [
    "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang",
    "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai",
    "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur",
    "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar",
    "Tinsukia", "Udalguri", "West Karbi Anglong",
  ],
  "Bihar": [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar",
    "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
    "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
    "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran",
  ],
  "Chhattisgarh": [
    "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada",
    "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham",
    "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh", "Mohla-Manpur",
    "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sarangarh-Bilaigarh", "Sakti",
    "Sukma", "Surajpur", "Surguja",
  ],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": [
    "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad",
    "Chhota Udaipur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar",
    "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari",
    "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
    "Tapi", "Vadodara", "Valsad",
  ],
  "Haryana": [
    "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar",
    "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal",
    "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar",
  ],
  "Himachal Pradesh": [
    "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti",
    "Mandi", "Shimla", "Sirmaur", "Solan", "Una",
  ],
  "Jharkhand": [
    "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih",
    "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga",
    "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum",
  ],
  "Karnataka": [
    "Bagalkote", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagara",
    "Chikkaballapura", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad",
    "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru",
    "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir",
  ],
  "Kerala": [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
    "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad",
  ],
  "Madhya Pradesh": [
    "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind",
    "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori",
    "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa",
    "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen",
    "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur",
    "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha",
  ],
  "Maharashtra": [
    "Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhaji Nagar", "Bhandara", "Beed", "Buldhana",
    "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
    "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik",
    "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
    "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
  ],
  "Manipur": [
    "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching",
    "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul",
  ],
  "Meghalaya": [
    "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills",
    "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills",
    "West Garo Hills", "West Jaintia Hills", "West Khasi Hills",
  ],
  "Mizoram": [
    "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei",
    "Mamit", "Saitual", "Serchhip", "Siaha",
  ],
  "Nagaland": [
    "Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon",
    "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto",
  ],
  "Odisha": [
    "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh",
    "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi",
    "Kandhamal", "Kendrapara", "Kendujhar", "Khurda", "Koraput", "Malkangiri", "Mayurbhanj",
    "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh",
  ],
  "Punjab": [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur",
    "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa",
    "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur",
    "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran",
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur",
    "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur", "Didwana-Kuchaman",
    "Dudu", "Dungarpur", "Gangapur City", "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore",
    "Jhalawar", "Jhunjhunu", "Jodhpur", "Jodhpur Rural", "Karauli", "Kekri", "Khairthal-Tijara",
    "Kota", "Kotputli-Behror", "Nagaur", "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand",
    "Salumbar", "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur",
  ],
  "Sikkim": ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
  "Tamil Nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul",
    "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai",
    "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
    "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni",
    "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur",
    "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",
  ],
  "Telangana": [
    "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial", "Jangaon",
    "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam",
    "Kumuram Bheem Asifabad", "Mahabubabad", "Mahbubnagar", "Mancherial", "Medak",
    "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal",
    "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet",
    "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri",
  ],
  "Tripura": [
    "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura",
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh",
    "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti",
    "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah",
    "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur",
    "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi",
    "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar",
    "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut",
    "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli",
    "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti",
    "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi",
  ],
  "Uttarakhand": [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital",
    "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi",
  ],
  "West Bengal": [
    "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling",
    "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda",
    "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur",
    "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur",
  ],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
    "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi",
  ],
  "Jammu and Kashmir": [
    "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua",
    "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi",
    "Samba", "Shopian", "Srinagar", "Udhampur",
  ],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
};

const GENDER_OPTIONS = ["Male", "Female", "Transgender", "Prefer not to say"];
const OCCUPATION_OPTIONS = [
  "Student", "Employed (Salaried)", "Self-Employed / Business",
  "Farmer", "Daily Wage Worker", "Unemployed", "Homemaker",
  "Retired", "Other",
];
const EDUCATION_OPTIONS = [
  "No formal education", "Primary (up to Class 5)",
  "Secondary (up to Class 10)", "Senior Secondary (Class 12)",
  "Diploma / ITI", "Undergraduate (Bachelor)", "Postgraduate (Master)",
  "Doctorate (PhD)", "Other",
];
const CATEGORY_OPTIONS = [
  "General", "OBC", "SC", "ST", "EWS", "Minority", "Other",
];

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatIndianCurrency(amountStr: string): string | null {
  if (!amountStr || amountStr.trim() === "") return null;
  const num = Number(amountStr);
  if (isNaN(num) || num < 0) return null;
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
  return `${formatted} / year`;
}

function profileToForm(p: UserProfile): FormFields {
  return {
    age: p.age !== undefined ? String(p.age) : "",
    gender: p.gender ?? "",
    state: p.state || "Bihar",
    district: p.district ?? "",
    annualIncome: p.annualIncome !== undefined ? String(p.annualIncome) : "",
    occupation: p.occupation ?? "",
    education: p.education ?? "",
    category: p.category ?? "",
  };
}

const EMPTY_FORM: FormFields = {
  age: "", gender: "", state: "", district: "",
  annualIncome: "", occupation: "", education: "", category: "",
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [fetchErrorMsg, setFetchErrorMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setPageState("loading");
    setFetchErrorMsg("");
    try {
      const user = await getProfile();
      updateUser(user);
      setUserName(user.name || "");
      setUserEmail(user.email || "");
      const formValues = profileToForm(user.profile ?? {});
      setForm(formValues);
      setInitialForm(formValues);
      setPageState("ready");
    } catch (err) {
      if (err instanceof AuthError) {
        setPageState("auth-error");
      } else {
        setFetchErrorMsg(err instanceof Error ? err.message : "Failed to load profile.");
        setPageState("fetch-error");
      }
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (saveState === "saved") setSaveState("idle");
  }

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextState = e.target.value;
    setForm((prev) => {
      // If switching state, check if current district belongs to the new state
      const nextDistricts = nextState ? STATE_DISTRICTS[nextState] || [] : [];
      const districtStillValid = nextDistricts.includes(prev.district);
      return {
        ...prev,
        state: nextState,
        district: districtStillValid ? prev.district : "",
      };
    });
    if (errors.state) {
      setErrors((prev) => ({ ...prev, state: undefined }));
    }
    if (saveState === "saved") setSaveState("idle");
  }

  function handleReset() {
    setForm(initialForm);
    setErrors({});
    if (saveState === "saved") setSaveState("idle");
  }

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  // Profile completion calculation across all 8 editable fields
  const completionPercentage = useMemo(() => {
    const fields: (keyof FormFields)[] = [
      "age", "gender", "category",
      "state", "district",
      "education", "occupation", "annualIncome",
    ];
    const completedCount = fields.filter((f) => Boolean(form[f]?.trim())).length;
    return Math.round((completedCount / fields.length) * 100);
  }, [form]);

  // District options for the currently selected State
  const districtOptions = useMemo(() => {
    if (!form.state || !STATE_DISTRICTS[form.state]) return [];
    const list = [...STATE_DISTRICTS[form.state]];
    // Retain existing custom or legacy district if already present in user profile
    if (form.district && !list.includes(form.district)) {
      list.unshift(form.district);
    }
    return list;
  }, [form.state, form.district]);

  const formattedIncomeText = useMemo(() => {
    return formatIndianCurrency(form.annualIncome);
  }, [form.annualIncome]);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (form.age) {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        newErrors.age = "Age must be a whole number between 1 and 120.";
      }
    }

    if (form.annualIncome) {
      const inc = Number(form.annualIncome);
      if (isNaN(inc) || inc < 0) {
        newErrors.annualIncome = "Annual income cannot be negative.";
      }
      if (inc > 100_000_000) {
        newErrors.annualIncome = "Please enter a realistic income value.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (saveState === "saving") return;

    setSaveState("saving");
    setSaveErrorMsg("");

    const payload: UpdateProfilePayload = {};
    if (form.age)          payload.age = Number(form.age);
    if (form.gender)       payload.gender = form.gender;
    if (form.state)        payload.state = form.state;
    if (form.district)     payload.district = form.district;
    if (form.annualIncome) payload.annualIncome = Number(form.annualIncome);
    if (form.occupation)   payload.occupation = form.occupation;
    if (form.education)    payload.education = form.education;
    if (form.category)     payload.category = form.category;

    try {
      const updated = await updateProfile(payload);
      updateUser(updated);
      const updatedForm = profileToForm(updated.profile ?? {});
      setForm(updatedForm);
      setInitialForm(updatedForm);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 4000);
    } catch (err) {
      setSaveErrorMsg(err instanceof Error ? err.message : "Failed to save profile.");
      setSaveState("error");
    }
  }

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <ProfileHeader loading />
        <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
          <div className="space-y-5 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-6 space-y-4">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded-md" />
                <div className="h-10 w-full bg-muted rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "auth-error") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ProfileHeader />
        <div className="max-w-3xl mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center text-center gap-5">
          <div className="p-5 rounded-md bg-primary/10 text-primary border border-primary/20">
            <LogIn className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy mb-2">{t('auth.login.title')}</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t('eligible.guestNoticeDesc')}
            </p>
          </div>
          <Button
            asChild
            className="rounded-md px-8 font-bold text-white bg-primary hover:bg-primary-hover shadow-none"
          >
            <Link to="/login">{t('auth.login.signIn')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (pageState === "fetch-error") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ProfileHeader />
        <div className="max-w-3xl mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-navy">{t('common.error')}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">{fetchErrorMsg}</p>
          <Button
            onClick={loadProfile}
            variant="outline"
            className="mt-2 flex items-center gap-2 rounded-md font-bold text-navy border-border"
          >
            <RefreshCcw className="w-4 h-4" />
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const userInitials = getInitials(userName);

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader />

      <div className="max-w-3xl mx-auto px-4 py-8 pb-16 space-y-6">

        {/* ---- User Identity Card ---- */}
        <Card className="p-5 border-border bg-card rounded-md shadow-none flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-md bg-stone-100 text-stone-800 dark:bg-[#292826] dark:text-[#F4F4F0] flex items-center justify-center font-bold text-base shrink-0 border border-stone-200 dark:border-[#3A3834]">
              {userInitials || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-navy dark:text-white truncate text-base leading-snug">
                {userName || "Citizen"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-800 dark:bg-[#292826] dark:text-[#F4F4F0] border border-stone-200 dark:border-[#3A3834]">
              <span
                className={`w-2 h-2 rounded-full ${
                  completionPercentage === 100
                    ? "bg-green-500"
                    : "bg-[#D95D39]"
                }`}
              />
              <span>
                {completionPercentage}% {t('profile.complete', 'Complete')}
              </span>
            </div>
            <div className="w-24 sm:w-28 h-1.5 bg-stone-200 dark:bg-[#292826] rounded-md overflow-hidden">
              <div
                className={`h-full rounded-md transition-all duration-300 ${
                  completionPercentage === 100
                    ? "bg-green-500"
                    : "bg-[#D95D39]"
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Save feedback banners */}
        {saveState === "saved" && (
          <div className="p-3.5 rounded-md bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/40 dark:text-green-400 flex items-center gap-2 text-sm font-medium shadow-none">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t('profile.savedSuccess')}
          </div>
        )}
        {saveState === "error" && saveErrorMsg && (
          <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-400 flex items-center gap-2 text-sm font-medium shadow-none">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {saveErrorMsg}
          </div>
        )}

        {/* The form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* ---- Card 1: Personal Information ---- */}
          <FormSection title={t('profile.personalInfo', 'Personal Information')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup
                id="profile-age"
                label={t('profile.age', 'Age (years)')}
                error={errors.age}
              >
                <Input
                  id="profile-age"
                  name="age"
                  type="number"
                  placeholder="e.g. 28"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={handleChange}
                  aria-invalid={!!errors.age}
                  className={`h-10 bg-background ${errors.age ? "border-red-500" : ""}`}
                />
              </FieldGroup>

              <FieldGroup
                id="profile-gender"
                label={t('profile.gender', 'Gender')}
                error={errors.gender}
              >
                <SelectInput
                  id="profile-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={GENDER_OPTIONS}
                  placeholder={t('profile.selectGender', 'Select gender')}
                  error={errors.gender}
                />
              </FieldGroup>
            </div>

            <FieldGroup
              id="profile-category"
              label={t('profile.casteCategory', 'Social Category')}
              error={errors.category}
            >
              <SelectInput
                id="profile-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                options={CATEGORY_OPTIONS}
                placeholder={t('profile.selectCategory', 'Select social category')}
                error={errors.category}
              />
            </FieldGroup>
          </FormSection>

          {/* ---- Card 2: Location & Residence ---- */}
          <FormSection title={t('profile.locationResidence', 'Location & Residence')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup
                id="profile-state"
                label={t('profile.state', 'State / UT')}
                error={errors.state}
              >
                <SelectInput
                  id="profile-state"
                  name="state"
                  value={form.state}
                  onChange={handleStateChange}
                  options={INDIAN_STATES}
                  placeholder={t('profile.selectStateOrUt', 'Select state or UT')}
                  error={errors.state}
                />
              </FieldGroup>

              <FieldGroup
                id="profile-district"
                label={t('profile.district', 'District')}
                hint={!form.state ? "Please select a state / UT first to choose your district." : undefined}
                error={errors.district}
              >
                <SelectInput
                  id="profile-district"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  disabled={!form.state}
                  options={districtOptions}
                  placeholder={
                    !form.state
                      ? t('profile.selectStateFirst', 'Select state first')
                      : t('profile.selectDistrict', 'Select district')
                  }
                  error={errors.district}
                />
              </FieldGroup>
            </div>
          </FormSection>

          {/* ---- Card 3: Education & Employment ---- */}
          <FormSection title={t('profile.educationEmployment', 'Education & Employment')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup
                id="profile-education"
                label={t('profile.highestEducation', 'Highest Education')}
                error={errors.education}
              >
                <SelectInput
                  id="profile-education"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  options={EDUCATION_OPTIONS}
                  placeholder={t('profile.selectEducation', 'Select education level')}
                  error={errors.education}
                />
              </FieldGroup>

              <FieldGroup
                id="profile-occupation"
                label={t('profile.employmentStatus', 'Employment Status')}
                error={errors.occupation}
              >
                <SelectInput
                  id="profile-occupation"
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  options={OCCUPATION_OPTIONS}
                  placeholder={t('profile.selectEmployment', 'Select employment status')}
                  error={errors.occupation}
                />
              </FieldGroup>
            </div>
          </FormSection>

          {/* ---- Card 4: Financial Details ---- */}
          <FormSection title={t('profile.financialDetails', 'Financial Details')}>
            <FieldGroup
              id="profile-income"
              label={t('profile.annualIncome', 'Annual Household Income (₹)')}
              hint={t('profile.incomeHint', 'Your total household income per year in Indian Rupees.')}
              error={errors.annualIncome}
            >
              <div className="relative rounded-md shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground font-semibold text-sm">
                  ₹
                </div>
                <Input
                  id="profile-income"
                  name="annualIncome"
                  type="number"
                  placeholder="e.g. 250000"
                  min={0}
                  value={form.annualIncome}
                  onChange={handleChange}
                  aria-invalid={!!errors.annualIncome}
                  className={`pl-8 h-10 bg-background ${errors.annualIncome ? "border-red-500" : ""}`}
                />
              </div>
              {formattedIncomeText && (
                <p className="text-xs text-stone-700 dark:text-stone-300 font-medium flex items-center gap-1 mt-1.5">
                  <span className="text-muted-foreground">
                    {t('profile.incomeFormatted', 'Formatted:')}
                  </span>
                  <span className="font-semibold">{formattedIncomeText}</span>
                </p>
              )}
            </FieldGroup>
          </FormSection>

          {/* ---- Action Button Bar ---- */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty || saveState === "saving"}
              className="w-full sm:w-auto px-5 py-2.5 rounded-md font-medium border-border text-navy dark:text-foreground hover:bg-surface-muted transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {t('profile.reset', 'Reset')}
            </Button>

            <Button
              type="submit"
              disabled={saveState === "saving"}
              className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] text-white font-medium rounded-md shadow-none flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saveState === "saving" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('profile.saveProfile', 'Save Profile')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileHeader({ loading = false }: { loading?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-border bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">
        <div className="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-stone-200 dark:border-[#3A3834] mb-3">
          {loading ? (
            <span className="h-3 w-16 bg-muted rounded animate-pulse inline-block" />
          ) : (
            t('nav.myProfile', 'My Profile')
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy mb-2 tracking-tight">
          {loading ? (
            <span className="h-8 w-48 bg-muted rounded animate-pulse inline-block" />
          ) : (
            t('profile.title', 'Citizen Profile')
          )}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
          {loading ? (
            <span className="h-4 w-72 bg-muted rounded animate-pulse inline-block" />
          ) : (
            t(
              'profile.subtitle',
              'Update your details to accurately check your eligibility for government schemes and benefits.'
            )
          )}
        </p>
      </div>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 border-border bg-card rounded-md space-y-4 shadow-none">
      <h2 className="text-xs font-bold text-navy dark:text-[#F4F4F0] uppercase tracking-wider border-b border-border/60 pb-3">
        {title}
      </h2>
      {children}
    </Card>
  );
}

function FieldGroup({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-navy dark:text-white">
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function SelectInput({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
}: {
  id: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-invalid={!!error}
      className={`flex h-10 w-full rounded-md border bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 ${
        error ? "border-red-500" : "border-input"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
