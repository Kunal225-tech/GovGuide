"""Sanitization, canonical normalization, and deterministic fallback parsing for citizen profile auto-fill."""

import re
from typing import Any, Dict, List, Optional, Tuple

BIHAR_DISTRICTS: List[str] = [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar",
    "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
    "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
    "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran",
]

DISTRICT_ALIASES: Dict[str, str] = {
    **{d.lower(): d for d in BIHAR_DISTRICTS},
    "motihari": "East Champaran",
    "purvi champaran": "East Champaran",
    "purba champaran": "East Champaran",
    "पूर्वी चंपारण": "East Champaran",
    "मोतिहारी": "East Champaran",
    "bettiah": "West Champaran",
    "pashchim champaran": "West Champaran",
    "paschim champaran": "West Champaran",
    "पश्चिम चंपारण": "West Champaran",
    "बेतिया": "West Champaran",
    "chapra": "Saran",
    "chhapra": "Saran",
    "छपरा": "Saran",
    "सारण": "Saran",
    "arrah": "Bhojpur",
    "ara": "Bhojpur",
    "आरा": "Bhojpur",
    "भोजपुर": "Bhojpur",
    "sasaram": "Rohtas",
    "सासाराम": "Rohtas",
    "रोहतास": "Rohtas",
    "bhabua": "Kaimur",
    "भभुआ": "Kaimur",
    "कैमूर": "Kaimur",
    "hajipur": "Vaishali",
    "हाजीपुर": "Vaishali",
    "वैशाली": "Vaishali",
    "bihar sharif": "Nalanda",
    "biharsharif": "Nalanda",
    "बिहार शरीफ": "Nalanda",
    "नालंदा": "Nalanda",
    "purnea": "Purnia",
    "पूर्णिया": "Purnia",
    "patna": "Patna",
    "पटना": "Patna",
    "gaya": "Gaya",
    "गया": "Gaya",
    "darbhanga": "Darbhanga",
    "दरभंगा": "Darbhanga",
    "muzaffarpur": "Muzaffarpur",
    "मुजफ्फरपुर": "Muzaffarpur",
    "मुज़फ़्फ़रपुर": "Muzaffarpur",
    "bhagalpur": "Bhagalpur",
    "भागलपुर": "Bhagalpur",
    "begusarai": "Begusarai",
    "बेगूसराय": "Begusarai",
    "samastipur": "Samastipur",
    "समस्तीपुर": "Samastipur",
    "siwan": "Siwan",
    "सीवान": "Siwan",
    "sitamarhi": "Sitamarhi",
    "सीतामढ़ी": "Sitamarhi",
    "madhubani": "Madhubani",
    "मधुबनी": "Madhubani",
    "katihar": "Katihar",
    "कटिहार": "Katihar",
    "munger": "Munger",
    "मुंगेर": "Munger",
    "buxar": "Buxar",
    "बक्सर": "Buxar",
    "nawada": "Nawada",
    "नवादा": "Nawada",
    "saharsa": "Saharsa",
    "सहरसा": "Saharsa",
    "supaul": "Supaul",
    "सुपौल": "Supaul",
    "madhepura": "Madhepura",
    "मधेपुरा": "Madhepura",
    "khagaria": "Khagaria",
    "खगड़िया": "Khagaria",
    "kishanganj": "Kishanganj",
    "किशनगंज": "Kishanganj",
    "araria": "Araria",
    "अररिया": "Araria",
    "arwal": "Arwal",
    "अरवल": "Arwal",
    "aurangabad": "Aurangabad",
    "औरंगाबाद": "Aurangabad",
    "banka": "Banka",
    "बांका": "Banka",
    "gopalganj": "Gopalganj",
    "गोपालगंज": "Gopalganj",
    "jamui": "Jamui",
    "जमुई": "Jamui",
    "jehanabad": "Jehanabad",
    "जहानाबाद": "Jehanabad",
    "lakhisarai": "Lakhisarai",
    "लखीसराय": "Lakhisarai",
    "sheikhpura": "Sheikhpura",
    "शेखपुरा": "Sheikhpura",
    "sheohar": "Sheohar",
    "शिवहर": "Sheohar",
}

