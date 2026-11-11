#!/usr/bin/env python3
"""Stop only the process group this run started. Keeps evidence. Idempotent."""
import argparse
import os
import signal
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import lib


def stop_group(pid):
    try:
        pgid = os.getpgid(pid)
    except OSError:
        return False
    try:
        os.killpg(pgid, signal.SIGTERM)
    except OSError:
        return False
    for _ in range(20):
        time.sleep(0.25)
        try:
            os.killpg(pgid, 0)
        except OSError:
            return True
    try:
        os.killpg(pgid, signal.SIGKILL)
    except OSError:
        pass
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", default=None)
    parser.add_argument("--target", default=None)
    args = parser.parse_args()

    data = lib.load_map()
    state = lib.read_state()
    run = args.run_id or state.get("run_id") or lib.run_id()
    try:
        target = lib.target_name(args.target, run, data)
    except lib.Blocked as err:
        lib.finish("BLOCKED", "teardown", str(err), run)

    stored_run = state.get("run_id")
    stored_target = state.get("target")
    if stored_run and stored_run != run:
        print(f"TEARDOWN skipped run-mismatch {run} (state run {stored_run})")
        return
    if stored_target and stored_target != target:
        print(f"TEARDOWN skipped target-mismatch {run} (state target {stored_target})")
        return

    cfg = lib.targets(data)[target]
    pid = state.get("pid")
    stopped = stop_group(pid) if pid else False

    kind = cfg.get("kind", "local")
    teardown = ""
    if kind == "local":
        teardown = (cfg.get("run", {}).get("teardown") or cfg.get("teardown") or "").strip()
    if teardown:
        proc = lib.sh(teardown, timeout=120)
        if proc.returncode != 0:
            print(proc.stderr[-2000:], file=sys.stderr)

    try:
        os.remove(lib.STATE_FILE)
    except FileNotFoundError:
        pass

    print(f"TEARDOWN {'stopped' if stopped else 'no-process'} {run} target={target} (evidence kept)")


if __name__ == "__main__":
    main()
