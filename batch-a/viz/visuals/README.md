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
