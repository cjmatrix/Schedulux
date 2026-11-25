from __future__ import annotations

import os

from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

# Preserve local-dev .env loading without overriding Kubernetes/Doppler env vars.
_ENV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
)
load_dotenv(_ENV_PATH)

DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"
DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"


def _resolve_gemini_api_key() -> str:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""


def build_gemini_model(
    temperature: float = 0.2,
    max_tokens: int = 4096,
    default_model: str = DEFAULT_GEMINI_MODEL,
) -> ChatGoogleGenerativeAI | None:
    """Build a Gemini chat model when GEMINI_API_KEY or GOOGLE_API_KEY is configured."""
    gemini_api_key = _resolve_gemini_api_key()
    if not gemini_api_key:
        return None

    model_name = os.environ.get("GEMINI_MODEL") or default_model
    if "gemma" in model_name.lower():
        model_name = default_model

    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_api_key,
        temperature=temperature,
        max_output_tokens=max_tokens,
    )


def build_groq_model(
    temperature: float = 0.2,
    max_tokens: int = 4096,
    default_model: str = DEFAULT_GROQ_MODEL,
) -> ChatGroq | None:
    """Build a Groq chat model when GROQ_API_KEY is configured."""
    groq_api_key = os.environ.get("GROQ_API_KEY") or ""
    if not groq_api_key:
        return None

    groq_model = os.environ.get("GROQ_MODEL") or default_model
    return ChatGroq(
        model=groq_model,
        api_key=SecretStr(groq_api_key),
        temperature=temperature,
        max_tokens=max_tokens,
    )


def get_primary_chat_model(
    temperature: float = 0.2,
    max_tokens: int = 4096,
    default_gemini_model: str = DEFAULT_GEMINI_MODEL,
    default_groq_model: str = DEFAULT_GROQ_MODEL,
) -> BaseChatModel:
    """Return the primary LLM (Gemini first, then Groq, then OpenAI fallback)."""
    gemini = build_gemini_model(
        temperature=temperature,
        max_tokens=max_tokens,
        default_model=default_gemini_model,
    )
    if gemini is not None:
        return gemini

    groq = build_groq_model(
        temperature=temperature,
        max_tokens=max_tokens,
        default_model=default_groq_model,
    )
    if groq is not None:
        return groq

    return ChatOpenAI(model="gpt-4o-mini", temperature=temperature)


def get_fallback_chat_model(
    primary: BaseChatModel | None,
    temperature: float = 0.2,
    max_tokens: int = 4096,
    default_gemini_model: str = DEFAULT_GEMINI_MODEL,
    default_groq_model: str = DEFAULT_GROQ_MODEL,
) -> BaseChatModel | None:
    """Return the opposite provider's LLM when the primary model fails."""
    if not isinstance(primary, ChatGroq):
        groq = build_groq_model(
            temperature=temperature,
            max_tokens=max_tokens,
            default_model=default_groq_model,
        )
        if groq is not None:
            return groq

    if not isinstance(primary, ChatGoogleGenerativeAI):
        return build_gemini_model(
            temperature=temperature,
            max_tokens=max_tokens,
            default_model=default_gemini_model,
        )

    return None
