"""
Migration Script: Clean and migrate None/null recall_interval_days to 0 in MongoDB.
Targets collections:
- agent_drafts (current_draft.services and checkpoints[].draft_snapshot.services)
- agent_runtime_configs (services)
"""

import os
import sys

from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(env_path)

mongo_uri = os.environ.get("MONGO_URI")
if not mongo_uri:
    print("ERROR: MONGO_URI not found in environment!")
    sys.exit(1)

client = MongoClient(mongo_uri)


def migrate_database(db_name: str):
    print("\n==========================================")
    print(f"Starting migration on database: {db_name}")
    print("==========================================")
    db = client[db_name]

    # 1. Migrate agent_drafts
    drafts_updated = 0
    services_fixed_in_drafts = 0
    checkpoints_fixed = 0

    cursor = db.agent_drafts.find({})
    for doc in cursor:
        doc_modified = False
        current_draft = doc.get("current_draft") or {}
        services = current_draft.get("services") or []

        for s in services:
            if isinstance(s, dict) and s.get("recall_interval_days") is None:
                s["recall_interval_days"] = 0
                services_fixed_in_drafts += 1
                doc_modified = True

        # Also inspect checkpoints
        for cp in doc.get("checkpoints") or []:
            snapshot = cp.get("draft_snapshot") or {}
            cp_services = snapshot.get("services") or []
            for s in cp_services:
                if isinstance(s, dict) and s.get("recall_interval_days") is None:
                    s["recall_interval_days"] = 0
                    checkpoints_fixed += 1
                    doc_modified = True

        if doc_modified:
            db.agent_drafts.replace_one({"_id": doc["_id"]}, doc)
            drafts_updated += 1
            print(f"  [agent_drafts] Updated draft for agent: {doc.get('agent_id')}")

    print(f"Results for {db_name}.agent_drafts:")
    print(f"  - Total drafts updated: {drafts_updated}")
    print(f"  - Services fixed in current_draft: {services_fixed_in_drafts}")
    print(f"  - Services fixed in checkpoints: {checkpoints_fixed}")

    # 2. Migrate agent_runtime_configs
    configs_updated = 0
    services_fixed_in_configs = 0

    cursor = db.agent_runtime_configs.find({})
    for doc in cursor:
        doc_modified = False
        services = doc.get("services") or []
        for s in services:
            if isinstance(s, dict) and s.get("recall_interval_days") is None:
                s["recall_interval_days"] = 0
                services_fixed_in_configs += 1
                doc_modified = True

        if doc_modified:
            db.agent_runtime_configs.replace_one({"_id": doc["_id"]}, doc)
            configs_updated += 1
            print(f"  [agent_runtime_configs] Updated config for agent: {doc.get('agent_id')}")

    print(f"Results for {db_name}.agent_runtime_configs:")
    print(f"  - Total configs updated: {configs_updated}")
    print(f"  - Services fixed in configs: {services_fixed_in_configs}")


def main():
    for db_name in ["schedulux_ai", "test"]:
        if db_name in client.list_database_names():
            migrate_database(db_name)
    print("\nMigration complete successfully!")


if __name__ == "__main__":
    main()
