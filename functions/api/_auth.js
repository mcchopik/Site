export const COOKIE_NAME = 'gc_session';
export const SESSION_TTL = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...headers,
        },
    });
}

function toBase64(bytes) {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function fromBase64(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function toHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32) {
    return toBase64(crypto.getRandomValues(new Uint8Array(bytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function deriveAesKey(secret, info) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${secret}|${info}`));
    return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function normalize(value) {
    return String(value).trim().toLowerCase();
}

export async function blindIndex(secret, value) {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(`${secret}|index`),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(normalize(value)));
    return toHex(new Uint8Array(signature));
}

export async function encrypt(secret, text) {
    const key = await deriveAesKey(secret, 'field');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text));
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    return toBase64(combined);
}

export async function decrypt(secret, payload) {
    const combined = fromBase64(payload);
    const key = await deriveAesKey(secret, 'field');
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: combined.slice(0, 12) },
        key,
        combined.slice(12)
    );
    return decoder.decode(decrypted);
}

export async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 },
        material,
        256
    );
    return `pbkdf2$210000$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, stored) {
    const [algorithm, iterations, salt, expected] = String(stored).split('$');
    if (algorithm !== 'pbkdf2' || !salt || !expected) {
        return false;
    }
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(salt), iterations: Number(iterations) },
        material,
        256
    );
    const actual = new Uint8Array(bits);
    const wanted = fromBase64(expected);
    if (actual.length !== wanted.length) {
        return false;
    }
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
        difference |= actual[index] ^ wanted[index];
    }
    return difference === 0;
}

export async function tokenHash(token) {
    return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(token))));
}

export function readToken(request) {
    const cookies = request.headers.get('Cookie') || '';
    const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(request, token) {
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL}${secure}`;
}

export function clearCookie(request) {
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}
