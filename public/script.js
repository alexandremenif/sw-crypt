const dbPromise = idb.openDB('Database', 1, {
    upgrade(db) {
        db.createObjectStore('Store');
    }
})

async function readCryptoKeyPair() {
    console.log('read key pairs')
    const db = await dbPromise
    return db.get('Store', 'cryptoKeyPair')
}

async function writeCryptoKeyPair(cryptoKeyPair) {
    const db = await dbPromise
    await db.put('Store', cryptoKeyPair, 'cryptoKeyPair')
}

async function generateAndStoreCryptoKeyPair() {
    console.log('Generate key pairs')
    const cryptoKeyPair = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        false,
        ['encrypt', 'decrypt']
    )

    await writeCryptoKeyPair(cryptoKeyPair);

    return cryptoKeyPair
}

async function exportPublicKey() {

    const cryptoKeyPair = (await readCryptoKeyPair()) ?? (await generateAndStoreCryptoKeyPair())

    const exportedPublicKey = await crypto.subtle.exportKey('jwk', cryptoKeyPair.publicKey)

    console.log(exportedPublicKey)
    prompt('Copy to clipboard: Ctrl+C, Enter', JSON.stringify(exportedPublicKey))
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', { type: 'module' });
}