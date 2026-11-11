import os
import sys
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

AI_SERVICES_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if AI_SERVICES_ROOT not in sys.path:
    sys.path.insert(0, AI_SERVICES_ROOT)

from app.api.v1.profile import extract_demographic_profile  # noqa: E402
from app.schemas.profile import ProfileExtractRequest  # noqa: E402
from app.services.profile_normalizer import (  # noqa: E402
    BIHAR_DISTRICTS,
    fallback_extract_profile,
    normalize_extracted_profile,
    parse_annual_income,
    sanitize_profile_input,
)


class ProfileNormalizerTests(unittest.TestCase):
    def test_sanitize_masks_aadhaar_and_pan(self):
        raw = "My Aadhaar is 1234 5678 9012 and PAN is ABCDE1234F, from Patna"
        sanitized, warning = sanitize_profile_input(raw)

        self.assertIn("[REDACTED_AADHAAR]", sanitized)
        self.assertIn("[REDACTED_PAN]", sanitized)
        self.assertNotIn("1234 5678 9012", sanitized)
        self.assertNotIn("ABCDE1234F", sanitized)
        self.assertIsNotNone(warning)

    def test_sanitize_clean_text_has_no_warning(self):
        sanitized, warning = sanitize_profile_input("  I am a 22 year old graduate from Gaya  ")
        self.assertEqual(sanitized, "I am a 22 year old graduate from Gaya")
        self.assertIsNone(warning)

    def test_parse_annual_income_variants(self):
        self.assertEqual(parse_annual_income("1.8 lakh"), 180000)
        self.assertEqual(parse_annual_income("₹95,000"), 95000)
        self.assertEqual(parse_annual_income("15000 per month"), 180000)
        self.assertEqual(parse_annual_income("25 hazar"), 25000)
        self.assertEqual(parse_annual_income("no income"), 0)
        self.assertIsNone(parse_annual_income(-500))

    def test_fallback_english_student_patna_undergraduate(self):
        text = "I am a 20 year old B.Tech EBC male student from Patna with annual family income 1.8 lakh"
        raw = fallback_extract_profile(text)
        profile = normalize_extracted_profile(raw, original_text=text)

        self.assertEqual(profile["age"], 20)
        self.assertEqual(profile["gender"], "Male")
        self.assertEqual(profile["state"], "Bihar")
        self.assertEqual(profile["district"], "Patna")
        self.assertEqual(profile["category"], "EBC")
        self.assertEqual(profile["occupation"], "Student")
        self.assertEqual(profile["education"], "Undergraduate")
        self.assertEqual(profile["annualIncome"], 180000)
        self.assertEqual(profile["missing_fields"], [])

    def test_fallback_hindi_farmer_gaya(self):
        text = "मैं गया से 38 वर्षीय किसान हूँ, अनुसूचित जाति, 10वीं पास, सालाना आय 95000 रुपये"
        raw = fallback_extract_profile(text)
        profile = normalize_extracted_profile(raw, original_text=text)

        self.assertEqual(profile["age"], 38)
        self.assertEqual(profile["state"], "Bihar")
        self.assertEqual(profile["district"], "Gaya")
        self.assertEqual(profile["occupation"], "Farmer")
        self.assertEqual(profile["category"], "SC")
        self.assertEqual(profile["education"], "10th Pass")
        self.assertEqual(profile["annualIncome"], 95000)

    def test_fallback_hindi_student_ebc(self):
        text = "मैं पटना से 20 वर्षीय बी.टेक ईबीसी छात्र हूँ, परिवार की सालाना आय 1.8 लाख रुपये है"
        raw = fallback_extract_profile(text)
        profile = normalize_extracted_profile(raw, original_text=text)

        self.assertEqual(profile["age"], 20)
        self.assertEqual(profile["district"], "Patna")
        self.assertEqual(profile["category"], "EBC")
        self.assertEqual(profile["occupation"], "Student")
        self.assertEqual(profile["education"], "Undergraduate")
        self.assertEqual(profile["annualIncome"], 180000)

    def test_district_aliases_map_to_canonical_bihar_districts(self):
        aliases = {
            "I live in Motihari": "East Champaran",
            "I am from Bettiah": "West Champaran",
            "resident of Chapra": "Saran",
            "from Arrah": "Bhojpur",
            "living in Sasaram": "Rohtas",
            "from Bhabua": "Kaimur",
            "home in Hajipur": "Vaishali",
            "Bihar Sharif": "Nalanda",
        }
        for phrase, expected in aliases.items():
            self.assertIn(expected, BIHAR_DISTRICTS)
            profile = normalize_extracted_profile({}, original_text=phrase)
            self.assertEqual(profile["district"], expected, msg=phrase)
            self.assertEqual(profile["state"], "Bihar", msg=phrase)

    def test_category_bc_ebc_obc_normalization(self):
        self.assertEqual(normalize_extracted_profile({"category": "BC-1"})["category"], "EBC")
        self.assertEqual(normalize_extracted_profile({"category": "BC-2"})["category"], "BC")
        self.assertEqual(normalize_extracted_profile({"category": "Other Backward Class"})["category"], "OBC")

    def test_non_bihar_state_sets_advisory_note(self):
        text = "I am a 25 year old farmer from Uttar Pradesh"
        profile = normalize_extracted_profile({"age": 25, "state": "UP"}, original_text=text)

        self.assertEqual(profile["state"], "Uttar Pradesh")
        self.assertIn("Bihar residents", profile["confidence_notes"])


