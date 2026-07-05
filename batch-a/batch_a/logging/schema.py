"""Column schemas for the logged streams (§6).

Columns are derived from config so the need vector and trait set can grow (Batch
B) without touching the writer. Need columns are prefixed ``need_``, traits
``trait_``.
"""

from __future__ import annotations


def need_columns(config):
    return [f"need_{n}" for n in config.needs.to_dict().keys()]


def trait_columns(config):
    # Batch A's only trait is exploration; keep this list config-derived in spirit.
    return ["trait_exploration"]


def tick_columns(config):
    base = ["run_id", "seed", "tick", "agent_id", "x", "y", "action",
            "alive", "cause_of_death"]
    return base + need_columns(config) + trait_columns(config)


def summary_columns(config):
    base = ["run_id", "seed", "agent_id", "birth_tick", "cause_of_death",
            "offspring_count"]
    metric_cols = [
        "birthplace_endowment", "survival_time", "total_displacement",
        "mean_step_displacement", "fraction_stationary", "time_to_settle",
        "reached_good_tile", "over_exploration_distance",
    ]
    return base + trait_columns(config) + metric_cols
