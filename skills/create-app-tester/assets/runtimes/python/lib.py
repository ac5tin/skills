"""Shared helpers for the generated app tester. Standard library only."""
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))
RUNTIME_DIR = os.path.join(REPO_ROOT, ".app-tester")
ARTIFACT_ROOT = os.path.join(RUNTIME_DIR, "artifacts")
STATE_FILE = os.path.join(RUNTIME_DIR, "state.json")
MAP_FILE = os.path.join(SKILL_DIR, "references", "map.json")


class Blocked(Exception):
    """A precondition is missing. The entry cannot run, and did not fail."""


class Skipped(Exception):
    """The entry does not apply to the active target."""


def load_map():
    with open(MAP_FILE, encoding="utf-8") as f:
        return json.load(f)


def targets(data=None):
    """Declared targets; an old map's top-level run block is the local target."""
    data = data or load_map()
    declared = data.get("targets") or {}
    if declared:
        return declared
    return {"local": {"kind": "local", "run": data.get("run", {})}}


def target_name(arg=None, run=None, data=None):
    data = data or load_map()
    known = targets(data)
    state = read_state() if run else {}
    bound = state.get("target") if run and state.get("run_id") == run else None
    name = (
        arg
        or os.environ.get("APP_TEST_TARGET")
        or bound
        or data.get("default_target")
        or "local"
    )
    if name not in known:
        raise Blocked(f"unknown target '{name}'; known: {', '.join(sorted(known))}")
    return name


def target_config(name=None, run=None, data=None):
    data = data or load_map()
    return targets(data)[target_name(name, run, data)]


def ready_url(cfg):
    ready = cfg.get("ready") or (cfg.get("run") or {}).get("ready")
    if isinstance(ready, str):
        return ready
    return (ready or {}).get("url")


def base_url(name=None, run=None, data=None):
    cfg = target_config(name, run, data)
    url = cfg.get("base_url") or ready_url(cfg)
    if not url:
        raise Blocked(f"target '{target_name(name, run)}' has no base_url or ready url")
    if cfg.get("base_url"):
        return url.rstrip("/")
    parts = urllib.parse.urlsplit(url)
    if parts.scheme and parts.netloc:
        return f"{parts.scheme}://{parts.netloc}"
    return url.rstrip("/")


def find_entry(entry_id, data=None):
    data = data or load_map()
    for entry in data.get("features", []) + data.get("usecases", []):
        if entry.get("id") == entry_id:
            return entry
    return {}


def require_target(entry_id, name=None, run=None):
    data = load_map()
    allowed = find_entry(entry_id, data).get("targets")
    if allowed and target_name(name, run, data) not in allowed:
        raise Skipped(f"not mapped to target {target_name(name, run, data)}")


def require_write(entry_id, allow_writes=False, name=None, run=None):
    if not find_entry(entry_id).get("mutates"):
        return
    cfg = target_config(name, run)
    default = "read-only" if cfg.get("kind") == "remote" else "allowed"
    if cfg.get("writes", default) == "allowed" or allow_writes:
        return
    raise Blocked(
        f"target '{target_name(name, run)}' is read-only and {entry_id} mutates data; "
        "pass --allow-writes"
    )


_ENV_CACHE = {}
_SECRETS = set()


def env_path(name=None, run=None, data=None):
    data = data or load_map()
    target = target_name(name, run, data)
    cfg = targets(data)[target]
    raw = cfg.get("env_file") or os.path.join(".app-tester", "env", f"{target}.env")
    path = raw if os.path.isabs(raw) else os.path.join(REPO_ROOT, raw)
    return target, raw, os.path.abspath(path)


