// Encrypt the phase-model replays for publication as ciphertext.
//
// The site repository is public, so the replay data must not be readable
// at rest. Each file is gzipped, then encrypted with AES-256-GCM under a
// key derived from a passcode by PBKDF2-SHA256. The passcode is never
// stored in the repository: it is passed in the environment here and
// typed by the reader in the browser.
//
//   TWN_PASSCODE='...' node scripts/encrypt-replays.mjs
//
// Layout of each .enc file: salt(16) | iv(12) | ciphertext+tag.

import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto"
import { gzipSync } from "node:zlib"
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const DIR = "public/research/replays"
const ITER = 200000

const pass = process.env.TWN_PASSCODE
if (!pass) {
  console.error("set TWN_PASSCODE")
  process.exit(1)
}

for (const name of readdirSync(DIR)) {
  if (!name.endsWith(".json")) continue
  const src = join(DIR, name)
  const plain = readFileSync(src)
  const packed = gzipSync(plain, { level: 9 })
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = pbkdf2Sync(pass, salt, ITER, 32, "sha256")
  const c = createCipheriv("aes-256-gcm", key, iv)
  const body = Buffer.concat([c.update(packed), c.final()])
  const out = Buffer.concat([salt, iv, body, c.getAuthTag()])
  const dst = src.replace(/\.json$/, ".enc")
  writeFileSync(dst, out)
  console.log(
    `${name}  ${(statSync(src).size / 1e6).toFixed(1)} MB -> ` +
      `${(out.length / 1e6).toFixed(1)} MB encrypted`
  )
}
