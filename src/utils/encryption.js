// src/utils/encryption.js
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const arrayBufferToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToUint8Array = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

// Generate a new AES-256-GCM key
export async function generateEncryptionKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );
}

// Export key to base64 string for storage/sharing
export async function exportKey(cryptoKey) {
    const exported = await window.crypto.subtle.exportKey("raw", cryptoKey);
    return arrayBufferToBase64(exported);
}

// Import key from base64 string
export async function importKey(base64Key) {
    const rawKey = base64ToUint8Array(base64Key);
    return await window.crypto.subtle.importKey(
        "raw",
        rawKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function generateRSAKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    return {
        publicKey: await exportPublicKey(keyPair.publicKey),
        privateKey: await exportPrivateKey(keyPair.privateKey),
    };
}

export async function exportPublicKey(publicKey) {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(privateKey) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    return arrayBufferToBase64(exported);
}

export async function importPublicKey(base64Key) {
    return await window.crypto.subtle.importKey(
        "spki",
        base64ToUint8Array(base64Key),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
}

export async function importPrivateKey(base64Key) {
    return await window.crypto.subtle.importKey(
        "pkcs8",
        base64ToUint8Array(base64Key),
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );
}

export async function encryptAESKeyForPublicKey(aesBase64Key, publicBase64Key) {
    const publicKey = await importPublicKey(publicBase64Key);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        textEncoder.encode(aesBase64Key)
    );
    return arrayBufferToBase64(encrypted);
}

export async function decryptAESKeyWithPrivateKey(encryptedBase64Key, privateBase64Key) {
    const privateKey = await importPrivateKey(privateBase64Key);
    const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        base64ToUint8Array(encryptedBase64Key)
    );
    return textDecoder.decode(decrypted);
}

export const privateKeyStorageKey = (walletAddress) => `medchain_private_key_${walletAddress?.toLowerCase()}`;

// Encrypt file ArrayBuffer → returns { encryptedData: Uint8Array, iv: Uint8Array }
export async function encryptFile(fileArrayBuffer, cryptoKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        cryptoKey,
        fileArrayBuffer
    );

    return {
        encryptedData: new Uint8Array(encryptedContent),
        iv: iv,
    };
}

// Decrypt encrypted Uint8Array → returns ArrayBuffer
export async function decryptFile(encryptedData, cryptoKey, iv) {
    return await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        cryptoKey,
        encryptedData
    );
}

// Derive key from wallet address (deterministic, for demo purposes)
// NOTE: This is for demo simplicity only. Real apps should not derive keys from public addresses.
export async function deriveKeyFromAddress(walletAddress) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(walletAddress),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("MedChain-Salt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}
