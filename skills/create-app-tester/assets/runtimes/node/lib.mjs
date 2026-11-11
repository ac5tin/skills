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
export class Skipped extends Error {}

export function loadMap() {
  return JSON.parse(readFileSync(MAP_FILE, "utf8"))
}

export function targets(data = loadMap()) {
  if (data.targets && Object.keys(data.targets).length > 0) return data.targets
  return { local: { kind: "local", run: data.run || {} } }
}

export function targetName({ arg = null, run = null, data = null } = {}) {
  const map = data || loadMap()
  const known = targets(map)
  const state = run ? readState() : {}
  const bound = run && state.run_id === run ? state.target : null
  const name = arg || process.env.APP_TEST_TARGET || bound || map.default_target || "local"
  if (!(name in known)) {
    throw new Blocked(`unknown target '${name}'; known: ${Object.keys(known).sort().join(", ")}`)
  }
  return name
}

export function targetConfig({ name = null, run = null, data = null } = {}) {
  const map = data || loadMap()
  return targets(map)[targetName({ arg: name, run, data: map })]
}

export function readyUrl(config) {
  const ready = config.ready || config.run?.ready
  if (typeof ready === "string") return ready
  return ready?.url || null
}

export function baseUrl({ name = null, run = null, data = null } = {}) {
  const config = targetConfig({ name, run, data })
  const url = config.base_url || readyUrl(config)
  if (!url) throw new Blocked(`target '${targetName({ arg: name, run })}' has no base_url or ready url`)
  if (config.base_url) return url.replace(/\/$/, "")
  try {
    return new URL(url).origin
  } catch {
    return url.replace(/\/$/, "")
  }
}

export function findEntry(entryId, data = loadMap()) {
  return [...(data.features || []), ...(data.usecases || [])].find((entry) => entry.id === entryId) || {}
}

export function requireTarget(entryId, { name = null, run = null } = {}) {
  const data = loadMap()
  const allowed = findEntry(entryId, data).targets
  if (allowed && !allowed.includes(targetName({ arg: name, run, data }))) {
    throw new Skipped(`not mapped to target ${targetName({ arg: name, run, data })}`)
  }
}

export function requireWrite(entryId, { allowWrites = false, name = null, run = null } = {}) {
  if (!findEntry(entryId).mutates) return
  const config = targetConfig({ name, run })
  const fallback = (config.kind || "local") === "remote" ? "read-only" : "allowed"
  if ((config.writes || fallback) === "allowed" || allowWrites) return
  throw new Blocked(
    `target '${targetName({ arg: name, run })}' is read-only and ${entryId} mutates data; pass --allow-writes`,
  )
}

export function runId() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-")
  return process.env.APP_TEST_RUN_ID || stamp.slice(0, 15)
}

export function parseArgs(argv = process.argv.slice(2)) {
  const index = argv.indexOf("--run-id")
  const targetIndex = argv.indexOf("--target")
  return {
    runId: index >= 0 ? argv[index + 1] : null,
    target: targetIndex >= 0 ? argv[targetIndex + 1] : null,
    allowWrites: argv.includes("--allow-writes"),
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
  if (run) {
    const state = readState()
    if (state.target) result.target = state.target
    try {
      result.base_url = baseUrl({ run })
    } catch {
      // target has no address yet
    }
    if (state.version) result.version = state.version
    save(run, id, "result.json", JSON.stringify(result, null, 2))
  }
  console.log(`${status} ${id} ${reason}`.trimEnd())
  if (asJson) console.log(JSON.stringify(result))
  process.exit({ PASS: 0, FAIL: 1, BLOCKED: 2, SKIP: 0 }[status])
}
