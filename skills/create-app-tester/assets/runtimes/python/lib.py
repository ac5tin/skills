"""Shared helpers for the generated app tester. Standard library only."""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))
RUNTIME_DIR = os.path.join(REPO_ROOT, ".app-tester")
ARTIFACT_ROOT = os.path.join(RUNTIME_DIR, "artifacts")
STATE_FILE = os.path.join(RUNTIME_DIR, "state.json")
MAP_FILE = os.path.join(SKILL_DIR, "references", "map.json")


class Blocked(Exception):
    """A precondition is missing. The entry cannot run, and did not fail."""


def load_map():
    with open(MAP_FILE, encoding="utf-8") as f:
        return json.load(f)


def run_id():
    return os.environ.get("APP_TEST_RUN_ID") or time.strftime("%Y%m%d-%H%M%S")


def entry_dir(run, entry_id):
    path = os.path.join(ARTIFACT_ROOT, run, entry_id)
    os.makedirs(path, exist_ok=True)
    return path


def save(run, entry_id, name, text):
    path = os.path.join(entry_dir(run, entry_id), name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path


def sh(cmd, cwd=None, timeout=300, check=False, env=None):
    proc = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd or REPO_ROOT,
        text=True,
        capture_output=True,
        timeout=timeout,
        env=env,
    )
    if check and proc.returncode != 0:
        raise AssertionError(
            f"command failed ({proc.returncode}): {cmd}\n{proc.stderr[-2000:]}"
        )
    return proc


def http(method, url, data=None, headers=None, timeout=30):
    body = data.encode() if isinstance(data, str) else data
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", "replace")


def wait_for(fn, timeout=60, interval=0.5, label="condition"):
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        try:
            if fn():
                return True
        except Exception as err:  # noqa: BLE001 - the last error is reported
            last = err
        time.sleep(interval)
    detail = f": {last}" if last else ""
    raise AssertionError(f"timed out after {timeout}s waiting for {label}{detail}")


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def read_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def write_state(state):
    os.makedirs(RUNTIME_DIR, exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def finish(status, entry_id, reason="", run=None, evidence=None, as_json=False):
    result = {
        "id": entry_id,
        "status": status,
        "reason": reason,
        "evidence": evidence or [],
    }
    if run:
        save(run, entry_id, "result.json", json.dumps(result, indent=2))
    print(f"{status} {entry_id} {reason}".rstrip())
    if as_json:
        print(json.dumps(result))
    sys.exit({"PASS": 0, "FAIL": 1, "BLOCKED": 2}[status])