CANONICAL_GENDERS: Dict[str, str] = {
    "male": "Male",
    "man": "Male",
    "boy": "Male",
    "m": "Male",
    "purush": "Male",
    "ladka": "Male",
    "पुरुष": "Male",
    "लड़का": "Male",
    "female": "Female",
    "woman": "Female",
    "girl": "Female",
    "f": "Female",
    "mahila": "Female",
    "ladki": "Female",
    "stri": "Female",
    "widow": "Female",
    "vidhwa": "Female",
    "महिला": "Female",
    "लड़की": "Female",
    "विधवा": "Female",
    "transgender": "Transgender",
    "trans": "Transgender",
    "third gender": "Transgender",
    "ट्रांसजेंडर": "Transgender",
    "prefer not to say": "Prefer not to say",
    "other": "Prefer not to say",
}

# Ordered most-specific first so partial keywords do not shadows specific options.
OCCUPATION_SYNONYMS: List[Tuple[str, Tuple[str, ...]]] = [
    ("Street Vendor", ("street vendor", "vendor", "hawker", "thela", "rehri", "रेहड़ी", "फेरी", "स्ट्रीट वेंडर")),
    ("Daily Wage Earner", ("daily wage", "wage earner", "labourer", "laborer", "majdoor", "mazdoor", "migrant worker", "मजदूर", "दिहाड़ी")),
    ("Job Seeker", ("job seeker", "looking for job", "seeking job", "naukri ki talash", "नौकरी की तलाश")),
    ("Unemployed", ("unemployed", "berozgar", "no job", "jobless", "बेरोजगार")),
    ("Employed (Salaried)", ("employed (salaried)", "salaried", "private job", "govt job", "government job", "sarkari naukri", "employee", "employed", "नौकरी")),
    ("Self Employed", ("self employed", "self-employed", "business owner", "entrepreneur", "shopkeeper", "trader", "artisan", "vyapar", "dukan", "svarozgar", "व्यवसाय", "दुकान", "स्वयं रोजगार", "स्वरोजगार", "उद्यमी")),
    ("Farmer", ("farmer", "agriculture", "kisan", "kheti", "krishi", "cultivator", "किसान", "खेती", "कृषि")),
    ("Driver", ("driver", "auto driver", "taxi driver", "e-rickshaw", "cab driver", "चालक", "ड्राइवर")),
    ("Homemaker", ("homemaker", "housewife", "grihini", "गृहिणी")),
    ("Retired", ("retired", "pensioner", "सेवानिवृत्त")),
    ("Student", ("student", "studying", "padhai", "chhatra", "vidyarthi", "छात्र", "छात्रा", "विद्यार्थी", "पढ़ाई")),
    ("Other", ("other",)),
]

EDUCATION_SYNONYMS: List[Tuple[str, Tuple[str, ...]]] = [
    ("Doctorate (PhD)", ("doctorate (phd)", "doctorate", "phd", "ph.d", "पीएचडी")),
    ("Post Graduate", ("post graduate", "postgraduate", "postgraduation", "masters", "master", "m.tech", "mtech", "m.sc", "msc", "m.a", "mca", "mba", "m.com", "mcom", "स्नातकोत्तर")),
    ("Undergraduate", ("undergraduate", "pursuing graduation", "pursuing b.tech", "pursuing btech", "pursuing ba", "pursuing bsc", "pursuing degree", "studying b.tech", "studying ba", "studying bsc", "college student")),
    ("Graduate", ("graduate", "graduation", "bachelor", "b.tech", "btech", "b.e", "b.sc", "bsc", "b.a", "b.com", "bcom", "bca", "bba", "mbbs", "llb", "snatak", "स्नातक", "बी.टेक", "बीटेक", "बी.एससी", "बी.ए", "बी.कॉम")),
    ("Polytechnic", ("polytechnic", "diploma", "पॉलिटेक्निक", "डिप्लोमा")),
    ("ITI", ("iti", "i.t.i", "आईटीआई")),
    ("12th Pass", ("12th pass", "12th", "class 12", "10+2", "intermediate", "inter pass", "senior secondary", "12वीं", "बारहवीं", "इंटर")),
    ("10th Pass", ("10th pass", "10th", "class 10", "matric", "matriculation", "secondary", "10वीं", "दसवीं", "मैट्रिक")),
    ("Primary (up to Class 5)", ("primary (up to class 5)", "primary", "class 5", "class 8", "8th pass", "5th pass", "8वीं", "5वीं", "पांचवीं")),
    ("No formal education", ("no formal education", "illiterate", "uneducated", "anpadh", "निरक्षर", "अनपढ़")),
    ("Other", ("other",)),
]

