"""Run recorder (§6): writes the three streams to runs/<run_id>/.

Insurance against "losing it": a run is reproducible from (code version, config,
seed) alone, and those three things are written into meta.json + config.yaml here.
"""

from __future__ import annotations

import csv
import json
import subprocess
from pathlib import Path

import yaml

from . import schema


def _git_commit() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "HEAD"], capture_output=True, text=True, timeout=5)
        return out.stdout.strip() or "unknown"
    except Exception:  # pragma: no cover - git may be absent
        return "unknown"


class Recorder:
    def __init__(self, config, seed, run_id, version):
        self.config = config
        self.seed = seed
        self.run_id = run_id
        self.version = version
        self.fmt = config.logging.format
        self.per_tick = bool(config.logging.per_tick)

        self.dir = Path(config.logging.out_dir) / run_id
        self.dir.mkdir(parents=True, exist_ok=True)

        self._tick_cols = schema.tick_columns(config)
        self._summary_cols = schema.summary_columns(config)
        self._tick_rows = []
        self._summary_rows = []
        self._env_series = []  # per-tick environment scalars

    # -- per-tick per-agent (§6) ------------------------------------------
    def log_tick(self, tick, agent):
        if not self.per_tick:
            return
        row = {
            "run_id": self.run_id, "seed": self.seed, "tick": tick,
            "agent_id": agent.id, "x": agent.x, "y": agent.y,
            "action": agent.last_action, "alive": int(agent.alive),
            "cause_of_death": agent.cause_of_death or "",
        }
        for name, val in agent.state.values().items():
            row[f"need_{name}"] = round(val, 5)
        row["trait_exploration"] = round(agent.traits.exploration, 5)
        self._tick_rows.append(row)

    def log_env(self, tick, env_summary):
        self._env_series.append({"tick": tick, **env_summary})

    # -- per-agent lifetime summary (§6) ----------------------------------
    def log_summary(self, agent):
        row = {
            "run_id": self.run_id, "seed": self.seed, "agent_id": agent.id,
            "birth_tick": agent.birth_tick,
            "cause_of_death": agent.cause_of_death or "survived",
            "offspring_count": agent.offspring_count,
            "trait_exploration": round(agent.traits.exploration, 5),
        }
        row.update(agent.metrics.summary())
        self._summary_rows.append(row)

    # -- finalize ----------------------------------------------------------
    def finalize(self, results: dict):
        self._write_table("ticks", self._tick_cols, self._tick_rows)
        self._write_table("summaries", self._summary_cols, self._summary_rows)
        self._write_table("environment", None, self._env_series)

        with open(self.dir / "config.yaml", "w") as fh:
            yaml.safe_dump(self.config.to_dict(), fh, sort_keys=False)

        meta = {
            "run_id": self.run_id,
            "seed": self.seed,
            "case": self.config.case,
            "code_version": self.version,
            "git_commit": _git_commit(),
            "environment_hash": self.config.env_hash(),
            "results": results,
        }
        with open(self.dir / "meta.json", "w") as fh:
            json.dump(meta, fh, indent=2)
        return self.dir

    def _write_table(self, name, columns, rows):
        if not rows:
            return
        cols = columns or list(rows[0].keys())
        if self.fmt == "parquet":
            try:
                import pandas as pd

                pd.DataFrame(rows, columns=cols).to_parquet(
                    self.dir / f"{name}.parquet", index=False)
                return
            except Exception:
                pass  # fall back to CSV if pandas/pyarrow unavailable
        with open(self.dir / f"{name}.csv", "w", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=cols)
            writer.writeheader()
            writer.writerows(rows)
