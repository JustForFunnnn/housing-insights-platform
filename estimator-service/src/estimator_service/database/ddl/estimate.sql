PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS estimates (
    id TEXT PRIMARY KEY NOT NULL,
    square_footage REAL NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms REAL NOT NULL,
    year_built INTEGER NOT NULL,
    lot_size REAL NOT NULL,
    distance_to_city_center REAL NOT NULL,
    school_rating REAL NOT NULL,
    estimated_price INTEGER NOT NULL CHECK (estimated_price >= 0),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estimates_created_at_id
ON estimates (created_at DESC, id DESC);