CATEGORY_SYNONYMS: List[Tuple[str, Tuple[str, ...]]] = [
    ("EBC", ("extremely backward", "ebc", "bc-1", "bc1", "bc 1", "ati pichhda", "अति पिछड़ा", "अत्यंत पिछड़ा", "ईबीसी")),
    ("OBC", ("other backward", "other backward class", "obc", "ओबीसी")),
    ("BC", ("backward class", "bc-2", "bc2", "bc 2", "bc", "पिछड़ा वर्ग", "बीसी")),
    ("EWS", ("economically weaker", "ews", "ईडब्ल्यूएस")),
    ("SC", ("scheduled caste", "sc category", "dalit", "अनुसूचित जाति", "एससी", "sc")),
    ("ST", ("scheduled tribe", "st category", "adivasi", "अनुसूचित जनजाति", "एसटी", "st")),
    ("Minority", ("minority", "alpsankhyak", "अल्पसंख्यक")),
    ("General", ("general", "unreserved", "ur", "samanya", "सामान्य")),
    ("Other", ("other",)),
]

NON_BIHAR_STATES: Dict[str, str] = {
    "uttar pradesh": "Uttar Pradesh",
    "u.p.": "Uttar Pradesh",
    "jharkhand": "Jharkhand",
    "west bengal": "West Bengal",
    "delhi": "Delhi",
    "maharashtra": "Maharashtra",
    "punjab": "Punjab",
    "haryana": "Haryana",
    "rajasthan": "Rajasthan",
    "madhya pradesh": "Madhya Pradesh",
    "karnataka": "Karnataka",
    "tamil nadu": "Tamil Nadu",
    "gujarat": "Gujarat",
    "odisha": "Odisha",
    "assam": "Assam",
}

ALL_PROFILE_FIELDS: List[str] = [
    "age",
    "gender",
    "category",
    "state",
    "district",
    "education",
    "occupation",
    "annualIncome",
]

AADHAAR_REGEX = re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b")
PAN_REGEX = re.compile(r"\b[A-Za-z]{5}\d{4}[A-Za-z]\b")


def sanitize_profile_input(text: str) -> Tuple[str, Optional[str]]:
    """Redact Aadhaar-like 12-digit numbers and PAN IDs before sending to an LLM."""
    sanitized = text.strip()
    found_sensitive = False

    if AADHAAR_REGEX.search(sanitized):
        sanitized = AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", sanitized)
        found_sensitive = True

    if PAN_REGEX.search(sanitized):
        sanitized = PAN_REGEX.sub("[REDACTED_PAN]", sanitized)
        found_sensitive = True

    warning = (
        "Sensitive identifiers (such as Aadhaar or PAN numbers) were automatically masked and are never saved. "
        "Please avoid sharing private credentials."
        if found_sensitive
        else None
    )
    return sanitized, warning


def _match_synonym(value: Any, rules: List[Tuple[str, Tuple[str, ...]]]) -> Optional[str]:
    if not value or not isinstance(value, str):
        return None
    norm = value.strip().lower()
    if not norm:
        return None

    for canonical, _ in rules:
        if norm == canonical.lower():
            return canonical

    for canonical, keywords in rules:
        for kw in keywords:
            if kw.isascii():
                if re.search(rf"(?<![a-z0-9]){re.escape(kw)}(?![a-z0-9])", norm):
                    return canonical
            elif kw in norm:
                return canonical
    return None


def _match_district(raw_district: Any, text_fallback: str = "") -> Optional[str]:
    candidates = []
    if isinstance(raw_district, str) and raw_district.strip():
        candidates.append(raw_district.strip().lower())
    if text_fallback:
        candidates.append(text_fallback.lower())

    for source in candidates:
        if source in DISTRICT_ALIASES:
            return DISTRICT_ALIASES[source]
        for alias, canonical in sorted(DISTRICT_ALIASES.items(), key=lambda x: -len(x[0])):
            if alias.isascii():
                if re.search(rf"(?<![a-z]){re.escape(alias)}(?![a-z])", source):
                    return canonical
            elif alias in source:
                return canonical
    return None


