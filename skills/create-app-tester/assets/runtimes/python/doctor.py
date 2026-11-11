#!/usr/bin/env python3
"""Read-only health check. Exit 2 when the instance is not worth driving."""
import argparse
import json
import os
import socket
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import lib


def run_check(check):
    kind = check.get("kind", "cmd")
    if kind == "http":
        expect = check.get("expect", 200)
        try:
            status, _ = lib.http(check.get("method", "GET"), check["url"])
        except Exception as err:  # noqa: BLE001 - reported as a failed check
            return False, f"{check['url']}: {err}"
        return status == expect, f"{check['url']} -> {status} (expected {expect})"
    if kind == "port":
        try:
            with socket.create_connection(
                (check.get("host", "127.0.0.1"), int(check["port"])), timeout=3
            ):
                return True, f"port {check['port']} open"
        except OSError as err:
            return False, f"port {check['port']}: {err}"
    if kind == "file":
        ok = os.path.exists(os.path.join(lib.REPO_ROOT, check["path"]))
        return ok, f"file {check['path']} exists={ok}"
    proc = lib.sh(check["cmd"], timeout=check.get("timeout", 60))
    expect = check.get("expect_exit", 0)
    return proc.returncode == expect, f"`{check['cmd']}` -> {proc.returncode}"


def read_version(probe):
    if not probe or not probe.get("url"):
        return None
    expect = probe.get("expect", 200)
    try:
        status, body = lib.http(probe.get("method", "GET"), probe["url"])
    except Exception as err:  # noqa: BLE001 - reported as a failed check
        return False, f"{probe['url']}: {err}"
    value = body.strip()[:200]
    if probe.get("field"):
        try:
            value = json.loads(body).get(probe["field"])
        except (ValueError, AttributeError):
            value = None
    return status == expect, f"{probe['url']} -> {status} version={value} (expected {expect})"


def env_check(cfg, target):
    raw = cfg.get("env_file") or os.path.join(".app-tester", "env", f"{target}.env")
    path = raw if os.path.isabs(raw) else os.path.join(lib.REPO_ROOT, raw)
    required = list(cfg.get("required_env") or cfg.get("auth") or [])
    info = {"file": raw, "exists": os.path.exists(path), "missing": [], "permissions": "ok"}
    if info["exists"]:
        try:
            values = lib.load_env(target)["values"]
        except lib.Blocked as err:
            info["error"] = str(err)
            info["permissions"] = "unknown"
            return False, info
        if os.stat(path).st_mode & 0o077:
            info["permissions"] = "bad"
            info["fix"] = f"chmod 600 {raw}"
    else:
        values = {}
    info["missing"] = [name for name in required if not values.get(name)]
    ok = not info["missing"] and info["permissions"] == "ok"
    return ok, info


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", default=None)
    parser.add_argument("--run-id", default=None)
    args = parser.parse_args()

    data = lib.load_map()
    state = lib.read_state()
    try:
        target = lib.target_name(args.target, args.run_id or state.get("run_id"), data)
    except lib.Blocked as err:
        print(json.dumps({"ok": False, "target": args.target, "checks": [
            {"check": "target", "ok": False, "detail": str(err)}
        ]}))
        sys.exit(2)

    cfg = lib.targets(data)[target]
    checks = cfg.get("health") or (cfg.get("run") or {}).get("health") or []
    results = []
    ok = True

    for check in checks:
        passed, detail = run_check(check)
        ok = ok and passed
        results.append({"check": check.get("kind", "cmd"), "ok": passed, "detail": detail})

    version = read_version(cfg.get("version"))
    if version:
        passed, detail = version
        ok = ok and passed
        results.append({"check": "version", "ok": passed, "detail": detail})

    if not checks and not version and state.get("pid"):
        pid = state["pid"]
        try:
            os.kill(pid, 0)
            passed, detail = True, f"pid {pid} alive"
        except OSError:
            passed, detail = False, f"pid {pid} gone"
        ok = passed
        results.append({"check": "pid", "ok": passed, "detail": detail})

    env_ok, env_info = env_check(cfg, target)
    ok = ok and env_ok
    results.append({"check": "env", "ok": env_ok, "detail": env_info})

    if not checks and not version and not state.get("pid") and not env_info["exists"]:
        results.append({"check": "none", "ok": True, "detail": "no health checks configured"})

    print(json.dumps({"ok": ok, "target": target, "checks": results}))
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
