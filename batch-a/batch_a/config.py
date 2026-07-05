"""Configuration loading, merging, and hashing (§8.2, §10).

Config is the single source of truth for every parameter. Files form an
inheritance chain: base.yaml <- case.yaml <- (optional ablation overlay), merged
deeply so each layer overrides only the deltas it names.

A ``Config`` is a thin dot-accessible view over the resolved dict, plus helpers
for the things logging needs: a stable environment hash and the full resolved
dict (so a stranger can rebuild the world from the log alone, §6).
"""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any

import yaml

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
BASE_CONFIG = "base.yaml"

# Keys whose values define the *world* (used for the reproducibility env hash).
# Agent learning/decision params are deliberately excluded: the same world can be
# probed by different agent configs and still be "the same environment" (§2).
_ENV_KEYS = ("world", "fields", "entities", "nonstationarity")


def _deep_merge(base: dict, override: dict) -> dict:
    """Recursively merge ``override`` onto a copy of ``base``."""
    out = copy.deepcopy(base)
    for key, val in override.items():
        if key in out and isinstance(out[key], dict) and isinstance(val, dict):
            out[key] = _deep_merge(out[key], val)
        else:
            out[key] = copy.deepcopy(val)
    return out


def _load_yaml(path: Path) -> dict:
    with open(path, "r") as fh:
        data = yaml.safe_load(fh) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Config {path} must be a mapping, got {type(data)}")
    return data


def _resolve(name: str, _seen: set[str] | None = None) -> dict:
    """Resolve a config file name into a fully merged dict.

    Resolution order: base.yaml is always the root. A file may declare
    ``extends: <other.yaml>`` to chain onto another config (relative to the
    config dir); otherwise it layers directly onto base.
    """
    _seen = _seen or set()
    if name in _seen:
        raise ValueError(f"Cyclic config inheritance via {name}")
    _seen.add(name)

    path = (CONFIG_DIR / name).resolve()
    if not path.exists():
        # allow callers to pass an absolute/relative path directly
        path = Path(name).resolve()
    raw = _load_yaml(path)

    parent_name = raw.pop("extends", None)
    if path.name == BASE_CONFIG:
        parent = {}
    elif parent_name:
        parent = _resolve(parent_name, _seen)
    else:
        parent = _resolve(BASE_CONFIG, _seen)

    return _deep_merge(parent, raw)


class Config:
    """Dot-accessible, read-only view over a resolved config dict."""

    def __init__(self, data: dict, source: str = "<dict>"):
        self._data = data
        self.source = source

    # -- access ------------------------------------------------------------
    def __getattr__(self, key: str) -> Any:
        try:
            val = self._data[key]
        except KeyError as exc:
            raise AttributeError(key) from exc
        return Config(val, self.source) if isinstance(val, dict) else val

    def __getitem__(self, key: str) -> Any:
        val = self._data[key]
        return Config(val, self.source) if isinstance(val, dict) else val

    def get(self, key: str, default: Any = None) -> Any:
        if key not in self._data:
            return default
        return self[key]

    def __contains__(self, key: str) -> bool:
        return key in self._data

    def to_dict(self) -> dict:
        return copy.deepcopy(self._data)

    # -- reproducibility ---------------------------------------------------
    def env_hash(self) -> str:
        """Stable hash over the world-defining sub-config (§6 environment hash)."""
        env = {k: self._data.get(k, {}) for k in _ENV_KEYS}
        blob = json.dumps(env, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(blob.encode()).hexdigest()[:16]

    def __repr__(self) -> str:  # pragma: no cover - cosmetic
        return f"Config(case={self._data.get('case')!r}, source={self.source!r})"


def load_config(name: str) -> Config:
    """Load and fully resolve a config by file name (e.g. 'a1.yaml')."""
    resolved = _resolve(name)
    return Config(resolved, source=name)
