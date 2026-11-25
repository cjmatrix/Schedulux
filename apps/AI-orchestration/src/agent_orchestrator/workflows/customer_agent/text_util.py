from __future__ import annotations

import ast
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


def extract_text_content(content: Any) -> str:

    if not content:
        return ""

    if hasattr(content, "content") and not isinstance(content, (str, list, dict)):
        return extract_text_content(content.content)

    if isinstance(content, str):
        content_str = content.strip()

        if content_str.startswith("[{") and ("'text':" in content_str or '"text":' in content_str):
            try:
                parsed = ast.literal_eval(content_str)
                if isinstance(parsed, list):
                    return extract_text_content(parsed)
            except Exception:
                pass
            try:
                parsed = json.loads(content_str)
                if isinstance(parsed, list):
                    return extract_text_content(parsed)
            except Exception:
                pass
        return content_str

    if isinstance(content, list):
        text_parts: list[str] = []
        for part in content:
            if not part:
                continue
            if isinstance(part, str):
                cleaned = extract_text_content(part)
                if cleaned:
                    text_parts.append(cleaned)
            elif isinstance(part, dict):
                if part.get("text"):
                    cleaned = extract_text_content(part["text"])
                    if cleaned:
                        text_parts.append(cleaned)
                elif part.get("content"):
                    cleaned = extract_text_content(part["content"])
                    if cleaned:
                        text_parts.append(cleaned)
            elif hasattr(part, "text") and part.text:
                cleaned = extract_text_content(part.text)
                if cleaned:
                    text_parts.append(cleaned)
            elif hasattr(part, "content") and part.content:
                cleaned = extract_text_content(part.content)
                if cleaned:
                    text_parts.append(cleaned)
        if text_parts:
            return "\n\n".join(text_parts).strip()
        return ""

    if isinstance(content, dict):
        if content.get("text"):
            return extract_text_content(content["text"])
        if content.get("content"):
            return extract_text_content(content["content"])

    return str(content).strip()