class ProfileExtractEndpointTests(unittest.TestCase):
    def test_extract_endpoint_uses_llm_when_available(self):
        mocked_llm_payload = {
            "age": 26,
            "gender": "Female",
            "state": "Bihar",
            "district": "Muzaffarpur",
            "annualIncome": 300000,
            "occupation": "Self Employed",
            "education": "Graduate",
            "category": "OBC",
            "confidence_notes": "All key details extracted clearly.",
        }
        req = ProfileExtractRequest(
            text="26 year old female graduate from Muzaffarpur, OBC, self-employed with 3 lakh income",
            language="en",
        )
        with patch(
            "app.api.v1.profile.llm_service.generate_json",
            return_value=mocked_llm_payload,
        ):
            res = extract_demographic_profile(req)

        self.assertTrue(res.success)
        self.assertEqual(res.extraction_source, "llm")
        self.assertEqual(res.profile.district, "Muzaffarpur")
        self.assertEqual(res.profile.annualIncome, 300000)

    def test_extract_endpoint_falls_back_cleanly_on_llm_error(self):
        req = ProfileExtractRequest(
            text="38 year old farmer from Motihari, SC category, 10th pass, income 95000",
            language="en",
        )
        with patch(
            "app.api.v1.profile.llm_service.generate_json",
            return_value={"error": "429 quota exceeded"},
        ):
            res = extract_demographic_profile(req)

        self.assertTrue(res.success)
        self.assertEqual(res.extraction_source, "fallback")
        self.assertEqual(res.profile.district, "East Champaran")
        self.assertEqual(res.profile.occupation, "Farmer")
        self.assertEqual(res.profile.annualIncome, 95000)

    def test_extract_endpoint_unwraps_list_and_masks_sensitive_ids(self):
        req = ProfileExtractRequest(
            text="I am 22 from Patna Aadhaar 1234 5678 9012",
            language="en",
        )
        with patch(
            "app.api.v1.profile.llm_service.generate_json",
            return_value=[{"age": 22, "district": "Patna", "state": "Bihar"}],
        ) as mock_llm:
            res = extract_demographic_profile(req)
            called_prompt = mock_llm.call_args.kwargs["prompt"]
            self.assertNotIn("1234 5678 9012", called_prompt)
            self.assertIn("[REDACTED_AADHAAR]", called_prompt)

        self.assertTrue(res.success)
        self.assertEqual(res.profile.age, 22)
        self.assertIsNotNone(res.profile.privacy_warning)

    def test_extract_endpoint_rejects_too_short_input(self):
        with self.assertRaises(ValidationError):
            ProfileExtractRequest(text="hi")
        with self.assertRaises(HTTPException) as ctx:
            extract_demographic_profile(ProfileExtractRequest(text="   "))
        self.assertEqual(ctx.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()

