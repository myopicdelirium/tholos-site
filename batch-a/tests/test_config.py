"""Config inheritance, deep-merge, and the environment hash (§8.2, §6)."""

from batch_a.config import load_config


def test_case_overrides_base():
    base = load_config("base.yaml")
    a2 = load_config("a2.yaml")
    # a2 enables reproduction; base does not
    assert base.reproduction.enabled is False
    assert a2.reproduction.enabled is True
    # untouched defaults survive the merge
    assert a2.world.size == base.world.size


def test_ablation_extends_chain():
    abl = load_config("ablations/a2_freeze_learning.yaml")
    assert abl.case == "a2_freeze_learning"
    assert abl.learning.enabled is False
    # inherits a2's reproduction + movement cost
    assert abl.reproduction.enabled is True
    assert abl.actions.move_cost_per_tile > 0


def test_env_hash_ignores_agent_params():
    """Same world, different learning config → same environment hash (§6)."""
    a = load_config("a1.yaml")
    d = a.to_dict()
    d["learning"]["alpha"] = 0.999  # an agent param, not a world param
    from batch_a.config import Config
    b = Config(d, "b")
    assert a.env_hash() == b.env_hash()


def test_env_hash_changes_with_world():
    a = load_config("a1.yaml")
    d = a.to_dict()
    d["world"]["size"] = 999
    from batch_a.config import Config
    b = Config(d, "b")
    assert a.env_hash() != b.env_hash()
