CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    phone_number VARCHAR(40),
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photographer_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialization VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    avatar_url TEXT,
    cover_image_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    response_hours INTEGER NOT NULL DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio_images (
    id BIGSERIAL PRIMARY KEY,
    photographer_profile_id BIGINT NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    category VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS photography_packages (
    id BIGSERIAL PRIMARY KEY,
    photographer_profile_id BIGINT NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    duration_hours INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id BIGSERIAL PRIMARY KEY,
    photographer_profile_id BIGINT NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    booked BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (photographer_profile_id, slot_date, time_slot)
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_number VARCHAR(40) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES users(id),
    photographer_profile_id BIGINT NOT NULL REFERENCES photographer_profiles(id),
    package_id BIGINT REFERENCES photography_packages(id),
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    time_slot VARCHAR(30),
    location VARCHAR(255) NOT NULL,
    notes TEXT,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    decline_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id),
    customer_id BIGINT NOT NULL REFERENCES users(id),
    photographer_profile_id BIGINT NOT NULL REFERENCES photographer_profiles(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_inquiries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(320) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_location ON photographer_profiles(location);
CREATE INDEX IF NOT EXISTS idx_packages_profile ON photography_packages(photographer_profile_id);
CREATE INDEX IF NOT EXISTS idx_slots_profile_date ON availability_slots(photographer_profile_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_photographer ON bookings(photographer_profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
