import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            success: true,
            message: "Chowly API is running"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});


// ======================================================
// MENU
// ======================================================

// Get all menu items
app.get("/api/menu", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                category,
                price,
                preparation_time
            FROM menu_items
            ORDER BY category, id
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load menu"
        });
    }
});


// ======================================================
// STAFF
// ======================================================

// Get all staff
app.get("/api/staff", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                role
            FROM staff
            ORDER BY role, id
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load staff"
        });
    }
});


// ======================================================
// ORDERS
// ======================================================

// Create an order
app.post("/api/orders", async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Order must contain at least one item"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const itemIds = items.map(item => item.menu_item_id);

        const menuResult = await client.query(
            `
            SELECT
                id,
                name,
                price,
                preparation_time
            FROM menu_items
            WHERE id = ANY($1::int[])
            `,
            [itemIds]
        );

        if (menuResult.rows.length !== items.length) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "One or more menu items do not exist"
            });
        }

        let estimatedWaitTime = 0;

        for (const menuItem of menuResult.rows) {
            estimatedWaitTime = Math.max(
                estimatedWaitTime,
                menuItem.preparation_time
            );
        }

        const orderResult = await client.query(
            `
            INSERT INTO orders (estimated_wait_time)
            VALUES ($1)
            RETURNING *
            `,
            [estimatedWaitTime]
        );

        const order = orderResult.rows[0];

        for (const item of items) {
            const menuItem = menuResult.rows.find(
                menu => menu.id === Number(item.menu_item_id)
            );

            const quantity = Number(item.quantity);

            if (!quantity || quantity < 1) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Quantity must be at least 1"
                });
            }

            await client.query(
                `
                INSERT INTO order_items
                (order_id, menu_item_id, quantity, unit_price)
                VALUES ($1, $2, $3, $4)
                `,
                [
                    order.id,
                    menuItem.id,
                    quantity,
                    menuItem.price
                ]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to create order"
        });
    } finally {
        client.release();
    }
});


// ======================================================
// GET ALL ORDERS
// ======================================================

app.get("/api/orders", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                o.id,
                o.status,
                o.estimated_wait_time,
                o.created_at,
                o.served_at,

                o.chef_id,
                chef.name AS chef_name,

                o.bartender_id,
                bartender.name AS bartender_name,

                COALESCE(
                    SUM(oi.quantity * oi.unit_price),
                    0
                ) AS total

            FROM orders o

            LEFT JOIN staff chef
                ON o.chef_id = chef.id

            LEFT JOIN staff bartender
                ON o.bartender_id = bartender.id

            LEFT JOIN order_items oi
                ON o.id = oi.order_id

            GROUP BY
                o.id,
                chef.name,
                bartender.name

            ORDER BY o.created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load orders"
        });
    }
});


// ======================================================
// GET ONE ORDER
// ======================================================

app.get("/api/orders/:id", async (req, res) => {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });
    }

    try {
        const orderResult = await pool.query(
            `
            SELECT
                o.*,

                chef.name AS chef_name,
                bartender.name AS bartender_name

            FROM orders o

            LEFT JOIN staff chef
                ON o.chef_id = chef.id

            LEFT JOIN staff bartender
                ON o.bartender_id = bartender.id

            WHERE o.id = $1
            `,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const itemsResult = await pool.query(
            `
            SELECT
                oi.id,
                oi.quantity,
                oi.unit_price,

                mi.name,
                mi.category,
                mi.preparation_time

            FROM order_items oi

            JOIN menu_items mi
                ON oi.menu_item_id = mi.id

            WHERE oi.order_id = $1

            ORDER BY oi.id
            `,
            [orderId]
        );

        const total = itemsResult.rows.reduce(
            (sum, item) =>
                sum + Number(item.quantity) * Number(item.unit_price),
            0
        );

        res.json({
            success: true,
            data: {
                ...orderResult.rows[0],
                items: itemsResult.rows,
                total
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load order"
        });
    }
});


// ======================================================
// UPDATE ORDER / ASSIGN CHEF + BARTENDER
// ======================================================

