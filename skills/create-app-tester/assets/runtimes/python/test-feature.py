#!/usr/bin/env python3
"""Template for one feature or use case. Copy, rename, replace ENTRY_ID and steps."""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import lib

ENTRY_ID = "feat-example"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", default=None)
    parser.add_argument("--target", default=None)
    parser.add_argument("--allow-writes", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    run = args.run_id or lib.run_id()
    evidence = []

    try:
        if ENTRY_ID == "feat-example":
            raise lib.Blocked("template not filled in: replace ENTRY_ID and the steps")

        lib.require_target(ENTRY_ID, args.target, run)
        lib.require_env(ENTRY_ID, args.target, run)
        lib.require_write(ENTRY_ID, args.allow_writes, args.target, run)
        base = lib.base_url(args.target, run)

        # Example: HTTP surface.
        # status, body = lib.http("GET", f"{base}/notes.json")
        # lib.check(status == 200, f"expected 200, got {status}")
        # evidence.append(lib.save(run, ENTRY_ID, "notes.json", body))

        # Example: CLI surface.
        # proc = lib.sh("python3 app.py --list")
        # lib.check(proc.returncode == 0, f"exit {proc.returncode}: {proc.stderr}")
        # evidence.append(lib.save(run, ENTRY_ID, "list.txt", proc.stdout))

        lib.finish("PASS", ENTRY_ID, "verified", run, evidence, args.json)
    except lib.Skipped as err:
        lib.finish("SKIP", ENTRY_ID, str(err), run, evidence, args.json)
    except lib.Blocked as err:
        lib.finish("BLOCKED", ENTRY_ID, str(err), run, evidence, args.json)
    except AssertionError as err:
        lib.finish("FAIL", ENTRY_ID, str(err), run, evidence, args.json)
    finally:
        lib.cleanup(ENTRY_ID, run, args.target)


if __name__ == "__main__":
    main()
