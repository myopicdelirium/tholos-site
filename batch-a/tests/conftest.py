"""Shared test fixtures. Tests live alongside the package; add repo root to path."""

import copy
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from batch_a.config import Config, load_config  # noqa: E402


def _fast(name, **overrides):
    """A case config shrunk for fast tests."""
    d = load_config(name).to_dict()
    d["run"]["max_ticks"] = overrides.pop("max_ticks", 120)
    d["world"]["size"] = overrides.pop("size", 32)
    if "n_agents" in overrides:
        d["init"]["n_agents"] = overrides.pop("n_agents")
    d["logging"]["per_tick"] = overrides.pop("per_tick", True)
    for k, v in overrides.items():
        d[k] = v
    return Config(d, f"fast:{name}")


@pytest.fixture
def fast_config():
    return _fast
