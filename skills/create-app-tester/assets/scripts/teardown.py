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
    args = parser.parse_args()

    state = lib.read_state()
    run = args.run_id or state.get("run_id") or lib.run_id()
    pid = state.get("pid")
    stopped = stop_group(pid) if pid else False

    teardown = lib.load_map().get("run", {}).get("teardown", "").strip()
    if teardown:
        proc = lib.sh(teardown, timeout=120)
        if proc.returncode != 0:
            print(proc.stderr[-2000:], file=sys.stderr)

    try:
        os.remove(lib.STATE_FILE)
    except FileNotFoundError:
        pass

    print(f"TEARDOWN {'stopped' if stopped else 'no-process'} {run} (evidence kept)")


if __name__ == "__main__":
    main()
