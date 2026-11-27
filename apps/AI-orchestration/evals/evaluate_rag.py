"""
RAG Pipeline Evaluation using Ragas & LangSmith.

Evaluates multi-tenant RAG retrieval quality and answer generation
against your real LangGraph agent and Qdrant vector store.
Zero modifications required to production application code.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Ensure root AI-orchestration directory is in sys.path
_orchestration_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_orchestration_root / "src"))
sys.path.insert(0, str(_orchestration_root))
load_dotenv(_orchestration_root / ".env")

from langchain_core.embeddings import Embeddings
from langsmith import Client
from ragas import EvaluationDataset, evaluate
from ragas.dataset_schema import SingleTurnSample
from ragas.embeddings import LangchainEmbeddingsWrapper
from ragas.llms import LangchainLLMWrapper
from ragas.metrics._answer_relevance import AnswerRelevancy
from ragas.metrics._context_precision import ContextPrecision
from ragas.metrics._context_recall import ContextRecall
from ragas.metrics._faithfulness import Faithfulness


class VoyageLangChainEmbeddings(Embeddings):
    """LangChain-compatible wrapper for Voyage AI Embeddings used by Ragas."""

    def __init__(self, model: str = "voyage-4", api_key: str | None = None) -> None:
        import voyageai

        self.model = model
        self.client = voyageai.Client(api_key=api_key or os.getenv("VOYAGE_API_KEY", ""))

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        res = self.client.embed(texts, model=self.model, input_type="document")
        return [list(x) for x in res.embeddings]

    def embed_query(self, text: str) -> list[float]:
        if not text:
            return []
        res = self.client.embed([text], model=self.model, input_type="query")
        return list(res.embeddings[0])


def _setup_evaluator_llm_and_embeddings():
    """Initializes evaluator LLM and embedding models (prefers Voyage 4 for embeddings and Gemini for LLM)."""
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    voyage_key = os.getenv("VOYAGE_API_KEY")

    # 1. Setup Evaluator Embeddings (Prefers production Voyage 4 model)
    if voyage_key:
        voyage_model = os.getenv("VOYAGE_EMBEDDING_MODEL", "voyage-4")
        print(f"[Config] Evaluator Embeddings: Voyage AI ({voyage_model})")
        evaluator_embeddings = LangchainEmbeddingsWrapper(
            VoyageLangChainEmbeddings(model=voyage_model, api_key=voyage_key)
        )
    elif gemini_key:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        print("[Config] Evaluator Embeddings: Google Gemini (models/gemini-embedding-001)")
        evaluator_embeddings = LangchainEmbeddingsWrapper(
            GoogleGenerativeAIEmbeddings(
                model="models/gemini-embedding-001",
                google_api_key=gemini_key,
            )
        )
    elif openai_key:
        from langchain_openai import OpenAIEmbeddings

        print("[Config] Evaluator Embeddings: OpenAI (text-embedding-3-small)")
        evaluator_embeddings = LangchainEmbeddingsWrapper(
            OpenAIEmbeddings(model="text-embedding-3-small")
        )
    else:
        raise ValueError("No embedding API key found (VOYAGE_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY).")

    # 2. Setup Evaluator Judge LLM
    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        print(f"[Config] Evaluator Judge LLM: Google Gemini ({model_name})")
        evaluator_llm = LangchainLLMWrapper(
            ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=gemini_key,
                temperature=0.0,
            )
        )
    elif openai_key:
        from langchain_openai import ChatOpenAI

        print("[Config] Evaluator Judge LLM: OpenAI (gpt-4o-mini)")
        evaluator_llm = LangchainLLMWrapper(
            ChatOpenAI(model="gpt-4o-mini", temperature=0.0)
        )
    else:
        raise ValueError("Neither GEMINI_API_KEY nor OPENAI_API_KEY found in .env for evaluator LLM.")

    return evaluator_llm, evaluator_embeddings


def _load_questions(dataset_arg: str, limit: int | None = None) -> list[dict[str, str]]:
    """Loads questions from a local JSON file or LangSmith Dataset."""
    dataset_path = Path(dataset_arg)

    if dataset_path.exists() and dataset_path.is_file():
        print(f"[Dataset] Loading from local file: {dataset_path}")
        with open(dataset_path, "r", encoding="utf-8") as f:
            items = json.load(f)
        results = []
        for it in items:
            q = it.get("question") or it.get("input") or ""
            gt = it.get("ground_truth") or it.get("reference") or it.get("output") or ""
            if q.strip():
                results.append({"question": q.strip(), "ground_truth": gt.strip()})
    else:
        print(f"[Dataset] Pulling from LangSmith dataset: '{dataset_arg}'")
        client = Client()
        examples = client.list_examples(dataset_name=dataset_arg)
        results = []
        for ex in examples:
            q = (ex.inputs or {}).get("question", "")
            gt = (ex.outputs or {}).get("ground_truth", "") or (ex.outputs or {}).get("output", "")
            if q.strip():
                results.append({"question": q.strip(), "ground_truth": gt.strip()})

    if limit and limit > 0:
        results = results[:limit]

    print(f"[Dataset] Loaded {len(results)} question(s) for evaluation.")
    return results


async def run_evaluation(
    tenant_id: str,
    agent_id: str,
    dataset_source: str,
    limit: int | None = None,
    output_dir: str = "evals/results",
) -> None:
    # 1. Initialize MongoDB / Beanie models
    from agent_orchestrator.models import init_db

    print("[DB] Initializing database connections...")
    await init_db()

    # 2. Load dataset
    questions_data = _load_questions(dataset_source, limit=limit)
    if not questions_data:
        print("[ERROR] No valid questions found in dataset.")
        return

    # 3. Import chat processor & prepare tool interception
    from agent_orchestrator.mcp import scheduling_mcp_server
    from agent_orchestrator.workflows.customer_agent.agent import process_customer_chat

    # Store original mcp.call_tool to intercept search_knowledge_base output
    orig_call_tool = scheduling_mcp_server.mcp.call_tool
    current_run_chunks: list[str] = []

    async def intercepted_call_tool(tool_name: str, arguments: dict[str, Any] | None = None):
        res = await orig_call_tool(tool_name, arguments=arguments)
        if tool_name == "search_knowledge_base":
            try:
                # Result is either string or JSON-serializable
                text_content = res[0] if isinstance(res, tuple) else res
                if isinstance(text_content, list):
                    text_str = "".join([c.text for c in text_content if hasattr(c, "text")])
                else:
                    text_str = str(text_content)

                parsed = json.loads(text_str)
                if isinstance(parsed, dict) and "results" in parsed:
                    for item in parsed["results"]:
                        c = item.get("content", "").strip()
                        if c and c not in current_run_chunks:
                            current_run_chunks.append(c)
            except Exception as ex:
                print(f"[Warning] Failed to parse intercepted chunks: {ex}")
        return res

    # Apply the interception hook for evaluation
    scheduling_mcp_server.mcp.call_tool = intercepted_call_tool

    # 4. Run each test through the live agent pipeline
    samples: list[SingleTurnSample] = []
    eval_records: list[dict[str, Any]] = []

    print("\n" + "=" * 70)
    print(f"RUNNING RAG EVALUATION PIPELINE (Tenant: {tenant_id}, Agent: {agent_id})")
    print("=" * 70)

    try:
        for idx, item in enumerate(questions_data, start=1):
            q = item["question"]
            gt = item["ground_truth"]
            current_run_chunks.clear()

            session_id = f"eval_{uuid.uuid4().hex[:10]}"
            print(f"\n[{idx}/{len(questions_data)}] Query: {q}")

            chat_res = await process_customer_chat(
                tenant_id=tenant_id,
                agent_id=agent_id,
                session_id=session_id,
                message=q,
                mode="sandbox",
            )
            response_text = chat_res.get("response", "").strip()
            retrieved = list(current_run_chunks)

            print(f"  → Chunks Retrieved: {len(retrieved)}")
            print(f"  → Answer Length: {len(response_text)} chars")

            sample = SingleTurnSample(
                user_input=q,
                response=response_text,
                retrieved_contexts=retrieved if retrieved else ["No chunks retrieved."],
                reference=gt if gt else None,
            )
            samples.append(sample)

            eval_records.append(
                {
                    "question": q,
                    "ground_truth": gt,
                    "response": response_text,
                    "retrieved_contexts": retrieved,
                    "chunks_count": len(retrieved),
                }
            )
    finally:
        # Restore original tool function
        scheduling_mcp_server.mcp.call_tool = orig_call_tool

    # 5. Initialize Ragas evaluators
    evaluator_llm, evaluator_embeddings = _setup_evaluator_llm_and_embeddings()

    has_ground_truth = any(bool(r.get("ground_truth")) for r in eval_records)
    metrics = [
        Faithfulness(llm=evaluator_llm),
        AnswerRelevancy(llm=evaluator_llm, embeddings=evaluator_embeddings),
    ]

    if has_ground_truth:
        metrics.extend([
            ContextPrecision(llm=evaluator_llm),
            ContextRecall(llm=evaluator_llm),
        ])

    print("\n" + "-" * 70)
    print(f"Evaluating {len(samples)} sample(s) with Ragas metrics: {[m.name for m in metrics]}")
    print("-" * 70)

    eval_dataset = EvaluationDataset(samples=samples)
    scores = evaluate(dataset=eval_dataset, metrics=metrics)

    # 6. Display results
    print("\n" + "=" * 70)
    print("RAGAS EVALUATION RESULTS SUMMARY")
    print("=" * 70)
    if hasattr(scores, "_repr_dict") and isinstance(scores._repr_dict, dict):
        scores_dict = scores._repr_dict
    elif hasattr(scores, "scores") and isinstance(scores.scores, list) and len(scores.scores) > 0:
        scores_dict = {}
        for k in scores.scores[0].keys():
            vals = [d[k] for d in scores.scores if k in d and d[k] is not None]
            scores_dict[k] = sum(vals) / len(vals) if vals else 0.0
    elif isinstance(scores, dict):
        scores_dict = scores
    else:
        scores_dict = dict(scores)

    # Output formatted scores
    for metric_name, val in scores_dict.items():
        if isinstance(val, (int, float)):
            print(f"  {metric_name.ljust(25)}: {val:.4f}  ({val * 100:.1f}%)")
        else:
            print(f"  {metric_name.ljust(25)}: {val}")

    # 7. Save detailed outputs
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    json_path = out_dir / f"eval_run_{ts}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "timestamp": ts,
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "summary_scores": {k: float(v) if isinstance(v, (int, float)) else str(v) for k, v in scores_dict.items()},
                "records": eval_records,
            },
            f,
            indent=2,
            default=str,
        )

    # Export to pandas dataframe if available
    try:
        df = scores.to_pandas()
        csv_path = out_dir / f"eval_run_{ts}.csv"
        df.to_csv(csv_path, index=False)
        print(f"\n[Saved] Detailed CSV report: {csv_path}")
    except Exception:
        pass

    print(f"[Saved] Detailed JSON report: {json_path}")
    print("\nEvaluation completed successfully! All traces are logged in LangSmith project 'customer-agent'.")

    # 8. Clean up background connections
    try:
        from agent_orchestrator.adapters import kafka_token_producer as ktp
        if ktp._default_publisher is not None and hasattr(ktp._default_publisher, "stop"):
            await ktp._default_publisher.stop()
    except Exception:
        pass

    try:
        from agent_orchestrator.models.db import get_mongo_client
        mongo_client = get_mongo_client()
        if mongo_client:
            await mongo_client.close()
    except Exception:
        pass


def main() -> None:
    default_tenant = os.getenv("EVAL_TENANT_ID")
    default_agent = os.getenv("EVAL_AGENT_ID")

    parser = argparse.ArgumentParser(description="Evaluate Schedulux RAG pipeline using Ragas & LangSmith")
    parser.add_argument(
        "--tenant-id",
        "-t",
        default=default_tenant,
        required=not bool(default_tenant),
        help="Sandbox tenant ID (defaults to EVAL_TENANT_ID from .env)",
    )
    parser.add_argument(
        "--agent-id",
        "-a",
        default=default_agent,
        required=not bool(default_agent),
        help="Sandbox agent ID (defaults to EVAL_AGENT_ID from .env)",
    )
    parser.add_argument(
        "--dataset",
        "-d",
        default="evals/sample_dataset.json",
        help="Path to JSON dataset or LangSmith dataset name (default: evals/sample_dataset.json)",
    )
    parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=None,
        help="Optional limit on number of questions to evaluate (useful for quick testing)",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        default="evals/results",
        help="Directory to save evaluation reports (default: evals/results)",
    )

    args = parser.parse_args()

    if not args.tenant_id:
        print("[ERROR] Please provide --tenant-id or set EVAL_TENANT_ID in your .env file.", file=sys.stderr)
        sys.exit(1)
    if not args.agent_id:
        print("[ERROR] Please provide --agent-id or set EVAL_AGENT_ID in your .env file.", file=sys.stderr)
        sys.exit(1)

    asyncio.run(
        run_evaluation(
            tenant_id=args.tenant_id,
            agent_id=args.agent_id,
            dataset_source=args.dataset,
            limit=args.limit,
            output_dir=args.output_dir,
        )
    )


if __name__ == "__main__":
    main()
