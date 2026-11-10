#!/usr/bin/env python3
"""Start the app for one run. Idempotent. Prints READY when usable."""
import argparse
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import lib


def ready_probe(config):
    if isinstance(config, str):
        config = {"url": config}
    timeout = config.get("timeout", 60)
    if config.get("url"):
        expect = config.get("expect", 200)

        def probe():
            status, _ = lib.http("GET", config["url"])
            return status == expect

        lib.wait_for(probe, timeout=timeout, label=config["url"])
        return config["url"]
    if config.get("cmd"):
        lib.wait_for(
            lambda: lib.sh(config["cmd"], timeout=timeout).returncode == 0,
            timeout=timeout,
            label=config["cmd"],
        )
        return config["cmd"]
    return ""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", default=None)
    parser.add_argument("--fresh", action="store_true")
    args = parser.parse_args()

    data = lib.load_map()
    run = args.run_id or lib.run_id()
    config = data.get("run", {})
    setup = config.get("setup", "").strip()
    if not setup:
        lib.finish("BLOCKED", "setup", "map.json run.setup is empty", run)

    os.makedirs(lib.RUNTIME_DIR, exist_ok=True)
    log_path = os.path.join(lib.RUNTIME_DIR, f"setup-{run}.log")
    env = dict(os.environ)
    env["APP_TEST_RUN_ID"] = run
    env["APP_TEST_FRESH"] = "1" if args.fresh else "0"

    with open(log_path, "ab") as log:
        proc = subprocess.Popen(
            setup,
            shell=True,
            cwd=lib.REPO_ROOT,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            env=env,
        )

    state = {"run_id": run, "pid": proc.pid, "setup": setup, "log": log_path}
    lib.write_state(state)

    try:
        ready = ready_probe(config.get("ready") or {})
    except Exception as err:  # noqa: BLE001 - reported with the log tail
        tail = ""
        try:
            with open(log_path, encoding="utf-8", errors="replace") as f:
                tail = "".join(f.readlines()[-20:])
        except OSError:
            pass
        print(tail, file=sys.stderr)
        try:
            os.killpg(os.getpgid(proc.pid), 15)
        except OSError:
            pass
        lib.finish("BLOCKED", "setup", str(err), run)

    print(f"READY {ready} {run}")


if __name__ == "__main__":
    main()
