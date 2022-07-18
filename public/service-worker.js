import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';


const dbPromise = openDB('Database', 1, {
    upgrade(db) {
        db.createObjectStore('Store');
    }
})

async function readCryptoKeyPair() {
    console.log('read key pairs')
    const db = await dbPromise
    return db.get('Store', 'cryptoKeyPair')
}

function stringToArrayBuffer(s) {
    var len = s.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = s.charCodeAt(i);
    }
    return bytes.buffer;
}

self.addEventListener('install', event => {
    console.log('Service worker installed')
})

self.addEventListener('activate', event => {
    console.log('Service worker activated')
})

self.addEventListener('fetch', event => {
    console.log('fetch', event)
    event.respondWith(
        fetch(event.request).then(async response => {

            if (response.status === 404) {
                const encryptedResponse = await fetch(new Request(event.request.url + '.crypt'))

                if (encryptedResponse.status === 404) {
                    return encryptedResponse
                }

                const text = await encryptedResponse.text()
                const [encryptedContent, encryptedAeskey] = text.split("\n")

                const rsaAlgorithm = {
                    name: "RSA-OAEP",
                    modulusLength: 4096,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                }

                const aesAlgorithm = { name: 'AES-CBC', length: 256, iv: '_exactly16bytes_' }

                const { privateKey: rsaPrivateKey } = await readCryptoKeyPair()

                const rawAeskey = await crypto.subtle.decrypt(rsaAlgorithm, rsaPrivateKey, stringToArrayBuffer(atob(encryptedAeskey)))

                const aesKey = await crypto.subtle.importKey('raw', rawAeskey, aesAlgorithm, false, ['decrypt'])

                console.log(aesKey)

                const content = await crypto.subtle.decrypt({ ...aesAlgorithm, iv: stringToArrayBuffer('_exactly16bytes_') }, aesKey, stringToArrayBuffer(atob(encryptedContent)))

                return new Response(content, { status: 200 })
            }

            return response
        })
    )
})
