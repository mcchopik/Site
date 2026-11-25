import { json } from '../_auth.js';

export async function onRequestGet({ env }) {
    if (!env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }
    const result = await env.DB.prepare('SELECT id, title, body FROM rules ORDER BY id').all();
    return json({ rules: result.results || [] });
}
