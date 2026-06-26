"""Agent: homeostatic state, perception, action registry, decision, learning,
heritable traits, and a memory stub.

Every seam here was chosen for Batch B (§10): needs are an extensible vector,
actions are a registry not an enum, weight computation sits behind one swappable
function, and memory.py is stubbed now so B's distorting memory plugs in cleanly.
"""
