"""RNG trace/replay — the enabling tool for SoA verification rung 3.

The SoA rewrite (docs/SOA_REWRITE_PLAN.md) cannot keep the RNG *consumption
order* bit-identical — that's the one thing that must move. Rung 3 of the
verification ladder therefore separates "same physics" from "same randomness":
record every variate the reference implementation consumes, replay that exact
sequence into the candidate engine, and demand a bit-identical tick stream.
Any residual difference is then a physics bug, not RNG reordering.

No change to batch_a: wrap the four streams from outside and monkeypatch
`batch_a.sim.RNGStreams` (see tests/test_rng_trace.py for the pattern).

The recorded surface is exactly the sim's call surface (enumerated by grep,
guarded by test): random, integers, permutation, choice, normal, uniform.

    trace = record_run(config, seed)          # run + capture
    replay_run(config, seed, trace)           # run consuming the trace
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from batch_a.rng import RNGStreams, _STREAMS

METHODS = ("random", "integers", "permutation", "choice", "normal", "uniform")


def _pack(value):
    """Serialize a numpy scalar/array losslessly (dtype + shape + values)."""
    arr = np.asarray(value)
    return {"d": arr.dtype.str, "sh": list(arr.shape), "v": arr.tolist()}


def _unpack(rec):
    arr = np.array(rec["v"], dtype=np.dtype(rec["d"])).reshape(rec["sh"])
    if arr.shape == ():
        return arr[()]                        # numpy scalar, as Generators return
    return arr


class _Recording:
    """Wraps one numpy Generator; logs every draw, delegates faithfully."""

    def __init__(self, gen, stream, trace):
        self._gen = gen
        self._stream = stream
        self._trace = trace

    def __getattr__(self, name):
        if name not in METHODS:
            raise AttributeError(
                f"RNG method '{name}' not in the recorded surface {METHODS} — "
                f"extend rng_trace.METHODS (and the guard test) first.")
        real = getattr(self._gen, name)

        def wrapped(*args, **kwargs):
            out = real(*args, **kwargs)
            self._trace.append({"s": self._stream, "m": name, **_pack(out)})
            return out
        return wrapped


class _Replaying:
    """Feeds recorded draws back; validates stream+method agreement."""

    def __init__(self, stream, trace, cursor):
        self._stream = stream
        self._trace = trace
        self._cursor = cursor

    def __getattr__(self, name):
        if name not in METHODS:
            raise AttributeError(name)

        def wrapped(*args, **kwargs):
            i = self._cursor[0]
            if i >= len(self._trace):
                raise RuntimeError(
                    f"trace exhausted at draw {i} — candidate consumes MORE "
                    f"randomness than the reference (extra {self._stream}.{name})")
            rec = self._trace[i]
            if rec["s"] != self._stream or rec["m"] != name:
                raise RuntimeError(
                    f"draw {i} mismatch: reference consumed {rec['s']}.{rec['m']}, "
                    f"candidate asked for {self._stream}.{name} — consumption "
                    f"order diverged here.")
            self._cursor[0] = i + 1
            return _unpack(rec)
        return wrapped


class RecordingStreams(RNGStreams):
    def __init__(self, seed):
        super().__init__(seed)
        self.trace: list = []
        for name in _STREAMS:
            setattr(self, name, _Recording(getattr(self, name), name, self.trace))


class ReplayStreams(RNGStreams):
    def __init__(self, seed, trace):
        super().__init__(seed)               # streams built then discarded — replay only
        self.trace = trace
        self.cursor = [0]
        for name in _STREAMS:
            setattr(self, name, _Replaying(name, trace, self.cursor))

    def assert_exhausted(self):
        if self.cursor[0] != len(self.trace):
            raise RuntimeError(
                f"candidate consumed {self.cursor[0]}/{len(self.trace)} recorded "
                f"draws — it uses LESS randomness than the reference.")


def save_trace(trace, path):
    Path(path).write_text("\n".join(json.dumps(r) for r in trace))


def load_trace(path):
    return [json.loads(l) for l in Path(path).read_text().splitlines() if l.strip()]
