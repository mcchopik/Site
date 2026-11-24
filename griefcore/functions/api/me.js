import { decrypt, json, readToken, tokenHash } from './_auth.js';

export async function onRequestGet({ request, env }) {
    if (!env.AUTH_SECRET || !env.DB) {
        return json({ user: null }, 401);
    }

    const token = readToken(request);
    if (!token) {
        return json({ user: null }, 401);
    }

    const row = await env.DB.prepare(
        `SELECT users.username, users.email
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ? AND sessions.expires_at > ?`
    )
        .bind(await tokenHash(token), Math.floor(Date.now() / 1000))
        .first();

    if (!row) {
        return json({ user: null }, 401);
    }

    return json({
        user: {
            username: await decrypt(env.AUTH_SECRET, row.username),
            email: await decrypt(env.AUTH_SECRET, row.email),
        },
    });
}
