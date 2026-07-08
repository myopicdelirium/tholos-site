#!/bin/bash
# WO-3 full-20 grind, chained AFTER WO-2 so the two never contend for the single
# container's CPU. Idles (cheap poll) until WO-2 is fully checkpointed, then runs
# A3+A4 × 20 seeds with the same resume-loop + push-per-cell durability as WO-2.
# Relaunch after a container restart — `--check-complete` + the pushed checkpoints
# resume both work orders where they left off.
set -u
REPO=/home/user/tholos-site
PKG=$REPO/batch-a
OUT=docs/diagnostics/wo3_full20
CKPT=$PKG/$OUT/wo3_checkpoint.jsonl
BR=claude/urgent-task-4rrqi7

cd "$PKG"
# hold until WO-2 is done (do not split the CPU with the headline run)
until python -m experiments.wo2_a3_birthplace --seeds 0-19 --check-complete >/dev/null 2>&1; do
  sleep 60
done

commit_progress() {
  [ -f "$CKPT" ] || return 0
  n=$(wc -l < "$CKPT" | tr -d ' ')
  git -C "$REPO" add "batch-a/$OUT/" 2>/dev/null
  git -C "$REPO" diff --cached --quiet 2>/dev/null && return 0
  git -C "$REPO" commit -q -m "WO-3 grind: ${n}/40 cells checkpointed" 2>/dev/null
  for i in 1 2 3 4; do
    git -C "$REPO" push -q origin "$BR" 2>/dev/null && break
    sleep $((i * i))
  done
}

( while true; do sleep 300; commit_progress; done ) &
COMMITTER=$!
trap "kill $COMMITTER 2>/dev/null" EXIT

until python -m experiments.wo3_a4_mortality --seeds 0-19 --check-complete >/dev/null 2>&1; do
  python -m experiments.wo3_a4_mortality --seeds 0-19
  sleep 2
done

commit_progress
kill $COMMITTER 2>/dev/null
echo "WO-3 GRIND COMPLETE ($(wc -l < "$CKPT" | tr -d ' ')/40 cells)"
