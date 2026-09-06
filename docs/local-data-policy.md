# Application source and local data

Application source contains reusable components, configuration schemas, and runtime adapters. Tenant identities, project records, credentials, run evidence, and measured telemetry belong in the configured database or artifact storage.

`.local-data/legacy-demo/` contains quarantined legacy demonstration implementations and scenarios. It is ignored by Git and must never be imported by application source. It is retained locally for review, not installed as a runtime fallback.

`storage/`, local database files (`*.db`, SQLite files and sidecars), backups, MLflow artifacts, generated builds, and Python bytecode are ignored. Existing local runtime storage is preserved at its configured location to avoid changing active deployments. Use environment variables to point services at external storage when deploying.

Schema definitions remain versioned, including `backend/database/schema.sql`. System role seed data is explicit and contains no users, organizations, projects, or activity. Run it only with `python -m backend.database.seed_data --apply`.

Provider adapters require a real endpoint and configured read-only operation metadata. Missing configuration returns unavailable/error results. Unsupported native transports require a registered implementation; a generic HTTP adapter does not implement SQL, SSH, or MCP protocols.

Git ignore rules prevent new data from being added by normal staging. They do not erase previously published history or prevent `git add --force`. Python bytecode previously tracked by this repository has been removed from the index while preserving local files.
