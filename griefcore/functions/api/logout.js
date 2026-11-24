import { json, readToken, tokenHash } from './_auth.js';

export async function onRequestPost({ request, env }) {
    if (!env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    const token = readToken(request);
    if (token) {
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
            .bind(await tokenHash(token))
            .run();
    }

    return json({ ok: true });
}