def parse_annual_income(raw_val: Any) -> Optional[float]:
    """Parse annual household income in INR; supports lakh, thousand/k, and monthly values."""
    if raw_val is None or isinstance(raw_val, bool):
        return None
    if isinstance(raw_val, (int, float)):
        num = float(raw_val)
        return round(num) if 0 <= num <= 100_000_000 else None

    if not isinstance(raw_val, str):
        return None

    text = raw_val.strip().lower().replace(",", "").replace("₹", "").replace("rs.", "").replace("rs", "")
    if not text:
        return None

    if any(tok in text for tok in ("no income", "zero income", "0 income", "koi aay nahi")):
        return 0

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|लाख|k|thousand|hazar|hazaar|हजार|crore|cr|करोड़)?",
        text,
    )
    if not match:
        return None

    num = float(match.group(1))
    unit = match.group(2) or ""
    if unit in ("lakh", "lakhs", "lac", "lacs", "लाख"):
        num *= 100_000
    elif unit in ("k", "thousand", "hazar", "hazaar", "हजार"):
        num *= 1_000
    elif unit in ("crore", "cr", "करोड़"):
        num *= 10_000_000

    if any(m in text for m in ("per month", "/month", "/mo", "monthly", "mahina", "mahine", "प्रतिमह", "महीना", "महीने")):
        num *= 12

    if 0 <= num <= 100_000_000:
        return round(num)
    return None


def _detect_non_bihar_state(raw_state: Any, text: str) -> Optional[str]:
    sources = []
    if isinstance(raw_state, str) and raw_state.strip():
        sources.append(raw_state.strip().lower())
    if text:
        sources.append(text.lower())

    for src in sources:
        if "bihar" in src or "बिहार" in src:
            return None
        for key, canonical in NON_BIHAR_STATES.items():
            if re.search(rf"(?<![a-z]){re.escape(key)}(?![a-z])", src):
                return canonical
    return None


def fallback_extract_profile(text: str) -> Dict[str, Any]:
    """Deterministic regex fallback extractor for English, Hindi, and Hinglish self-introductions."""
    lower = text.lower()
    result: Dict[str, Any] = {}

    # Age extraction ("21 years", "21 yrs", "21 saal", "age 21", "umar 62", "21 year old")
    age_patterns = [
        r"\b(?:age|umar|उम्र|आयु)\s*(?:is|hai|:|-)?\s*(\d{1,3})\b",
        r"\b(\d{1,3})\s*(?:years?\s*old|yrs?\s*old|years?|yrs?|saal|साल|वर्षीय|वर्ष)",
        r"\bi\s*am\s*(\d{1,3})\b",
    ]
    for pat in age_patterns:
        m = re.search(pat, lower)
        if m:
            age_val = int(m.group(1))
            if 1 <= age_val <= 120:
                result["age"] = age_val
                break

    # Gender extraction
    for kw, canonical in CANONICAL_GENDERS.items():
        if len(kw) <= 2:
            continue
        if kw.isascii():
            if re.search(rf"(?<![a-z]){re.escape(kw)}(?![a-z])", lower):
                result["gender"] = canonical
                break
        elif kw in lower:
            result["gender"] = canonical
            break

    # District extraction
    district = _match_district(None, text)
    if district:
        result["district"] = district

    # State extraction
    non_bihar = _detect_non_bihar_state(None, text)
    if non_bihar:
        result["state"] = non_bihar
    elif "bihar" in lower or "बिहार" in text or district:
        result["state"] = "Bihar"

    # Annual income extraction
    income_match = re.search(
        r"(?:income|aay|salary|earn|earning|kama|kamaai|आय|वेतन)?[^\d\n]{0,20}"
        r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|लाख|k|thousand|hazar|hazaar|हजार)"
        r"(?:\s*(?:per\s*month|monthly|/month|/mo|mahina|mahine|महीने|per\s*year|annual|yearly|salana))?|"
        r"(?:income|aay|salary|earn|earning|आय)[^\d\n]{0,18}(?:₹|rs\.?|inr)?\s*(\d[\d,]{3,})(?:\s*(?:per\s*month|monthly|/month|/mo|mahina|mahine))?",
        lower,
    )
    if income_match:
        parsed = parse_annual_income(income_match.group(0))
        if parsed is not None:
            result["annualIncome"] = parsed

    # Social category
    cat = _match_synonym(text, CATEGORY_SYNONYMS)
    if cat:
        result["category"] = cat

    # Occupation (check Farmer/Vendor/Daily Wage/Employed/Job Seeker/Student)
    occ = _match_synonym(text, OCCUPATION_SYNONYMS)
    if occ:
        result["occupation"] = occ

    # Education
    edu = _match_synonym(text, EDUCATION_SYNONYMS)
    if edu:
        result["education"] = edu

    result["confidence_notes"] = "Extracted using deterministic offline parser."
    return result


