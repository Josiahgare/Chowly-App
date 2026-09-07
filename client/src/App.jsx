import { useEffect, useState } from "react";

import {
    getMenu,
    getStaff,
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    submitComplaint,
    submitRating,
    makePayment
} from "./api";

function App() {
    const [mode, setMode] = useState("customer");

    return (
        <div className="app">
            <header className="header">
                <div className="brand">
                    <div className="brand-mark">C</div>

                    <div>
                        <h1>CHOWLY</h1>
                        <p>Restaurant Ordering System</p>
                    </div>
                </div>

                <div className="role-switch" aria-label="Choose application role">
                    <button
                        className={mode === "customer" ? "active" : ""}
                        onClick={() => setMode("customer")}
                    >
                        <span>🍽️</span>
                        Customer
                    </button>

                    <button
                        className={mode === "waiter" ? "active" : ""}
                        onClick={() => setMode("waiter")}
                    >
                        <span>👨‍🍳</span>
                        Waiter
                    </button>
                </div>
            </header>

            {mode === "customer" ? <Customer /> : <Waiter />}
        </div>
    );
}

// ======================================================
// CUSTOMER
// ======================================================

function Customer() {
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [placingOrder, setPlacingOrder] = useState(false);

    useEffect(() => {
        loadMenu();

        const savedOrderId = localStorage.getItem("chowlyOrderId");

        if (savedOrderId) {
            loadExistingOrder(savedOrderId);
        }
    }, []);

    useEffect(() => {
        const savedOrderId = localStorage.getItem("chowlyOrderId");

        if (!savedOrderId) return;

        const interval = setInterval(async () => {
            try {
                const result = await getOrder(savedOrderId);
                setOrder(result.data);
            } catch (error) {
                console.error(error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    async function loadMenu() {
        try {
            const result = await getMenu();
            setMenu(result.data);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadExistingOrder(orderId) {
        try {
            const result = await getOrder(orderId);
            setOrder(result.data);
        } catch (error) {
            console.error(error);
        }
    }

    function addToCart(item) {
        setCart((current) => {
            const existing = current.find(
                (cartItem) => cartItem.id === item.id
            );

            if (existing) {
                return current.map((cartItem) =>
                    cartItem.id === item.id
                        ? {
                              ...cartItem,
                              quantity: cartItem.quantity + 1
                          }
                        : cartItem
                );
            }

            return [
                ...current,
                {
                    ...item,
                    quantity: 1
                }
            ];
        });
    }

    function decreaseQuantity(id) {
        setCart((current) =>
            current
                .map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              quantity: item.quantity - 1
                          }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    }

    function increaseQuantity(id) {
        setCart((current) =>
            current.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          quantity: item.quantity + 1
                      }
                    : item
            )
        );
    }

    async function placeOrder() {
        if (cart.length === 0) {
            setMessage("Your cart is empty.");
            return;
        }

        try {
            setPlacingOrder(true);
            setMessage("");

            const items = cart.map((item) => ({
                menu_item_id: item.id,
                quantity: item.quantity
            }));

            const result = await createOrder(items);
            const fullOrder = await getOrder(result.data.id);

            setOrder(fullOrder.data);

            localStorage.setItem(
                "chowlyOrderId",
                fullOrder.data.id
            );

            setCart([]);
            setMessage("Order placed successfully!");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setPlacingOrder(false);
        }
    }

    if (loading) {
        return (
            <main className="container loading-screen">
                <div className="loading-spinner"></div>
                <h2>Preparing your menu...</h2>
                <p>Just a moment.</p>
            </main>
        );
    }

    const food = menu.filter(
        (item) => item.category === "FOOD"
    );

    const drinks = menu.filter(
        (item) => item.category === "DRINK"
    );

    const cartTotal = cart.reduce(
        (total, item) =>
            total +
            Number(item.price) * item.quantity,
        0
    );

    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return (
        <main className="container customer-page">

            {/* HERO */}

            <section className="hero-section">
                <div>
                    <span className="eyebrow">
                        WELCOME TO CHOWLY
                    </span>

                    <h2>
                        Good food.
                        <br />
                        <span>Simple ordering.</span>
                    </h2>

                    <p>
                        Browse the menu, build your order,
                        and let the restaurant handle the rest.
                    </p>
                </div>

                <div className="hero-icon">
                    🍽️
                </div>
            </section>

            {/* FOOD */}

            <section>
                <div className="section-heading">
                    <div>
                        <span className="section-label">
                            OUR MENU
                        </span>
                        <h2>Food</h2>
                    </div>

                    <span>
                        Freshly prepared
                    </span>
                </div>

                <div className="menu-grid">
                    {food.map((item) => (
                        <MenuCard
                            key={item.id}
                            item={item}
                            onAdd={addToCart}
                        />
                    ))}
                </div>
            </section>

            {/* DRINKS */}

            <section>
                <div className="section-heading">
                    <div>
                        <span className="section-label">
                            REFRESHMENTS
                        </span>
                        <h2>Drinks</h2>
                    </div>

                    <span>
                        Something to sip
                    </span>
                </div>

                <div className="menu-grid">
                    {drinks.map((item) => (
                        <MenuCard
                            key={item.id}
                            item={item}
                            onAdd={addToCart}
                        />
                    ))}
                </div>
            </section>

            {/* CART */}

            <section className="cart-section">
                <div className="cart-heading">
                    <div>
                        <span className="section-label">
                            YOUR SELECTION
                        </span>

                        <h2>Your Order</h2>
                    </div>

                    <div className="cart-count">
                        {cartCount}{" "}
                        {cartCount === 1 ? "item" : "items"}
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">
                            🛒
                        </div>

                        <h3>Your order is empty</h3>

                        <p>
                            Add something delicious from
                            the menu to get started.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {cart.map((item) => (
                                <div
                                    className="cart-item"
                                    key={item.id}
                                >
                                    <div className="cart-item-info">
                                        <div className="cart-item-icon">
                                            {item.category === "FOOD"
                                                ? "🍛"
                                                : "🥤"}
                                        </div>

                                        <div>
                                            <strong>
                                                {item.name}
                                            </strong>

                                            <p>
                                                ₦
                                                {Number(
                                                    item.price
                                                ).toLocaleString()}
                                                {" "}each
                                            </p>
                                        </div>
                                    </div>

                                    <div className="quantity">
                                        <button
                                            aria-label={`Decrease ${item.name}`}
                                            onClick={() =>
                                                decreaseQuantity(
                                                    item.id
                                                )
                                            }
                                        >
                                            −
                                        </button>

                                        <span>
                                            {item.quantity}
                                        </span>

                                        <button
                                            aria-label={`Increase ${item.name}`}
                                            onClick={() =>
                                                increaseQuantity(
                                                    item.id
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>

                                    <strong className="cart-line-total">
                                        ₦
                                        {(
                                            Number(item.price) *
                                            item.quantity
                                        ).toLocaleString()}
                                    </strong>
                                </div>
                            ))}
                        </div>

                        <div className="cart-total">
                            <div>
                                <span>Order total</span>
                                <strong>
                                    ₦
                                    {cartTotal.toLocaleString()}
                                </strong>
                            </div>
                        </div>

                        <button
                            className="primary-button checkout-button"
                            onClick={placeOrder}
                            disabled={placingOrder}
                        >
                            {placingOrder
                                ? "Placing Order..."
                                : "Place Order →"}
                        </button>
                    </>
                )}
            </section>

            {message && (
                <div className="message">
                    <span>✓</span>
                    {message}
                </div>
            )}

            {/* CURRENT ORDER */}

            {order && (
                <CustomerOrder
                    order={order}
                    onRefresh={async () => {
                        const result =
                            await getOrder(order.id);

                        setOrder(result.data);
                    }}
                />
            )}
        </main>
    );
}

// ======================================================
// MENU CARD
// ======================================================

function MenuCard({ item, onAdd }) {
    const [added, setAdded] = useState(false);

    function handleAdd() {
        onAdd(item);

        setAdded(true);

        setTimeout(() => {
            setAdded(false);
        }, 900);
    }

    return (
        <div className="menu-card">

            <div className="menu-card-top">
                <div className="food-icon">
                    {item.category === "FOOD"
                        ? "🍛"
                        : "🥤"}
                </div>

                <span className="category">
                    {item.category}
                </span>
            </div>

            <div className="menu-card-content">
                <h3>{item.name}</h3>

                <p className="prep">
                    <span>⏱</span>
                    Ready in {item.preparation_time} min
                </p>
            </div>

            <div className="menu-bottom">
                <strong>
                    ₦
                    {Number(item.price).toLocaleString()}
                </strong>

                <button
                    className={added ? "added" : ""}
                    onClick={handleAdd}
                >
                    {added ? "✓ Added" : "+ Add"}
                </button>
            </div>
        </div>
    );
}

// ======================================================
// CUSTOMER ORDER
// ======================================================

function CustomerOrder({ order, onRefresh }) {
    const [complaint, setComplaint] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [message, setMessage] = useState("");
    const [paying, setPaying] = useState(false);
    const [submittingComplaint, setSubmittingComplaint] =
        useState(false);
    const [submittingRating, setSubmittingRating] =
        useState(false);

    async function handleComplaint() {
        if (!complaint.trim()) {
            setMessage("Please enter your complaint.");
            return;
        }

        try {
            setSubmittingComplaint(true);

            await submitComplaint(
                order.id,
                complaint
            );

            setComplaint("");
            setMessage("Complaint submitted.");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSubmittingComplaint(false);
        }
    }

    async function handleRating() {
        try {
            setSubmittingRating(true);

            await submitRating(
                order.id,
                rating,
                comment
            );

            setComment("");
            setMessage("Thank you for your rating.");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSubmittingRating(false);
        }
    }

    async function handlePayment() {
        try {
            setPaying(true);

            const result =
                await makePayment(order.id);

            setMessage(result.message);

            await onRefresh();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setPaying(false);
        }
    }

    return (
        <section className="order-card">

            <div className="order-header">
                <div>
                    <span className="section-label">
                        CURRENT ORDER
                    </span>

                    <h2>
                        Order #{order.id}
                    </h2>
                </div>

                <span
                    className={`status ${order.status.toLowerCase()}`}
                >
                    <span className="status-dot"></span>
                    {order.status}
                </span>
            </div>

            <div className="order-progress">
                <div
                    className={
                        order.status === "PENDING" ||
                        order.status === "SERVED" ||
                        order.status === "PAID"
                            ? "progress-step active"
                            : "progress-step"
                    }
                >
                    <span>1</span>
                    <small>Order placed</small>
                </div>

                <div
                    className={
                        order.status === "SERVED" ||
                        order.status === "PAID"
                            ? "progress-line active"
                            : "progress-line"
                    }
                ></div>

                <div
                    className={
                        order.status === "SERVED" ||
                        order.status === "PAID"
                            ? "progress-step active"
                            : "progress-step"
                    }
                >
                    <span>2</span>
                    <small>Served</small>
                </div>

                <div
                    className={
                        order.status === "PAID"
                            ? "progress-line active"
                            : "progress-line"
                    }
                ></div>

                <div
                    className={
                        order.status === "PAID"
                            ? "progress-step active"
                            : "progress-step"
                    }
                >
                    <span>3</span>
                    <small>Paid</small>
                </div>
            </div>

            <div className="order-info">
                <div>
                    <span>Estimated wait</span>
                    <strong>
                        {order.estimated_wait_time} min
                    </strong>
                </div>

                <div>
                    <span>Total</span>
                    <strong>
                        ₦
                        {Number(
                            order.total
                        ).toLocaleString()}
                    </strong>
                </div>
            </div>

            <div className="order-items-section">
                <h3>Order items</h3>

                {order.items.map((item) => (
                    <div
                        className="order-item"
                        key={item.id}
                    >
                        <span>
                            {item.name}
                            {" × "}
                            {item.quantity}
                        </span>

                        <strong>
                            ₦
                            {(
                                Number(item.unit_price) *
                                item.quantity
                            ).toLocaleString()}
                        </strong>
                    </div>
                ))}
            </div>

            {(order.chef_name ||
                order.bartender_name) && (
                <div className="staff-info">
                    {order.chef_name && (
                        <div>
                            <span>👨‍🍳</span>
                            <div>
                                <small>Chef</small>
                                <strong>
                                    {order.chef_name}
                                </strong>
                            </div>
                        </div>
                    )}

                    {order.bartender_name && (
                        <div>
                            <span>🍹</span>
                            <div>
                                <small>Bartender</small>
                                <strong>
                                    {order.bartender_name}
                                </strong>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PAYMENT */}

            {order.status === "SERVED" && (
                <div className="payment-box">
                    <div className="payment-icon">
                        💳
                    </div>

                    <div>
                        <span className="section-label">
                            READY FOR PAYMENT
                        </span>

                        <h3>Complete your order</h3>

                        <p>
                            This is a{" "}
                            <strong>
                                pretend payment
                            </strong>
                            . No real money will be
                            charged.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={handlePayment}
                        disabled={paying}
                    >
                        {paying
                            ? "Processing..."
                            : `Pay ₦${Number(
                                  order.total
                              ).toLocaleString()}`}
                    </button>
                </div>
            )}

            {order.status === "PAID" && (
                <div className="success-box">
                    <div className="success-icon">
                        ✓
                    </div>

                    <div>
                        <strong>
                            Payment recorded successfully
                        </strong>

                        <small>
                            Pretend payment — no real
                            money was charged.
                        </small>
                    </div>
                </div>
            )}

            {/* FEEDBACK */}

            <div className="feedback-grid">

                <div className="feedback-box">
                    <span className="section-label">
                        FEEDBACK
                    </span>

                    <h3>Having a problem?</h3>

                    <p>
                        Let us know what went wrong.
                    </p>

                    <textarea
                        placeholder="Tell us what went wrong..."
                        value={complaint}
                        onChange={(e) =>
                            setComplaint(
                                e.target.value
                            )
                        }
                    />

                    <button
                        className="secondary-button"
                        onClick={handleComplaint}
                        disabled={submittingComplaint}
                    >
                        {submittingComplaint
                            ? "Submitting..."
                            : "Submit Complaint"}
                    </button>
                </div>

                <div className="feedback-box">
                    <span className="section-label">
                        YOUR EXPERIENCE
                    </span>

                    <h3>Rate your experience</h3>

                    <p>
                        How was your Chowly experience?
                    </p>

                    <div className="stars">
                        {[1, 2, 3, 4, 5].map(
                            (number) => (
                                <button
                                    key={number}
                                    className={
                                        number <= rating
                                            ? "selected-star"
                                            : ""
                                    }
                                    onClick={() =>
                                        setRating(
                                            number
                                        )
                                    }
                                    aria-label={`${number} star rating`}
                                >
                                    ★
                                </button>
                            )
                        )}
                    </div>

                    <textarea
                        placeholder="Optional comment"
                        value={comment}
                        onChange={(e) =>
                            setComment(
                                e.target.value
                            )
                        }
                    />

                    <button
                        className="secondary-button"
                        onClick={handleRating}
                        disabled={submittingRating}
                    >
                        {submittingRating
                            ? "Submitting..."
                            : "Submit Rating"}
                    </button>
                </div>

            </div>

            {message && (
                <div className="message">
                    <span>✓</span>
                    {message}
                </div>
            )}
        </section>
    );
}

// ======================================================
// WAITER
// ======================================================

function Waiter() {
    const [orders, setOrders] = useState([]);
    const [staff, setStaff] = useState([]);
    const [selectedOrder, setSelectedOrder] =
        useState(null);
    const [chef, setChef] = useState("");
    const [bartender, setBartender] = useState("");
    const [message, setMessage] = useState("");
    const [refreshing, setRefreshing] =
        useState(false);
    const [saving, setSaving] = useState(false);
    const [serving, setServing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [
                ordersResult,
                staffResult
            ] = await Promise.all([
                getOrders(),
                getStaff()
            ]);

            setOrders(ordersResult.data);
            setStaff(staffResult.data);
        } catch (error) {
            setMessage(error.message);
        }
    }

    async function refreshData() {
        try {
            setRefreshing(true);
            await loadData();
        } finally {
            setRefreshing(false);
        }
    }

    function openOrder(order) {
        setSelectedOrder(order);
        setChef(order.chef_id || "");
        setBartender(order.bartender_id || "");
    }

    async function saveOrder() {
        if (!selectedOrder) return;

        try {
            setSaving(true);

            await updateOrder(
                selectedOrder.id,
                {
                    chef_id: chef || null,
                    bartender_id:
                        bartender || null
                }
            );

            setMessage(
                "Staff assignment saved."
            );

            await loadData();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function markServed() {
        if (!selectedOrder) return;

        if (!chef || !bartender) {
            setMessage(
                "Select both a chef and bartender first."
            );
            return;
        }

        try {
            setServing(true);

            await updateOrder(
                selectedOrder.id,
                {
                    chef_id: chef,
                    bartender_id: bartender,
                    status: "SERVED"
                }
            );

            setMessage(
                "Order marked as served."
            );

            setSelectedOrder(null);

            await loadData();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setServing(false);
        }
    }

    const chefs = staff.filter(
        (person) => person.role === "CHEF"
    );

    const bartenders = staff.filter(
        (person) => person.role === "BARTENDER"
    );

    const pendingCount = orders.filter(
        (order) => order.status === "PENDING"
    ).length;

    const servedCount = orders.filter(
        (order) => order.status === "SERVED"
    ).length;

    const paidCount = orders.filter(
        (order) => order.status === "PAID"
    ).length;

    return (
        <main className="container waiter-page">

            {/* DASHBOARD HEADER */}

            <section className="dashboard-hero">
                <div>
                    <span className="eyebrow">
                        OPERATIONS
                    </span>

                    <h2>Waiter Dashboard</h2>

                    <p>
                        Manage orders and coordinate
                        restaurant staff.
                    </p>
                </div>

                <button
                    className="secondary-button refresh-button"
                    onClick={refreshData}
                    disabled={refreshing}
                >
                    <span>↻</span>
                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </section>

            {/* STATS */}

            <div className="dashboard-stats">

                <div className="stat-card">
                    <div className="stat-icon pending-icon">
                        🕐
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon served-icon">
                        🍽️
                    </div>

                    <div>
                        <span>Served</span>
                        <strong>{servedCount}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon paid-icon">
                        ✓
                    </div>

                    <div>
                        <span>Paid</span>
                        <strong>{paidCount}</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon total-icon">
                        📋
                    </div>

                    <div>
                        <span>Total orders</span>
                        <strong>{orders.length}</strong>
                    </div>
                </div>

            </div>

            {message && (
                <div className="message">
                    <span>✓</span>
                    {message}
                </div>
            )}

            {/* ORDERS */}

            <section className="dashboard-section">
                <div className="section-heading">
                    <div>
                        <span className="section-label">
                            LIVE ORDERS
                        </span>

                        <h2>Restaurant Orders</h2>
                    </div>

                    <span>
                        {orders.length} total
                    </span>
                </div>

                <div className="orders-list">
                    {orders.length === 0 ? (
                        <div className="empty-orders">
                            <div>📋</div>

                            <h3>No orders yet</h3>

                            <p>
                                New customer orders will
                                appear here.
                            </p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div
                                className="waiter-order"
                                key={order.id}
                            >
                                <div className="waiter-order-main">
                                    <div className="order-number">
                                        #{order.id}
                                    </div>

                                    <div>
                                        <span className="order-caption">
                                            Restaurant order
                                        </span>

                                        <h3>
                                            Order #{order.id}
                                        </h3>

                                        <p>
                                            Total: ₦
                                            {Number(
                                                order.total
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="waiter-order-actions">
                                    <span
                                        className={`status ${order.status.toLowerCase()}`}
                                    >
                                        <span className="status-dot"></span>
                                        {order.status}
                                    </span>

                                    <button
                                        className="secondary-button"
                                        onClick={() =>
                                            openOrder(order)
                                        }
                                    >
                                        Open →
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* ASSIGNMENT */}

            {selectedOrder && (
                <section className="assignment-card">

                    <div className="order-header">
                        <div>
                            <span className="section-label">
                                ORDER MANAGEMENT
                            </span>

                            <h2>
                                Order #{selectedOrder.id}
                            </h2>
                        </div>

                        <button
                            className="close-button"
                            onClick={() =>
                                setSelectedOrder(null)
                            }
                            aria-label="Close order"
                        >
                            ×
                        </button>
                    </div>

                    <div className="assignment-intro">
                        <p>
                            Assign the team members
                            responsible for preparing
                            this order.
                        </p>
                    </div>

                    <div className="assignment-grid">

                        <div className="assignment-field">
                            <label>
                                <span>👨‍🍳</span>
                                Chef
                            </label>

                            <select
                                value={chef}
                                onChange={(e) =>
                                    setChef(
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Select chef
                                </option>

                                {chefs.map((person) => (
                                    <option
                                        key={person.id}
                                        value={person.id}
                                    >
                                        {person.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="assignment-field">
                            <label>
                                <span>🍹</span>
                                Bartender
                            </label>

                            <select
                                value={bartender}
                                onChange={(e) =>
                                    setBartender(
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Select bartender
                                </option>

                                {bartenders.map(
                                    (person) => (
                                        <option
                                            key={person.id}
                                            value={person.id}
                                        >
                                            {person.name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                    </div>

                    <div className="assignment-actions">

                        <button
                            className="secondary-button"
                            onClick={saveOrder}
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Assignment"}
                        </button>

                        {selectedOrder.status ===
                            "PENDING" && (
                            <button
                                className="primary-button"
                                onClick={markServed}
                                disabled={serving}
                            >
                                {serving
                                    ? "Updating..."
                                    : "Mark as Served ✓"}
                            </button>
                        )}

                    </div>
                </section>
            )}
        </main>
    );
}

export default App;