"""Simulation runner: build world, spawn founders, run the tick loop, report.

Initialization is the independent variable (§5): birthplace is a controlled,
logged condition, and the spawn RNG stream is separable from the environment
stream so the world can be held fixed while only spawns vary (or vice versa).
"""

from __future__ import annotations

import numpy as np

from . import __version__
from .agent.agent import Agent
from .agent.traits import founder_traits
from .config import Config, load_config
from .environment.world import World
from .logging.recorder import Recorder
from .metrics import AgentMetrics
from .rng import RNGStreams
from .scheduler import run_tick


def _spawn_tiles(world, config, rng_spawn, n):
    """Choose n founder tiles per the §5 spawn condition."""
    grid = world.endowment_grid().ravel()
    size = world.size
    mode = config.init.spawn_mode
    pct = float(config.init.endowment_percentile)

    if mode == "born_rich":
        thr = np.quantile(grid, pct)
        eligible = np.where(grid >= thr)[0]
    elif mode == "born_poor":
        thr = np.quantile(grid, 1.0 - pct)
        eligible = np.where(grid <= thr)[0]
    else:  # uniform
        eligible = np.arange(grid.size)

    if eligible.size == 0:
        eligible = np.arange(grid.size)
    flat = rng_spawn.choice(eligible, size=n, replace=True)
    return [(int(i % size), int(i // size)) for i in flat]


class Simulation:
    def __init__(self, config: Config, seed: int, run_id: str | None = None):
        self.config = config
        self.seed = int(seed)
        self.rng = RNGStreams(self.seed)
        self.world = World(config, self.rng.environment)
        self.run_id = run_id or f"{config.case}_seed{self.seed}"
        self.recorder = Recorder(config, self.seed, self.run_id, __version__)
        self.agents: list[Agent] = []

    def _spawn_founders(self):
        Agent.reset_ids()
        n = int(self.config.init.n_agents)
        endow_radius = int(self.config.init.endowment_radius)
        tiles = _spawn_tiles(self.world, self.config, self.rng.spawn, n)
        for (x, y) in tiles:
            traits = founder_traits(self.config.traits, self.rng.spawn)
            endowment = self.world.endowment_at(x, y, endow_radius)
            metrics = AgentMetrics(self.config, self.world, endowment)
            self.agents.append(
                Agent(self.config, self.world, x, y, traits, 0, metrics))

    def run(self):
        self._spawn_founders()
        max_ticks = int(self.config.run.max_ticks)
        stop_on_ext = bool(self.config.run.stop_on_extinction)

        peak_pop = len(self.agents)
        ticks_run = 0
        self.pop_series = []  # per-tick alive count (cheap; for diagnostics)
        for _ in range(max_ticks):
            alive = run_tick(self.world, self.agents, self.config, self.rng,
                             self.recorder)
            ticks_run += 1
            self.pop_series.append(alive)
            peak_pop = max(peak_pop, alive)
            if stop_on_ext and alive == 0:
                break

        # finalize survivors (§6 lifetime summary for those still alive)
        for a in self.agents:
            if a.alive:
                a.cause_of_death = None
                self.recorder.log_summary(a)

        results = self._results(ticks_run, peak_pop)
        out_dir = self.recorder.finalize(results)
        results["out_dir"] = str(out_dir)
        return results

    def _results(self, ticks_run, peak_pop) -> dict:
        alive = [a for a in self.agents if a.alive]
        births = sum(a.offspring_count for a in self.agents)
        survival_times = [a.metrics.ticks_alive for a in self.agents]
        causes: dict[str, int] = {}
        for a in self.agents:
            if a.alive:
                continue
            causes[a.cause_of_death] = causes.get(a.cause_of_death, 0) + 1
        return {
            "case": self.config.case,
            "seed": self.seed,
            "ticks_run": ticks_run,
            "founders": int(self.config.init.n_agents),
            "total_agents_ever": len(self.agents),
            "total_births": births,
            "peak_population": peak_pop,
            "final_population": len(alive),
            "extinct": len(alive) == 0,
            "median_survival_time": float(np.median(survival_times))
            if survival_times else 0.0,
            "mean_survival_time": float(np.mean(survival_times))
            if survival_times else 0.0,
            "deaths_by_cause": causes,
            "mean_exploration_survivors": float(
                np.mean([a.traits.exploration for a in alive])) if alive else None,
            "environment_hash": self.config.env_hash(),
        }


def run_case(config_name: str, seed: int, run_id: str | None = None) -> dict:
    """Convenience: load a config by name and run one seed."""
    config = load_config(config_name)
    return Simulation(config, seed, run_id).run()
