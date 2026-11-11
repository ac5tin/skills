import { spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
export const REPO_ROOT = resolve(SKILL_DIR, "..", "..", "..")
export const RUNTIME_DIR = join(REPO_ROOT, ".app-tester")
export const ARTIFACT_ROOT = join(RUNTIME_DIR, "artifacts")
export const STATE_FILE = join(RUNTIME_DIR, "state.json")
export const MAP_FILE = join(SKILL_DIR, "references", "map.json")

export class Blocked extends Error {}

export function loadMap() {
  return JSON.parse(readFileSync(MAP_FILE, "utf8"))
}

export function runId() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-")
  return process.env.APP_TEST_RUN_ID || stamp.slice(0, 15)
}

export function parseArgs(argv = process.argv.slice(2)) {
  const index = argv.indexOf("--run-id")
  return {
    runId: index >= 0 ? argv[index + 1] : null,
    json: argv.includes("--json"),
  }
}

export function entryDir(run, id) {
  const path = join(ARTIFACT_ROOT, run, id)
  mkdirSync(path, { recursive: true })
  return path
}

export function save(run, id, name, text) {
  const path = join(entryDir(run, id), name)
  writeFileSync(path, text)
  return path
}

export function sh(cmd, { cwd = REPO_ROOT, timeout = 300, env = process.env } = {}) {
  const result = spawnSync(cmd, {
    shell: true,
    cwd,
    encoding: "utf8",
    timeout: timeout * 1000,
    env,
  })
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  }
}

export async function http(method, url, { data, headers, timeout = 30000 } = {}) {
  const response = await fetch(url, {
    method,
    body: data,
    headers,
    signal: AbortSignal.timeout(timeout),
  })
  return { status: response.status, body: await response.text() }
}

export async function waitFor(fn, { timeout = 60, interval = 500, label = "condition" } = {}) {
  const deadline = Date.now() + timeout * 1000
  let last
  while (Date.now() < deadline) {
    try {
      if (await fn()) return true
    } catch (error) {
      last = error
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, interval))
  }
  throw new Error(`timed out after ${timeout}s waiting for ${label}${last ? `: ${last}` : ""}`)
}

export function check(condition, message) {
  if (!condition) throw new Error(message)
}

export function readState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"))
  } catch {
    return {}
  }
}

export function writeState(state) {
  mkdirSync(RUNTIME_DIR, { recursive: true })
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

export function finish(status, id, reason = "", run, evidence = [], asJson = false) {
  const result = { id, status, reason, evidence }
  if (run) save(run, id, "result.json", JSON.stringify(result, null, 2))
  console.log(`${status} ${id} ${reason}`.trimEnd())
  if (asJson) console.log(JSON.stringify(result))
  process.exit({ PASS: 0, FAIL: 1, BLOCKED: 2 }[status])
}