def load_env(name=None, run=None, data=None):
    """Merge the target env file over the process environment. The file wins."""
    data = data or load_map()
    target, raw, path = env_path(name, run, data)
    if target in _ENV_CACHE:
        return _ENV_CACHE[target]

    values = dict(os.environ)
    secrets = {}
    exists = os.path.exists(path)
    if exists:
        with open(path, encoding="utf-8") as handle:
            for number, line in enumerate(handle, 1):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("export "):
                    line = line[len("export "):].lstrip()
                if "=" not in line:
                    raise Blocked(f"{raw} line {number}: expected KEY=value")
                key, value = line.split("=", 1)
                key = key.strip()
                if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
                    raise Blocked(f"{raw} line {number}: bad variable name")
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                values[key] = value
                secrets[key] = value

    _SECRETS.update(value for value in secrets.values() if len(value) > 3)
    info = {
        "target": target,
        "path": raw,
        "abs": path,
        "exists": exists,
        "values": values,
        "secrets": secrets,
    }
    _ENV_CACHE[target] = info
    return info


def env(name, default=None, run=None):
    return load_env(None, run)["values"].get(name, default)


def redact(text):
    if not isinstance(text, str):
        return text
    for value in sorted(_SECRETS, key=len, reverse=True):
        text = text.replace(value, "***")
    return text


def require_env(entry_id, name=None, run=None):
    data = load_map()
    info = load_env(name, run, data)
    cfg = targets(data)[info["target"]]
    required = list(cfg.get("required_env") or cfg.get("auth") or [])
    required += list(find_entry(entry_id, data).get("requires_env") or [])
    missing = [item for item in dict.fromkeys(required) if not info["values"].get(item)]
    if missing:
        raise Blocked(
            f"{entry_id}: missing env {', '.join(missing)} (file {info['path']})"
        )


def run_steps(steps, label, run, values=None):
    """Run shell steps in order. Output is redacted before it reaches disk."""
    if not steps:
        return []
    log_dir = os.path.join(RUNTIME_DIR, "logs", run)
    os.makedirs(log_dir, exist_ok=True)
    results = []
    for index, step in enumerate(steps, 1):
        path = os.path.join(log_dir, f"{index:02d}-{label}.log")
        try:
            proc = subprocess.run(
                step,
                shell=True,
                cwd=REPO_ROOT,
                text=True,
                capture_output=True,
                timeout=120,
                env=values,
            )
        except subprocess.TimeoutExpired:
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(redact(f"$ {step}\ntimeout after 120s\n"))
            raise Blocked(f"{label} step {index} timed out after 120s")
        body = f"$ {step}\n{proc.stdout}\n{proc.stderr}\nexit={proc.returncode}\n"
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(redact(body))
        results.append(
            {
                "step": step,
                "exit": proc.returncode,
                "log": os.path.relpath(path, REPO_ROOT),
            }
        )
        if proc.returncode != 0:
            raise Blocked(
                f"{label} step {index} failed (exit {proc.returncode}): "
                f"{redact(proc.stderr)[-500:]}"
            )
    return results


def cleanup(entry_id, run, name=None):
    steps = find_entry(entry_id).get("cleanup_steps") or []
    if not steps:
        return
    try:
        run_steps(
            steps, f"cleanup-{entry_id}", run, load_env(name, run)["values"]
        )
    except Blocked as err:
        print(f"CLEANUP FAILED {entry_id} {err}")


def run_id():
    return os.environ.get("APP_TEST_RUN_ID") or time.strftime("%Y%m%d-%H%M%S")


def entry_dir(run, entry_id):
    path = os.path.join(ARTIFACT_ROOT, run, entry_id)
    os.makedirs(path, exist_ok=True)
    return path


def save(run, entry_id, name, text):
    path = os.path.join(entry_dir(run, entry_id), name)
    if isinstance(text, str):
        text = redact(text)
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
    reason = redact(reason)
    result = {
        "id": entry_id,
        "status": status,
        "reason": reason,
        "evidence": evidence or [],
    }
    if run:
        state = read_state()
        if state.get("target"):
            result["target"] = state["target"]
        try:
            result["base_url"] = base_url(run=run)
        except Blocked:
            pass
        if state.get("version"):
            result["version"] = state["version"]
        save(run, entry_id, "result.json", json.dumps(result, indent=2))
    print(f"{status} {entry_id} {reason}".rstrip())
    if as_json:
        print(json.dumps(result))
    sys.exit({"PASS": 0, "FAIL": 1, "BLOCKED": 2, "SKIP": 0}[status])
