"""Upload a local JSON evaluation dataset to LangSmith as a native Dataset."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load env variables from root of AI-orchestration
_root = Path(__file__).resolve().parent.parent
load_dotenv(_root / ".env")

from langsmith import Client


def upload_dataset(
    json_path: str,
    dataset_name: str,
    description: str = "RAG evaluation golden dataset for sandbox testing",
) -> None:
    api_key = os.getenv("LANGCHAIN_API_KEY")
    if not api_key:
        print("[ERROR] LANGCHAIN_API_KEY is not set in your .env file.", file=sys.stderr)
        sys.exit(1)

    path = Path(json_path)
    if not path.exists():
        print(f"[ERROR] File not found: {json_path}", file=sys.stderr)
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("[ERROR] Dataset JSON must be a list of objects with 'question' and 'ground_truth'.", file=sys.stderr)
        sys.exit(1)

    client = Client()

    # Check if dataset already exists, or create new
    try:
        ds = client.read_dataset(dataset_name=dataset_name)
        print(f"[INFO] Found existing LangSmith dataset: '{dataset_name}' (id: {ds.id})")
    except Exception:
        ds = client.create_dataset(
            dataset_name=dataset_name,
            description=description,
        )
        print(f"[SUCCESS] Created new LangSmith dataset: '{dataset_name}' (id: {ds.id})")

    # Upload examples
    count = 0
    for item in data:
        q = item.get("question", "").strip()
        gt = item.get("ground_truth", "").strip()
        if not q:
            continue

        client.create_example(
            inputs={"question": q},
            outputs={"ground_truth": gt} if gt else None,
            dataset_id=ds.id,
        )
        count += 1

    print(f"[SUCCESS] Uploaded {count} example(s) to LangSmith dataset '{dataset_name}'.")
    print(f"View in browser: https://smith.langchain.com/datasets/{ds.id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload evaluation dataset to LangSmith")
    parser.add_argument(
        "--file",
        "-f",
        default=str(Path(__file__).resolve().parent / "sample_dataset.json"),
        help="Path to JSON dataset file (default: evals/sample_dataset.json)",
    )
    parser.add_argument(
        "--dataset-name",
        "-d",
        required=True,
        help="Target LangSmith dataset name (e.g. 'sandbox-rag-eval')",
    )
    parser.add_argument(
        "--description",
        default="Golden Q&A dataset for RAG pipeline evaluation",
        help="Description for the LangSmith dataset",
    )
    args = parser.parse_args()

    upload_dataset(
        json_path=args.file,
        dataset_name=args.dataset_name,
        description=args.description,
    )


if __name__ == "__main__":
    main()
