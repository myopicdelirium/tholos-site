# The Ideal Free Distribution — "Two identical worlds, one rule apart"

The controlled demonstration (`ifd.html`). Two worlds, same seed, same four
patches, same fixed flock of 44 immortal-but-hungry foragers, both with ideal
information. ONE line of the movement rule differs:

  * **greedy** walks to the most food;
  * **ideal-free** walks to the most food *per competitor* — `food / (1 + k·density)`.

The invisible hand has a falsifiable signature (Fretwell & Lucas 1970): if the
private per-capita rule coordinates the flock, occupancy tracks productivity and
the matching correlation climbs to 1; the greedy flock stays near chance. The
comparison can fail — and doesn't: ideal-free beats greedy on every seed 0–5
(greedy r̄ ≈ 0.47, ideal-free r̄ ≈ 0.90, near-perfect on four of six). Undermatching
(slope ≈ 0.4) is reported honestly, as in real feeder experiments.

Mechanism lives in the sim behind the `foraging.congestion` flag (default off, so
Batch A stays byte-identical — `tests/test_a_pinned`): the per-capita step is
`World.best_food_per_capita_step`, re-aiming the energy cue in `decision.py`.

    python -m experiments.coordination_compare --seed 0   # → public/runs/ifd_compare.json
    python -m viz.build_ifd_visual                          # → viz/visuals/ifd.build.html (data inlined)

`ifd.html` is the template (`/*__DATA__*/ null` is the data placeholder);
`ifd.build.html` is the self-contained, viewable build. Design: warm-paper
scientific plate (site tokens — ivory/ink/teal/rust), a live two-world diptych,
the matching-correlation race chart, per-patch fair-share bars, and an event
ledger. Light/dark themed. No coordinator anywhere.

---

# Coordination visual — "The Invisible Hand, Watched"

Self-contained HTML: a scrubbable observation plate + live event ledger of the
C1 coordination run (26 foragers → sustained communities over 2,400 ticks).

`coordination.html` is the template; `/*__DATA__*/` is the data placeholder.
Build the standalone file:

    python -m experiments.coordination_export --seed 3 --cap 110   # → public/runs/coordination.json
    python - <<'PY'
    from pathlib import Path
    tpl = Path("batch-a/viz/visuals/coordination.html").read_text()
    data = Path("public/runs/coordination.json").read_text()
    Path("coordination_final.html").write_text(tpl.replace("/*__DATA__*/", data))
    PY

Design: warm-paper lab notebook chrome, a dark observation plate (patches as
luminous teal pools, foragers as warm dots reddening under stress, death flashes),
mono-forward instrument type with one serif line of meaning. Light/dark themed;
the plate stays dark by commitment. Deterministic run, no coordinator anywhere.
