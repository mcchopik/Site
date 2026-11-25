CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    username_index TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    email_index TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    avatar TEXT,
    accepted_terms INTEGER NOT NULL DEFAULT 0,
    banned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

INSERT INTO rules (title, body) SELECT '1. Общие правила', '1.1. Играя на сервере, вы автоматически соглашаетесь с данным сводом правил.
1.2. Незнание правил не освобождает от ответственности.' WHERE NOT EXISTS (SELECT 1 FROM rules WHERE title = '1. Общие правила');

INSERT INTO rules (title, body) SELECT '2. Чат и общение', '2.1. Запрещен спам, флуд и капс в глобальном чате.
2.2. Запрещена реклама сторонних проектов и ресурсов.' WHERE NOT EXISTS (SELECT 1 FROM rules WHERE title = '2. Чат и общение');
