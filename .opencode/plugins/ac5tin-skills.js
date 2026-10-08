import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const skillsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../skills")

// Reads `key: value` frontmatter lines; enough for the single-line name/description fields.
function parse(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, content: text }
  const meta = {}
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":")
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(["'])([\s\S]*)\1$/, "$2")
  }
  return { meta, content: m[2] }
}

async function setup(ctx) {
  const skills = []
  for (const e of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    const file = path.join(skillsDir, e.name, "SKILL.md")
    if (!e.isDirectory() || !fs.existsSync(file)) continue
    const { meta, content } = parse(fs.readFileSync(file, "utf8"))
    skills.push({ id: e.name, name: meta.name || e.name, description: meta.description, path: file, content })
  }
  await ctx.skill.transform((draft) => {
    for (const s of skills) {
      try {
        draft.add(s)
      } catch (err) {
        console.error(`[ac5tin-skills] skill "${s.id}" rejected by host:`, err)
      }
    }
  })
}

export default { id: "ac5tin-skills", setup }
