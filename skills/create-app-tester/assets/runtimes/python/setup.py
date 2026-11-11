#!/usr/bin/env python3
"""Start the target for one run. Idempotent. Prints READY when usable."""
import argparse
import json
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


def version_value(probe):
    if not probe or not probe.get("url"):
        return None
    try:
        status, body = lib.http(probe.get("method", "GET"), probe["url"])
    except Exception:  # noqa: BLE001 - version is evidence, not a gate
        return None
    if status >= 400:
        return None
    if probe.get("field"):
        try:
            return json.loads(body).get(probe["field"])
        except (ValueError, AttributeError):
            return None
    return body.strip()[:120]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", default=None)
    parser.add_argument("--target", default=None)
    parser.add_argument("--fresh", action="store_true")
    args = parser.parse_args()

    data = lib.load_map()
    run = args.run_id or lib.run_id()
    try:
        target = lib.target_name(args.target, run, data)
    except lib.Blocked as err:
        lib.finish("BLOCKED", "setup", str(err), run)

    cfg = lib.targets(data)[target]
    kind = cfg.get("kind", "local")
    run_cfg = cfg.get("run", {}) if kind == "local" else cfg
    os.makedirs(lib.RUNTIME_DIR, exist_ok=True)

    if kind == "remote":
        state = {"run_id": run, "target": target, "kind": "remote", "pid": None, "setup": ""}
        lib.write_state(state)
        try:
            ready = ready_probe(cfg.get("ready") or {"url": cfg.get("base_url")})
        except Exception as err:  # noqa: BLE001 - reported to the caller
            lib.finish("BLOCKED", "setup", f"target {target}: {err}", run)
        version = version_value(cfg.get("version"))
        if version:
            state["version"] = version
            lib.write_state(state)
        print(f"READY {ready} {run} target={target}")
        return

    setup = run_cfg.get("setup", "").strip()
    if not setup:
        lib.finish("BLOCKED", "setup", "map.json run.setup is empty", run)

    log_path = os.path.join(lib.RUNTIME_DIR, f"setup-{run}.log")
    env = dict(os.environ)
    env["APP_TEST_RUN_ID"] = run
    env["APP_TEST_FRESH"] = "1" if args.fresh else "0"
    env["APP_TEST_TARGET"] = target

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

    state = {
        "run_id": run,
        "target": target,
        "kind": "local",
        "pid": proc.pid,
        "setup": setup,
        "log": log_path,
    }
    lib.write_state(state)

    try:
        ready = ready_probe(run_cfg.get("ready") or {})
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

    version = version_value(run_cfg.get("version"))
    if version:
        state["version"] = version
        lib.write_state(state)

    print(f"READY {ready} {run} target={target}")


if __name__ == "__main__":
    main()
