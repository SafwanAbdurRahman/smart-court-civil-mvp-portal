import json
import os
import re

import ollama

# ─── Model configuration ───────────────────────────────────────────────────────
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:12b")

_client = ollama.Client(host=OLLAMA_HOST)

EXTRACTION_PROMPT = """You are an expert Indian Legal AI Assistant specializing in processing and analyzing civil court documents.
Read the attached document and extract the key legal parameters.

The document may be written in English, Hindi (written in Devanagari script), or a bilingual combination of both.

Identify and extract the following parameters and return them as a single JSON object. Use null for any fields that are not mentioned, not applicable, or cannot be found:
1. caseType: The type of the civil suit/case (e.g., "Civil Suit (Permanent Injunction)", "Original Suit", "Title Suit", etc.)
2. jurisdiction: The court name, judge designation, and city/district where the matter is filed (e.g., "Civil Judge Jr. Div, Court 14, Barabanki")
3. tehsil: The tehsil or block name if mentioned (e.g., "Ramsanehighat")
4. plaintiff: The name of the plaintiff(s) / petitioner(s) (e.g., "Ram Karan")
5. defendant: The name of the defendant(s) / respondent(s) (e.g., "State of Uttar Pradesh")
6. plotNumbers: The disputed plot numbers or land identifiers, usually prefixed with "Gata No.", "Plot No.", "गाटा संख्या", or "खसरा संख्या" (e.g., "Gata/Plot No. 455")
7. valuation: The total property valuation of the suit in INR, formatted cleanly (e.g., "₹4,50,000 INR" or "Rs. 4,50,000")
8. civilCode: The recommended civil code sections or provisions cited or governing the suit (e.g., "Section 9 (CPC) - Suits of Civil Nature", "Order 39 Rule 1 & 2 CPC", etc.)

Your output must be a single flat JSON object matching this structure:
{
  "caseType": "...",
  "jurisdiction": "...",
  "tehsil": "...",
  "plaintiff": "...",
  "defendant": "...",
  "plotNumbers": "...",
  "valuation": "...",
  "civilCode": "..."
}
Do not include any markdown styling, comments, or extra text. Return only the raw JSON."""

EXTRACTION_FIELDS = (
    "caseType",
    "jurisdiction",
    "tehsil",
    "plaintiff",
    "defendant",
    "plotNumbers",
    "valuation",
    "civilCode",
)

_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


class ExtractionError(Exception):
    """Raised when the model response can't be turned into usable extraction data."""


def _coerce_extraction_json(raw_text: str) -> dict:
    """Local models don't have Gemini's response_mime_type guarantee, so this
    tolerates markdown fences, stray prose around the JSON, and partial output."""
    candidate = raw_text.strip()
    candidate = re.sub(r"^```(?:json)?", "", candidate.strip(), flags=re.IGNORECASE).strip()
    candidate = re.sub(r"```$", "", candidate).strip()

    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        match = _JSON_BLOCK_RE.search(candidate)
        if not match:
            raise ExtractionError(f"Model did not return valid JSON: {raw_text[:200]!r}")
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise ExtractionError(f"Model returned malformed JSON: {exc}") from exc

    if not isinstance(parsed, dict):
        raise ExtractionError("Model response was valid JSON but not an object.")

    return {field: parsed.get(field) for field in EXTRACTION_FIELDS}


def extract_fields_from_images(image_bytes_list: list[bytes]) -> dict:
    """Runs the vision extraction prompt against one or more page images and
    returns the flat {caseType, jurisdiction, ...} dict, or raises ExtractionError."""
    try:
        response = _client.chat(
            model=OLLAMA_MODEL,
            format="json",
            messages=[
                {
                    "role": "user",
                    "content": EXTRACTION_PROMPT,
                    "images": image_bytes_list,
                }
            ],
        )
    except Exception as exc:
        raise ExtractionError(f"Ollama request failed: {exc}") from exc

    content = response["message"]["content"]
    if not content or not content.strip():
        raise ExtractionError("Model returned an empty response.")

    return _coerce_extraction_json(content)


def ask_legal_chat(user_query: str, ctx: dict) -> str:
    """Answers a follow-up question about a previously extracted case file."""
    chat_prompt = f"""You are an expert Indian Legal AI Assistant. You are conversing with a user about a specific civil court document.
Here is the context extracted from the document:
- Case Type: {ctx.get('caseType')}
- Jurisdiction: {ctx.get('jurisdiction')}
- Tehsil: {ctx.get('tehsil')}
- Plaintiff: {ctx.get('plaintiff')}
- Defendant: {ctx.get('defendant')}
- Plot/Gata Numbers: {ctx.get('plotNumbers')}
- Valuation: {ctx.get('valuation')}
- Civil Code: {ctx.get('civilCode')}

Answer the user's query clearly, professionally, and concisely, using the context above. Keep the response factual. If a parameter is null or missing, state that it is not available in the document.

User Query: {user_query}"""

    try:
        response = _client.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": chat_prompt}],
        )
    except Exception as exc:
        raise ExtractionError(f"Ollama request failed: {exc}") from exc

    content = response["message"]["content"]
    return content.strip() if content else "I wasn't able to generate a response for that question."
