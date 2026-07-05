"""Batch A — agent-based ecological simulation (cases A1–A4).

The substrate for the lab: agents that survive a fixed ecology by optimizing
among competing physical needs, and survive it poorly enough (by A4) that the
humanistic mechanisms of Batch B have pressure to act on.

Design discipline (see docs/ODD.md, docs/PARAMETERS.md):
  * Config-driven, not constant-driven — every parameter lives in config/.
  * Deterministic — a run is fully reproducible from (code, config, seed).
  * Extensible — module seams chosen so Batch B drops in without rewrites.
"""

__version__ = "0.1.0"
