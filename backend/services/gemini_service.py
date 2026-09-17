import json
import logging
import re
from typing import Dict, Any, Optional
from backend.config import config

logger = logging.getLogger("rescuegrid.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = config.GEMINI_API_KEY
        self.client = None
        self.is_available = False
        self._init_client()

    def _init_client(self):
        if self.api_key and not self.api_key.startswith("your_") and len(self.api_key) > 10:
            try:
                # Try google.genai or google.generativeai
                try:
                    from google import genai
                    self.client = genai.Client(api_key=self.api_key)
                    self.is_available = True
                    self.sdk_type = "genai"
                    logger.info("Initialized Google GenAI client.")
                except Exception:
                    import google.generativeai as genai_legacy
                    genai_legacy.configure(api_key=self.api_key)
                    self.client = genai_legacy.GenerativeModel('gemini-2.5-flash')
                    self.is_available = True
                    self.sdk_type = "generativeai"
                    logger.info("Initialized Google GenerativeAI legacy client.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}. Will use intelligent deterministic fallback.")
                self.is_available = False
        else:
            logger.info("No active Gemini API key configured. Using high-fidelity emergency domain fallback engine.")
            self.is_available = False

    async def generate_structured(
        self,
        prompt: str,
        system_instruction: str,
        fallback_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Call Gemini with JSON output format.
        Falls back seamlessly to domain-specific structured responses if API fails or quota exceeded.
        """
        if not self.is_available or self.client is None:
            return fallback_data

        try:
            full_prompt = f"{system_instruction}\n\nYou must return ONLY a valid JSON object matching the requested schema.\n\nTask:\n{prompt}"
            
            candidate_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"]
            text = None

            for model_name in candidate_models:
                try:
                    if hasattr(self, "sdk_type") and self.sdk_type == "genai":
                        response = self.client.models.generate_content(
                            model=model_name,
                            contents=full_prompt,
                        )
                        text = response.text
                    else:
                        import google.generativeai as genai_legacy
                        model = genai_legacy.GenerativeModel(model_name)
                        response = model.generate_content(full_prompt)
                        text = response.text
                    if text:
                        break
                except Exception as model_err:
                    err_str = str(model_err)
                    logger.warning(f"Model {model_name} attempt: {err_str}")
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        # Free-tier rate limit or quota exceeded: immediately use intelligent domain fallback
                        logger.info("Gemini rate limit reached; employing instant deterministic domain fallback.")
                        return fallback_data
                    continue

            if not text:
                return fallback_data

            # Parse JSON from response
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            return parsed
        except Exception as e:
            logger.warning(f"Gemini generation error: {e}. Returning robust domain fallback.")
            return fallback_data

gemini_service = GeminiService()
