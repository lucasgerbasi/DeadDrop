// src/crypto.js

// This function derives a secret key from a user's password
async function getKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Function to encrypt a file
export async function encryptFile(file, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16)); // Generate a random salt
    const iv = crypto.getRandomValues(new Uint8Array(12));   // Generate a random initialization vector
    const key = await getKey(password, salt);
    
    const fileBuffer = await file.arrayBuffer();
    
    const encryptedContent = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        fileBuffer
    );
    
    // Package the salt, iv, and encrypted data together into a single blob
    const encryptedBlob = new Blob([salt, iv, new Uint8Array(encryptedContent)]);
    
    // We also need the key to create the final share link, but we return it separately
    // so it NEVER gets sent to the server.
    const exportedKey = await crypto.subtle.exportKey('raw', key);

    return { encryptedBlob, exportedKey };
}

// Function to decrypt a file
export async function decryptFile(encryptedFileBlob, key) {
    const importedKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        true,
        ['decrypt']
    );

    const fileBuffer = await encryptedFileBlob.arrayBuffer();
    
    // Extract the salt, iv, and the actual encrypted data from the blob
    const salt = fileBuffer.slice(0, 16); // Salt is the first 16 bytes
    const iv = fileBuffer.slice(16, 28);   // IV is the next 12 bytes
    const encryptedContent = fileBuffer.slice(28);
    
    try {
        const decryptedContent = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            importedKey,
            encryptedContent
        );
        return new Blob([decryptedContent]);
    } catch (e) {
        // This will fail if the key is incorrect, alerting the user to a bad password.
        console.error("Decryption failed:", e);
        return null;
    }
}