def normalize_extracted_profile(
    raw: Dict[str, Any],
    original_text: str = "",
    privacy_warning: Optional[str] = None,
) -> Dict[str, Any]:
    """Canonicalize extracted values to match GovGuide ProfilePage dropdowns and schemas."""
    notes: List[str] = []
    if privacy_warning:
        notes.append(privacy_warning)

    # Age
    age: Optional[int] = None
    raw_age = raw.get("age")
    if raw_age is not None and not isinstance(raw_age, bool):
        try:
            age_num = int(float(str(raw_age).strip()))
            if 1 <= age_num <= 120:
                age = age_num
        except (ValueError, TypeError):
            pass

    # Gender
    gender: Optional[str] = None
    raw_gender = raw.get("gender")
    if isinstance(raw_gender, str) and raw_gender.strip():
        g_norm = raw_gender.strip().lower()
        gender = CANONICAL_GENDERS.get(g_norm)
        if not gender:
            for k, v in CANONICAL_GENDERS.items():
                if k in g_norm:
                    gender = v
                    break

    # District (Bihar 38 districts)
    district = _match_district(raw.get("district"), original_text if not raw.get("district") else "")

    # State (Bihar-focused advisory if another state is detected)
    non_bihar = _detect_non_bihar_state(raw.get("state"), original_text)
    state: Optional[str] = None
    if non_bihar:
        state = non_bihar
        notes.append(
            f"Detected state '{non_bihar}'. GovGuide evaluates eligibility strictly for Bihar residents & Bihar-applicable Central schemes."
        )
    elif (
        isinstance(raw.get("state"), str)
        and ("bihar" in raw.get("state", "").lower() or "बिहार" in raw.get("state", ""))
    ) or district:
        state = "Bihar"

    # Income
    annual_income = parse_annual_income(raw.get("annualIncome"))

    # Occupation, Education, Category
    occupation = _match_synonym(raw.get("occupation"), OCCUPATION_SYNONYMS)
    education = _match_synonym(raw.get("education"), EDUCATION_SYNONYMS)
    category = _match_synonym(raw.get("category"), CATEGORY_SYNONYMS)

    # Disambiguate student pursuing a bachelor degree ("B.Tech student", "बी.टेक छात्र") -> Undergraduate
    lower_orig = original_text.lower()
    undergrad_hints = (
        "pursuing",
        "studying",
        "b.tech",
        "btech",
        "b.e",
        "b.sc",
        "bsc",
        "b.a",
        "b.com",
        "bcom",
        "bca",
        "bba",
        "बी.टेक",
        "बीटेक",
        "बी.एससी",
        "बी.ए",
    )
    if education == "Graduate" and occupation == "Student" and any(
        hint in lower_orig for hint in undergrad_hints
    ):
        education = "Undergraduate"

    if isinstance(raw.get("confidence_notes"), str) and raw["confidence_notes"].strip():
        llm_note = raw["confidence_notes"].strip()
        if llm_note not in notes:
            notes.append(llm_note)

    normalized: Dict[str, Any] = {
        "age": age,
        "gender": gender,
        "state": state,
        "district": district,
        "annualIncome": annual_income,
        "occupation": occupation,
        "education": education,
        "category": category,
        "confidence_notes": " ".join(notes) if notes else None,
        "privacy_warning": privacy_warning,
    }

    normalized["missing_fields"] = [
        f for f in ALL_PROFILE_FIELDS if normalized.get(f) is None
    ]
    return normalized
