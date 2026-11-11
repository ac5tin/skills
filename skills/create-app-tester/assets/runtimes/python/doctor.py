#!/usr/bin/env python3
"""Read-only health check. Exit 2 when the instance is not worth driving."""
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


def main():
    data = lib.load_map()
    checks = data.get("run", {}).get("health") or []
    state = lib.read_state()
    results = []
    ok = True

    for check in checks:
        passed, detail = run_check(check)
        ok = ok and passed
        results.append({"check": check.get("kind", "cmd"), "ok": passed, "detail": detail})

    if not checks and state.get("pid"):
        pid = state["pid"]
        try:
            os.kill(pid, 0)
            passed, detail = True, f"pid {pid} alive"
        except OSError:
            passed, detail = False, f"pid {pid} gone"
        ok = passed
        results.append({"check": "pid", "ok": passed, "detail": detail})

    if not checks and not state.get("pid"):
        results.append({"check": "none", "ok": True, "detail": "no health checks configured"})

    print(json.dumps({"ok": ok, "checks": results}))
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
