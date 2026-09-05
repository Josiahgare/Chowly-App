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
                <div>
                    <h1>CHOWLY</h1>
                    <p>Restaurant Ordering System</p>
                </div>

                <div className="role-switch">
                    <button
                        className={mode === "customer" ? "active" : ""}
                        onClick={() => setMode("customer")}
                    >
                        Customer
                    </button>

                    <button
                        className={mode === "waiter" ? "active" : ""}
                        onClick={() => setMode("waiter")}
                    >
                        Waiter
                    </button>
                </div>
            </header>

            {mode === "customer" ? (
                <Customer />
            ) : (
                <Waiter />
            )}
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
        setCart(current => {
            const existing = current.find(
                cartItem => cartItem.id === item.id
            );

            if (existing) {
                return current.map(cartItem =>
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
        setCart(current =>
            current
                .map(item =>
                    item.id === id
                        ? {
                            ...item,
                            quantity: item.quantity - 1
                        }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    }

    function increaseQuantity(id) {
        setCart(current =>
            current.map(item =>
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
            setMessage("");

            const items = cart.map(item => ({
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
        }
    }

    if (loading) {
        return <main className="container">Loading menu...</main>;
    }

    const food = menu.filter(item => item.category === "FOOD");
    const drinks = menu.filter(item => item.category === "DRINK");

    const cartTotal = cart.reduce(
        (total, item) =>
            total + Number(item.price) * item.quantity,
        0
    );

    return (
        <main className="container">

            <section>
                <div className="section-heading">
                    <h2>Food Menu</h2>
                    <span>Freshly prepared</span>
                </div>

                <div className="menu-grid">
                    {food.map(item => (
                        <MenuCard
                            key={item.id}
                            item={item}
                            onAdd={addToCart}
                        />
                    ))}
                </div>
            </section>


            <section>
                <div className="section-heading">
                    <h2>Drinks</h2>
                    <span>Something to sip</span>
                </div>

                <div className="menu-grid">
                    {drinks.map(item => (
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
                <div className="section-heading">
                    <h2>Your Order</h2>
                    <span>
                        {cart.length} item type(s)
                    </span>
                </div>

                {cart.length === 0 ? (
                    <p className="empty">
                        Your order is empty. Add something delicious!
                    </p>
                ) : (
                    <>
                        {cart.map(item => (
                            <div
                                className="cart-item"
                                key={item.id}
                            >
                                <div>
                                    <strong>{item.name}</strong>
                                    <p>
                                        ₦{Number(item.price).toLocaleString()}
                                    </p>
                                </div>

                                <div className="quantity">
                                    <button
                                        onClick={() =>
                                            decreaseQuantity(item.id)
                                        }
                                    >
                                        −
                                    </button>

                                    <span>{item.quantity}</span>

                                    <button
                                        onClick={() =>
                                            increaseQuantity(item.id)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="cart-total">
                            <strong>Total</strong>
                            <strong>
                                ₦{cartTotal.toLocaleString()}
                            </strong>
                        </div>

                        <button
                            className="primary-button"
                            onClick={placeOrder}
                        >
                            Place Order
                        </button>
                    </>
                )}
            </section>


            {message && (
                <div className="message">
                    {message}
                </div>
            )}


            {/* CURRENT ORDER */}

            {order && (
                <CustomerOrder
                    order={order}
                    onRefresh={async () => {
                        const result = await getOrder(order.id);
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
    return (
        <div className="menu-card">
            <div>
                <span className="category">
                    {item.category}
                </span>

                <h3>{item.name}</h3>

                <p className="prep">
                    Preparation: {item.preparation_time} min
                </p>
            </div>

            <div className="menu-bottom">
                <strong>
                    ₦{Number(item.price).toLocaleString()}
                </strong>

                <button onClick={() => onAdd(item)}>
                    Add
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

    async function handleComplaint() {
        if (!complaint.trim()) {
            setMessage("Please enter your complaint.");
            return;
        }

        try {
            await submitComplaint(
                order.id,
                complaint
            );

            setComplaint("");
            setMessage("Complaint submitted.");
        } catch (error) {
            setMessage(error.message);
        }
    }

    async function handleRating() {
        try {
            await submitRating(
                order.id,
                rating,
                comment
            );

            setComment("");
            setMessage("Thank you for your rating.");
        } catch (error) {
            setMessage(error.message);
        }
    }

    async function handlePayment() {
        try {
            const result = await makePayment(order.id);

            setMessage(result.message);

            await onRefresh();
        } catch (error) {
            setMessage(error.message);
        }
    }

    return (
        <section className="order-card">

            <div className="order-header">
                <div>
                    <span>Order</span>
                    <h2>#{order.id}</h2>
                </div>

                <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                </span>
            </div>


            <div className="order-info">

                <div>
                    <span>Estimated wait</span>
                    <strong>
                        {order.estimated_wait_time} minutes
                    </strong>
                </div>

                <div>
                    <span>Total</span>
                    <strong>
                        ₦{Number(order.total).toLocaleString()}
                    </strong>
                </div>

            </div>


            <h3>Items</h3>

            {order.items.map(item => (
                <div
                    className="order-item"
                    key={item.id}
                >
                    <span>
                        {item.name} × {item.quantity}
                    </span>

                    <strong>
                        ₦{(
                            Number(item.unit_price) *
                            item.quantity
                        ).toLocaleString()}
                    </strong>
                </div>
            ))}


            {order.chef_name && (
                <p>
                    <strong>Chef:</strong>{" "}
                    {order.chef_name}
                </p>
            )}

            {order.bartender_name && (
                <p>
                    <strong>Bartender:</strong>{" "}
                    {order.bartender_name}
                </p>
            )}


            {/* PAYMENT */}

            {order.status === "SERVED" && (
                <div className="payment-box">
                    <h3>Payment</h3>

                    <p>
                        This is a <strong>pretend payment</strong>.
                        No real money will be charged.
                    </p>

                    <button
                        className="primary-button"
                        onClick={handlePayment}
                    >
                        Pay ₦{Number(order.total).toLocaleString()}
                    </button>
                </div>
            )}


            {order.status === "PAID" && (
                <div className="success-box">
                    ✓ Payment recorded successfully.
                    <br />
                    <small>
                        Pretend payment — no real money was charged.
                    </small>
                </div>
            )}


            {/* COMPLAINT */}

            <div className="feedback-box">
                <h3>Having a problem?</h3>

                <textarea
                    placeholder="Tell us what went wrong..."
                    value={complaint}
                    onChange={e =>
                        setComplaint(e.target.value)
                    }
                />

                <button
                    className="secondary-button"
                    onClick={handleComplaint}
                >
                    Submit Complaint
                </button>
            </div>


            {/* RATING */}

            <div className="feedback-box">
                <h3>Rate your experience</h3>

                <div className="stars">
                    {[1, 2, 3, 4, 5].map(number => (
                        <button
                            key={number}
                            className={
                                number <= rating
                                    ? "selected-star"
                                    : ""
                            }
                            onClick={() =>
                                setRating(number)
                            }
                        >
                            ★
                        </button>
                    ))}
                </div>

                <textarea
                    placeholder="Optional comment"
                    value={comment}
                    onChange={e =>
                        setComment(e.target.value)
                    }
                />

                <button
                    className="secondary-button"
                    onClick={handleRating}
                >
                    Submit Rating
                </button>
            </div>


            {message && (
                <div className="message">
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
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [chef, setChef] = useState("");
    const [bartender, setBartender] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [ordersResult, staffResult] =
                await Promise.all([
                    getOrders(),
                    getStaff()
                ]);

            setOrders(ordersResult.data);
            setStaff(staffResult.data);
        } catch (error) {
            setMessage(error.message);
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
            await updateOrder(
                selectedOrder.id,
                {
                    chef_id: chef || null,
                    bartender_id: bartender || null
                }
            );

            setMessage("Staff assignment saved.");

            await loadData();
        } catch (error) {
            setMessage(error.message);
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
            await updateOrder(
                selectedOrder.id,
                {
                    chef_id: chef,
                    bartender_id: bartender,
                    status: "SERVED"
                }
            );

            setMessage("Order marked as served.");

            setSelectedOrder(null);

            await loadData();
        } catch (error) {
            setMessage(error.message);
        }
    }

    const chefs = staff.filter(
        person => person.role === "CHEF"
    );

    const bartenders = staff.filter(
        person => person.role === "BARTENDER"
    );

    return (
        <main className="container waiter-page">

            <div className="section-heading">
                <div>
                    <h2>Waiter Dashboard</h2>
                    <span>Manage restaurant orders</span>
                </div>

                <button
                    className="secondary-button"
                    onClick={loadData}
                >
                    Refresh
                </button>
            </div>


            {message && (
                <div className="message">
                    {message}
                </div>
            )}


            <div className="orders-list">

                {orders.length === 0 ? (
                    <p className="empty">
                        No orders yet.
                    </p>
                ) : (
                    orders.map(order => (
                        <div
                            className="waiter-order"
                            key={order.id}
                        >
                            <div>
                                <span>Order</span>

                                <h3>
                                    #{order.id}
                                </h3>

                                <p>
                                    Total: ₦
                                    {Number(
                                        order.total
                                    ).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <span
                                    className={`status ${order.status.toLowerCase()}`}
                                >
                                    {order.status}
                                </span>

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        openOrder(order)
                                    }
                                >
                                    Open
                                </button>
                            </div>
                        </div>
                    ))
                )}

            </div>


            {/* ORDER MANAGEMENT */}

            {selectedOrder && (
                <div className="assignment-card">

                    <div className="order-header">
                        <div>
                            <span>Managing</span>
                            <h2>
                                Order #{selectedOrder.id}
                            </h2>
                        </div>

                        <button
                            className="close-button"
                            onClick={() =>
                                setSelectedOrder(null)
                            }
                        >
                            ×
                        </button>
                    </div>


                    <h3>Assign Chef</h3>

                    <select
                        value={chef}
                        onChange={e =>
                            setChef(e.target.value)
                        }
                    >
                        <option value="">
                            Select chef
                        </option>

                        {chefs.map(person => (
                            <option
                                key={person.id}
                                value={person.id}
                            >
                                {person.name}
                            </option>
                        ))}
                    </select>


                    <h3>Assign Bartender</h3>

                    <select
                        value={bartender}
                        onChange={e =>
                            setBartender(e.target.value)
                        }
                    >
                        <option value="">
                            Select bartender
                        </option>

                        {bartenders.map(person => (
                            <option
                                key={person.id}
                                value={person.id}
                            >
                                {person.name}
                            </option>
                        ))}
                    </select>


                    <div className="assignment-actions">

                        <button
                            className="secondary-button"
                            onClick={saveOrder}
                        >
                            Save Assignment
                        </button>

                        {selectedOrder.status === "PENDING" && (
                            <button
                                className="primary-button"
                                onClick={markServed}
                            >
                                Mark as Served
                            </button>
                        )}

                    </div>

                </div>
            )}

        </main>
    );
}

export default App;