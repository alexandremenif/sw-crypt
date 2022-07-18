import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

const subtle = crypto.webcrypto.subtle

const algorithm = {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
}

const publicKey = await crypto.webcrypto.subtle.importKey(
    'jwk',
    JSON.parse(await readFile('public_key.json')),
    algorithm,
    true,
    ['encrypt']
)

async function encryptResource(path) {
    const content = await readFile(join('private', path))
    const aesAlgorithm = { name: 'AES-CBC', length: 256, iv: '_exactly16bytes_' }
    const aesKey = await subtle.generateKey(aesAlgorithm, true, ['encrypt', 'decrypt'])
    const encryptedContent = await subtle.encrypt(aesAlgorithm, aesKey, content)
    const exportedAesKey = await subtle.exportKey('raw', aesKey)
    const encryptedAesKey = await subtle.encrypt(algorithm, publicKey, exportedAesKey)
    const finalContent = Buffer.from(encryptedContent).toString('base64') + "\n" + Buffer.from(encryptedAesKey).toString('base64')
    await writeFile(join('public', path + '.crypt'), finalContent)
}

await encryptResource('abies_koreana.jpeg')
await encryptResource('lorem.md')