#!/bin/bash
# B1 pilot sweep grind: resume-loop + push-per-cycle (same pattern as WO-2/WO-3).
# Relaunch after container restarts; the pushed checkpoint resumes it.
set -u
REPO=/home/user/tholos-site
PKG=$REPO/batch-a
OUT=docs/diagnostics/b1_pilot
CKPT=$PKG/$OUT/b1_checkpoint.jsonl
BR=claude/urgent-task-4rrqi7

commit_progress() {
  [ -f "$CKPT" ] || return 0
  n=$(wc -l < "$CKPT" | tr -d ' ')
  git -C "$REPO" add "batch-a/$OUT/" 2>/dev/null
  git -C "$REPO" diff --cached --quiet 2>/dev/null && return 0
  git -C "$REPO" commit -q -m "B1 grind: ${n}/104 cells checkpointed" 2>/dev/null
  for i in 1 2 3 4; do
    git -C "$REPO" push -q origin "$BR" 2>/dev/null && break
    sleep $((i * i))
  done
}

( while true; do sleep 300; commit_progress; done ) &
COMMITTER=$!
trap "kill $COMMITTER 2>/dev/null" EXIT

cd "$PKG"
until python -m experiments.b1_sweep --seeds 0-7 --check-complete >/dev/null 2>&1; do
  python -m experiments.b1_sweep --seeds 0-7
  sleep 2
done

commit_progress
kill $COMMITTER 2>/dev/null
echo "B1 GRIND COMPLETE ($(wc -l < "$CKPT" | tr -d ' ')/104 cells)"
