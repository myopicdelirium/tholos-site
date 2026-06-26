"""Structured logging (§6): the data you can't reconstruct if you didn't log it.

Three streams per run, keyed by seed/run_id:
  * per-tick per-agent  (position, state vector, action, alive, traits)
  * per-agent lifetime summary (birthplace, settling, survival, offspring, cause)
  * run metadata (seed, full resolved config, environment hash, code version)

CSV is always available (stdlib); Parquet is used when pandas is importable.
"""
