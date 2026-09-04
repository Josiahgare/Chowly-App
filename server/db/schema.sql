CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL
        CHECK (category IN ('FOOD', 'DRINK')),
    price NUMERIC(10,2) NOT NULL
        CHECK (price >= 0),
    preparation_time INTEGER NOT NULL
        CHECK (preparation_time >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('WAITER', 'CHEF', 'BARTENDER'))
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SERVED', 'PAID')),
    estimated_wait_time INTEGER NOT NULL,
    chef_id INTEGER REFERENCES staff(id),
    bartender_id INTEGER REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    served_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL
        REFERENCES menu_items(id),
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL
        CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE
        REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL
        CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE
        REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL
        CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PAID'
        CHECK (status IN ('PAID')),
    payment_type VARCHAR(20) NOT NULL 
        CHECK (payment_type IN ('CASH', 'CARD', 'TRANSFER')),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE menu_items
ADD CONSTRAINT unique_menu_item_name UNIQUE (name);

ALTER TABLE staff
ADD CONSTRAINT unique_staff_name_role UNIQUE (name, role);

