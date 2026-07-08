#!/bin/bash
# In-container WO-2 full-20 grind: resume-loop + periodic push so progress survives
# container restarts. The runner checkpoints per (condition, ablation, seed) cell into
# a TRACKED dir; this script pushes that checkpoint every ~5 min. On restart, relaunch
# this script — `--check-complete` + the pushed checkpoint resume where it left off.
set -u
REPO=/home/user/tholos-site
PKG=$REPO/batch-a
OUT=docs/diagnostics/wo2_full20
CKPT=$PKG/$OUT/wo2_checkpoint.jsonl
BR=claude/urgent-task-4rrqi7

commit_progress() {
  [ -f "$CKPT" ] || return 0
  n=$(wc -l < "$CKPT" | tr -d ' ')
  git -C "$REPO" add "batch-a/$OUT/" 2>/dev/null
  git -C "$REPO" diff --cached --quiet 2>/dev/null && return 0
  git -C "$REPO" commit -q -m "WO-2 grind: ${n}/180 cells checkpointed" 2>/dev/null
  for i in 1 2 3 4; do
    git -C "$REPO" push -q origin "$BR" 2>/dev/null && break
    sleep $((i * i))
  done
}

( while true; do sleep 300; commit_progress; done ) &
COMMITTER=$!
trap "kill $COMMITTER 2>/dev/null" EXIT

cd "$PKG"
until python -m experiments.wo2_a3_birthplace --seeds 0-19 --check-complete >/dev/null 2>&1; do
  python -m experiments.wo2_a3_birthplace --seeds 0-19
  sleep 2
done

commit_progress
kill $COMMITTER 2>/dev/null
echo "WO-2 GRIND COMPLETE ($(wc -l < "$CKPT" | tr -d ' ')/180 cells)"
