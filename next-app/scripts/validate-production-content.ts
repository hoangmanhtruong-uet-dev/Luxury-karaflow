import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const publicDir = path.join(projectRoot, "public")
const srcDir = path.join(projectRoot, "src")
const prismaDir = path.join(projectRoot, "prisma")

const errors: string[] = []
const warnings: string[] = []

function walkDir(dir: string, callback: (file: string) => void) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkDir(full, callback)
    else callback(full)
  }
}

function extractImageRefs(content: string): string[] {
  const refs: string[] = []
  const regex = /["'`]\/images\/[^"'`\s)]+["'`]/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    refs.push(match[0].slice(1, -1))
  }
  return refs
}

function checkImageExists(ref: string, sourceFile: string) {
  const imagePath = path.join(publicDir, ref)
  if (!fs.existsSync(imagePath)) {
    errors.push(`MISSING IMAGE: ${ref} (referenced in ${sourceFile})`)
  }
}

function scanSourceFiles() {
  const imageRefs = new Map<string, Set<string>>()

  walkDir(srcDir, (file) => {
    if (!file.match(/\.(ts|tsx)$/)) return
    if (file.includes(".test.")) return
    const content = fs.readFileSync(file, "utf8")
    const refs = extractImageRefs(content)
    for (const ref of refs) {
      if (!imageRefs.has(ref)) imageRefs.set(ref, new Set())
      imageRefs.get(ref)!.add(path.relative(projectRoot, file))
    }
  })

  walkDir(prismaDir, (file) => {
    if (!file.match(/\.(ts|prisma)$/)) return
    const content = fs.readFileSync(file, "utf8")
    const refs = extractImageRefs(content)
    for (const ref of refs) {
      if (!imageRefs.has(ref)) imageRefs.set(ref, new Set())
      imageRefs.get(ref)!.add(path.relative(projectRoot, file))
    }
  })

  for (const [ref, files] of imageRefs) {
    checkImageExists(ref, Array.from(files).join(", "))
  }

  return imageRefs
}

function checkSeedPlaceholders() {
  const seedFile = path.join(prismaDir, "seeds", "data.ts")
  if (!fs.existsSync(seedFile)) {
    warnings.push("Seed file not found: prisma/seeds/data.ts")
    return
  }

  const content = fs.readFileSync(seedFile, "utf8")
  const placeholderPatterns = [
    { pattern: /VivaStar/g, label: "VivaStar brand name" },
    { pattern: /vivastar/g, label: "vivastar slug/email" },
    { pattern: /1900 0000/g, label: "placeholder hotline" },
    { pattern: /19000000/g, label: "placeholder hotline" },
  ]

  for (const { pattern, label } of placeholderPatterns) {
    if (pattern.test(content)) {
      warnings.push(`SEED PLACEHOLDER: ${label} found in prisma/seeds/data.ts`)
    }
  }
}

function checkStaticDataPlaceholders() {
  const dataDir = path.join(srcDir, "data")
  if (!fs.existsSync(dataDir)) return

  walkDir(dataDir, (file) => {
    if (!file.match(/\.(ts|tsx)$/)) return
    const content = fs.readFileSync(file, "utf8")
    const rel = path.relative(projectRoot, file)

    if (/VivaStar/i.test(content)) {
      warnings.push(`STATIC DATA PLACEHOLDER: VivaStar in ${rel}`)
    }
    if (/1900 0000|19000000/.test(content)) {
      warnings.push(`STATIC DATA PLACEHOLDER: placeholder hotline in ${rel}`)
    }
  })
}

function checkPublicImages() {
  const imagesDir = path.join(publicDir, "images")
  if (!fs.existsSync(imagesDir)) {
    warnings.push("public/images directory not found")
    return
  }

  const requiredDirs = ["branches", "rooms", "menu"]
  for (const dir of requiredDirs) {
    const dirPath = path.join(imagesDir, dir)
    if (!fs.existsSync(dirPath)) {
      warnings.push(`MISSING IMAGE DIR: public/images/${dir}/`)
    } else {
      const files = fs.readdirSync(dirPath)
      if (files.length === 0) {
        warnings.push(`EMPTY IMAGE DIR: public/images/${dir}/`)
      }
    }
  }
}

console.log("=== Production Content Validation ===\n")

const imageRefs = scanSourceFiles()
checkSeedPlaceholders()
checkStaticDataPlaceholders()
checkPublicImages()

console.log(`Scanned ${imageRefs.size} unique image references`)

if (warnings.length > 0) {
  console.log("\n--- WARNINGS ---")
  for (const w of warnings) console.log(`  WARN: ${w}`)
}

if (errors.length > 0) {
  console.log("\n--- ERRORS ---")
  for (const e of errors) console.log(`  ERROR: ${e}`)
  console.log(`\nRESULT=FAIL (${errors.length} errors, ${warnings.length} warnings)`)
  process.exitCode = 1
} else {
  console.log(`\nRESULT=PASS (0 errors, ${warnings.length} warnings)`)
}
