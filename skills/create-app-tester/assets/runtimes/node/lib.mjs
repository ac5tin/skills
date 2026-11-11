import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
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

const ENV_CACHE = new Map()
const SECRETS = new Set()

export function envPath({ name = null, run = null, data = null } = {}) {
  const map = data || loadMap()
  const target = targetName({ arg: name, run, data: map })
  const config = targets(map)[target]
  const raw = config.env_file || join(".app-tester", "env", `${target}.env`)
  const path = isAbsolute(raw) ? raw : join(REPO_ROOT, raw)
  return { target, raw, path }
}

export function loadEnv({ name = null, run = null, data = null } = {}) {
  const map = data || loadMap()
  const { target, raw, path } = envPath({ name, run, data: map })
  if (ENV_CACHE.has(target)) return ENV_CACHE.get(target)

  const values = { ...process.env }
  const secrets = {}
  const exists = existsSync(path)
  if (exists) {
    const lines = readFileSync(path, "utf8").split(/\r?\n/)
    lines.forEach((line, index) => {
      let entry = line.trim()
      if (!entry || entry.startsWith("#")) return
      if (entry.startsWith("export ")) entry = entry.slice(7).trimStart()
      const eq = entry.indexOf("=")
      if (eq < 0) throw new Blocked(`${raw} line ${index + 1}: expected KEY=value`)
      const key = entry.slice(0, eq).trim()
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        throw new Blocked(`${raw} line ${index + 1}: bad variable name`)
      }
      let value = entry.slice(eq + 1).trim()
      if (value.length >= 2 && value[0] === value[value.length - 1] && "\"'".includes(value[0])) {
        value = value.slice(1, -1)
      }
      values[key] = value
      secrets[key] = value
    })
  }

  for (const value of Object.values(secrets)) if (value.length > 3) SECRETS.add(value)
  const info = { target, path: raw, abs: path, exists, values, secrets }
  ENV_CACHE.set(target, info)
  return info
}

export function env(name, fallback = null) {
  return loadEnv().values[name] ?? fallback
}

export function redact(text) {
  if (typeof text !== "string") return text
  let out = text
  for (const value of [...SECRETS].sort((a, b) => b.length - a.length)) {
    out = out.split(value).join("***")
  }
  return out
}

export function requireEnv(entryId, { name = null, run = null } = {}) {
  const map = loadMap()
  const info = loadEnv({ name, run, data: map })
  const config = targets(map)[info.target]
  const required = [
    ...(config.required_env || config.auth || []),
    ...(findEntry(entryId, map).requires_env || []),
  ]
  const missing = [...new Set(required)].filter((key) => !info.values[key])
  if (missing.length) {
    throw new Blocked(`${entryId}: missing env ${missing.join(", ")} (file ${info.path})`)
  }
}

export function runSteps(steps, label, run, values = process.env) {
  if (!steps || steps.length === 0) return []
  const logDir = join(RUNTIME_DIR, "logs", run)
  mkdirSync(logDir, { recursive: true })
  const results = []
  steps.forEach((step, index) => {
    const path = join(logDir, `${String(index + 1).padStart(2, "0")}-${label}.log`)
    const proc = sh(step, { timeout: 120, env: values })
    const timedOut = proc.status === null
    const body = `$ ${step}\n${proc.stdout}\n${proc.stderr}\nexit=${proc.status}\n`
    writeFileSync(path, redact(body))
    results.push({ step, exit: proc.status, log: relative(REPO_ROOT, path) })
    if (timedOut) throw new Blocked(`${label} step ${index + 1} timed out after 120s`)
    if (proc.status !== 0) {
      throw new Blocked(
        `${label} step ${index + 1} failed (exit ${proc.status}): ${redact(proc.stderr).slice(-500)}`,
      )
    }
  })
  return results
}

export function cleanup(entryId, run, name = null) {
  const steps = findEntry(entryId).cleanup_steps || []
  if (!steps.length) return
  try {
    runSteps(steps, `cleanup-${entryId}`, run, loadEnv({ name, run }).values)
  } catch (error) {
    if (error instanceof Blocked) console.log(`CLEANUP FAILED ${entryId} ${error.message}`)
    else throw error
  }
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
  writeFileSync(path, redact(text))
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
  reason = redact(reason)
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
