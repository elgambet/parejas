import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import admin from 'firebase-admin'

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!serviceAccountPath) {
  console.error('Missing GOOGLE_APPLICATION_CREDENTIALS path.')
  process.exit(1)
}

const absoluteServiceAccountPath = path.resolve(serviceAccountPath)
const serviceAccount = JSON.parse(await fs.readFile(absoluteServiceAccountPath, 'utf8'))

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const dataPath = path.resolve('data/valid-couples.json')
const raw = await fs.readFile(dataPath, 'utf8')
const couples = JSON.parse(raw)

if (!Array.isArray(couples)) {
  console.error('Expected an array in data/valid-couples.json')
  process.exit(1)
}

const db = admin.firestore()

const chunkSize = 400
let batch = db.batch()
let operations = 0
let total = 0

for (const entry of couples) {
  const coupleKey = String(entry.coupleKey ?? '').trim()
  const coupleName = String(entry.coupleName ?? '').trim()

  if (!coupleKey || !coupleName) {
    console.warn('Skipping invalid entry:', entry)
    continue
  }

  const docRef = db.collection('validCouples').doc(coupleKey)
  batch.set(docRef, { coupleKey, coupleName }, { merge: true })
  operations += 1
  total += 1

  if (operations >= chunkSize) {
    await batch.commit()
    batch = db.batch()
    operations = 0
  }
}

if (operations > 0) {
  await batch.commit()
}

console.log(`Imported ${total} couples into validCouples.`)
