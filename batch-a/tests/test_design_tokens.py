"""V1 guard: the site's tokens.css must stay derived from design/tokens.json.

One palette source. If someone hand-edits tokens.css or changes tokens.json
without regenerating, this fails — naming the fix.
"""

from pathlib import Path

from design.build_css import OUT, render


def test_tokens_css_matches_tokens_json():
    assert OUT.exists(), "src/app/tokens.css missing — run: python -m design.build_css"
    assert OUT.read_text() == render(), (
        "src/app/tokens.css drifted from design/tokens.json — "
        "regenerate: (cd batch-a && python -m design.build_css)")


def test_globals_css_has_no_handwritten_palette():
    globals_css = Path(__file__).resolve().parents[2] / "src" / "app" / "globals.css"
    text = globals_css.read_text()
    assert '@import "./tokens.css"' in text
    # the palette variables must not be redefined by hand in globals.css
    for var in ("--ivory:", "--teal:", "--insurgent:", "--brass:", "--taupe:", "--mist:"):
        assert var not in text, f"{var} redefined in globals.css — tokens.css is the source"
