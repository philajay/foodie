import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/** Minimal .env parser so the seed script needs no extra dependency. */
export function loadEnvFiles(root = process.cwd()): void {
  for (const name of ['.env', '.env.local']) {
    const path = resolve(root, name)
    if (!existsSync(path)) continue
    for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separator = line.indexOf('=')
      if (separator === -1) continue
      const key = line.slice(0, separator).trim()
      let value = line.slice(separator + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] ??= value
    }
  }
}
