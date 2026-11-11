import { existsSync, readdirSync, readFileSync } from "node:fs"
import { basename, join, relative } from "node:path"
import { SKILL_DIR, loadMap } from "./lib.mjs"

const FEATURE_H2 = [
  "Sub-features",
  "Entry points",
  "How to test and verify",
  "Evidence",
  "Code anchors",
  "Gotchas",
]
const USECASE_H2 = [
  "Features involved",
  "Preconditions",
  "How to test and verify",
  "Evidence",
  "Code anchors",
  "Gotchas",
]
const RUNTIMES = { node: ".mjs", python3: ".py" }
const errors = []

function fail(message) {
  errors.push(message)
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const skillName = basename(SKILL_DIR)
const skillText = readFileSync(join(SKILL_DIR, "SKILL.md"), "utf8")
const frontmatter = skillText.match(/^---\r?\n([\s\S]*?)\r?\n---/)
if (!frontmatter) {
  fail("SKILL.md has no frontmatter")
} else {
  const fields = {}
  for (const line of frontmatter[1].split("\n")) {
    const index = line.indexOf(":")
    if (index > 0) fields[line.slice(0, index).trim()] = line.slice(index + 1).trim()
  }
  const name = fields.name || ""
  const description = fields.description || ""
  if (name !== skillName) fail(`frontmatter name '${name}' != directory '${skillName}'`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail(`name '${name}' is not kebab-case`)
  if (description.length < 1 || description.length > 1024) {
    fail("description must be 1-1024 characters")
  }
}

const data = loadMap()
const features = data.features || []
const usecases = data.usecases || []
const runtime = data.runtime
if (!RUNTIMES[runtime]) fail(`runtime must be node or python3, got '${runtime}'`)
const extension = RUNTIMES[runtime] || ""

for (const name of ["lib", "doctor", "setup", "teardown", "validate"]) {
  if (!existsSync(join(SKILL_DIR, "scripts", `${name}${extension}`))) {
    fail(`missing shared script scripts/${name}${extension}`)
  }
}

const ids = [...features, ...usecases].map((entry) => entry.id)
if (new Set(ids).size !== ids.length) fail("duplicate ids in map.json")

function checkEntries(entries, required, folder) {
  const seen = new Set()
  for (const entry of entries) {
    const id = entry.id || "?"
    const priority = entry.priority
    const filePath = join(SKILL_DIR, entry.file || "")
    const scriptPath = join(SKILL_DIR, entry.script || "")
    if (!["P0", "P1", "P2", "P3"].includes(priority)) {
      fail(`${id}: priority must be P0-P3, got '${priority}'`)
    }
    if (extension && entry.script && !entry.script.endsWith(extension)) {
      fail(`${id}: script must end with ${extension} for runtime ${runtime}`)
    }
    if (!existsSync(filePath)) {
      fail(`${id}: missing file ${entry.file}`)
      continue
    }
    if (!existsSync(scriptPath)) fail(`${id}: missing script ${entry.script}`)
    const body = readFileSync(filePath, "utf8")
    for (const heading of required) {
      if (!new RegExp(`^## ${escapeRegex(heading)}\\s*$`, "m").test(body)) {
        fail(`${id}: missing H2 '${heading}'`)
      }
    }
    const priorityMatch = body.match(/^\*\*Priority:\*\* (P[0-3])\b/m)
    if (!priorityMatch) fail(`${id}: missing '**Priority:** Pn' line`)
    else if (priorityMatch[1] !== priority) {
      fail(`${id}: file priority ${priorityMatch[1]} != map ${priority}`)
    }
    seen.add(basename(filePath))
  }

  const directory = join(SKILL_DIR, "references", folder)
  const actual = new Set(
    readdirSync(directory).filter((name) => name.endsWith(".md") && name !== "README.md"),
  )
  for (const name of actual) if (!seen.has(name)) fail(`${folder}/${name} is not in map.json`)
  for (const name of seen) if (!actual.has(name)) fail(`${folder}/${name} is in map.json but not on disk`)

  const indexPath = join(directory, "README.md")
  const indexBody = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : ""
  for (const entry of entries) {
    const id = entry.id || "?"
    if (!indexBody.includes(basename(entry.file || ""))) {
      fail(`${id}: file missing from ${folder}/README.md`)
      continue
    }
    const row = indexBody.split("\n").find((line) => line.includes(id)) || ""
    if (!row.includes(entry.priority)) fail(`${id}: priority not shown in ${folder}/README.md`)
  }
}

checkEntries(features, FEATURE_H2, "features")
checkEntries(usecases, USECASE_H2, "usecases")

const rank = { P0: 0, P1: 1, P2: 2, P3: 3 }
const featureRank = new Map(features.map((entry) => [entry.id, rank[entry.priority] ?? 3]))
for (const entry of usecases) {
  const ranks = (entry.features || [])
    .map((id) => featureRank.get(id))
    .filter((value) => value !== undefined)
  if (ranks.length && (rank[entry.priority] ?? 3) > Math.min(...ranks)) {
    fail(`${entry.id}: use case is less critical than its features`)
  }
}

if (features.length && !features.some((entry) => entry.priority === "P0")) {
  console.log("WARN no P0 feature")
}
if (usecases.length && !usecases.some((entry) => entry.priority === "P0")) {
  console.log("WARN no P0 use case")
}

function walk(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if (item.name === "node_modules" || item.name === "__pycache__") continue
    const path = join(directory, item.name)
    if (item.isDirectory()) walk(path)
    else if (!/\.(pyc|png|jpg|jpeg|zip)$/.test(item.name)) {
      let body
      try {
        body = readFileSync(path, "utf8")
      } catch {
        continue
      }
      if (body.includes(`${"{"}${"{"}`)) fail(`unreplaced token in ${relative(SKILL_DIR, path)}`)
    }
  }
}
walk(SKILL_DIR)

if (errors.length) {
  for (const message of errors) console.log(`FAIL ${message}`)
  process.exit(1)
}

console.log(`VALID ${features.length} features, ${usecases.length} use cases in ${skillName}`)
console.log(JSON.stringify({ features: features.length, usecases: usecases.length }))
