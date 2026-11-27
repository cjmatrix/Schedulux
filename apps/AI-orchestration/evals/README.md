# Schedulux RAG Pipeline Evaluation (Ragas + LangSmith)

This evaluation suite allows you to test and grade your multi-tenant RAG retrieval and answer quality against your **live LangGraph agent** and **Qdrant vector store** using **Ragas**.

## Key Features
- **Zero changes to production code**: Runs end-to-end through `process_customer_chat`.
- **Tenant-isolated**: Uses your test sandbox `tenant_id` and `agent_id` with real Qdrant hybrid search + Voyage reranking.
- **Judge LLM**: Automatically uses your existing Gemini (`gemini-1.5-flash`) from `.env` — no OpenAI key required.
- **Full Traceability**: All interactions are logged in your LangSmith project (`customer-agent`).
- **Comprehensive Metrics**:
  - `faithfulness`: Catches hallucinations (ensures answers are strictly grounded in retrieved document chunks).
  - `answer_relevancy`: Measures whether the response directly addresses the question asked.
  - `context_precision`: Evaluates whether the Voyage reranker placed the most relevant chunks at the top.
  - `context_recall`: Verifies whether the hybrid search retrieved all facts needed to answer.

---

## Quickstart

### 1. Set Sandbox IDs in `.env` (Optional but Recommended)
Add your sandbox tenant and agent IDs to `apps/AI-orchestration/.env`:

```env
EVAL_TENANT_ID=your_sandbox_tenant_id_here
EVAL_AGENT_ID=your_sandbox_agent_id_here
```

### 2. Update Test Questions
Edit `evals/sample_dataset.json` with questions and ground-truth answers specific to the PDF(s) uploaded to your sandbox tenant:

```json
[
  {
    "question": "What is your appointment cancellation and refund policy?",
    "ground_truth": "Appointments must be cancelled at least 24 hours in advance to receive a full refund."
  }
]
```

### 3. Run the Evaluation
If you set the IDs in `.env`, simply run:

```bash
cd apps/AI-orchestration
.venv/bin/python evals/evaluate_rag.py
```

Or pass them as CLI arguments:
```bash
.venv/bin/python evals/evaluate_rag.py --tenant-id "<TENANT_ID>" --agent-id "<AGENT_ID>"
```

#### Quick Dry-Run (e.g. 1 question only):
```bash
.venv/bin/python evals/evaluate_rag.py --limit 1
```

---

## (Optional) Using LangSmith Datasets

If you want to manage your dataset directly inside LangSmith UI:

### 1. Upload your JSON to LangSmith
```bash
.venv/bin/python evals/upload_to_langsmith.py --dataset-name "sandbox-rag-eval" --file evals/sample_dataset.json
```

### 2. Run Evaluation against the LangSmith Dataset
```bash
.venv/bin/python evals/evaluate_rag.py --tenant-id "<YOUR_TENANT_ID>" --agent-id "<YOUR_AGENT_ID>" --dataset "sandbox-rag-eval"
```

---

## Output Reports
Every evaluation run saves:
- **Terminal Summary**: Average scores per metric displayed in console.
- **JSON Report**: Saved to `evals/results/eval_run_<timestamp>.json`.
- **CSV Breakdown**: Saved to `evals/results/eval_run_<timestamp>.csv` with per-sample scores.
- **LangSmith Traces**: Visible on your LangSmith dashboard under project `customer-agent`.