app.put("/api/orders/:id", async (req, res) => {
    const orderId = Number(req.params.id);
    const { chef_id, bartender_id, status } = req.body;

    if (!Number.isInteger(orderId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });
    }

    try {
        // Validate chef
        if (chef_id) {
            const chefResult = await pool.query(
                `
                SELECT id
                FROM staff
                WHERE id = $1
                AND role = 'CHEF'
                `,
                [chef_id]
            );

            if (chefResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selected staff member is not a chef"
                });
            }
        }

        // Validate bartender
        if (bartender_id) {
            const bartenderResult = await pool.query(
                `
                SELECT id
                FROM staff
                WHERE id = $1
                AND role = 'BARTENDER'
                `,
                [bartender_id]
            );

            if (bartenderResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selected staff member is not a bartender"
                });
            }
        }

        let query;
        let values;

        if (status === "SERVED") {
            query = `
                UPDATE orders
                SET
                    chef_id = $1,
                    bartender_id = $2,
                    status = 'SERVED',
                    served_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;

            values = [chef_id || null, bartender_id || null, orderId];

        } else {
            query = `
                UPDATE orders
                SET
                    chef_id = $1,
                    bartender_id = $2
                WHERE id = $3
                RETURNING *
            `;

            values = [chef_id || null, bartender_id || null, orderId];
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            message: "Order updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update order"
        });
    }
});


// ======================================================
// COMPLAINT
// ======================================================

app.post("/api/orders/:id/complaint", async (req, res) => {
    const orderId = Number(req.params.id);
    const { description } = req.body;

    if (!Number.isInteger(orderId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });
    }

    if (!description || !description.trim()) {
        return res.status(400).json({
            success: false,
            message: "Complaint description is required"
        });
    }

    try {
        const orderCheck = await pool.query(
            "SELECT id FROM orders WHERE id = $1",
            [orderId]
        );

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO complaints
            (order_id, description)
            VALUES ($1, $2)
            RETURNING *
            `,
            [orderId, description.trim()]
        );

        res.status(201).json({
            success: true,
            message: "Complaint submitted",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to submit complaint"
        });
    }
});


// ======================================================
// RATING
// ======================================================

app.post("/api/orders/:id/rating", async (req, res) => {
    const orderId = Number(req.params.id);
    const { rating, comment } = req.body;

    if (!Number.isInteger(orderId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });
    }

    if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: "Rating must be between 1 and 5"
        });
    }

    try {
        const orderCheck = await pool.query(
            "SELECT id FROM orders WHERE id = $1",
            [orderId]
        );

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO ratings
            (order_id, rating, comment)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                orderId,
                Number(rating),
                comment?.trim() || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Rating submitted",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        // Unique constraint means the order already has a rating
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This order has already been rated"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to submit rating"
        });
    }
});


// ======================================================
// PRETEND PAYMENT
// ======================================================

app.post("/api/orders/:id/payment", async (req, res) => {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const orderResult = await client.query(
            `
            SELECT
                id,
                status
            FROM orders
            WHERE id = $1
            FOR UPDATE
            `,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orderResult.rows[0];

        if (order.status !== "SERVED") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Order must be served before payment"
            });
        }

        const totalResult = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(quantity * unit_price),
                    0
                ) AS total
            FROM order_items
            WHERE order_id = $1
            `,
            [orderId]
        );

        const amount = Number(totalResult.rows[0].total);

        const paymentResult = await client.query(
            `
            INSERT INTO payments
            (
                order_id,
                amount,
                payment_type,
                status
            )
            VALUES ($1, $2, 'PRETEND', 'PAID')
            RETURNING *
            `,
            [orderId, amount]
        );

        await client.query(
            `
            UPDATE orders
            SET status = 'PAID'
            WHERE id = $1
            `,
            [orderId]
        );

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Pretend payment recorded successfully",
            data: paymentResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("PAYMENT ERROR:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Payment has already been recorded for this order"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to process payment"
        });

    } finally {
        client.release();
    }
});


// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});


// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
    console.log(`Chowly API running on port ${PORT}`);
});