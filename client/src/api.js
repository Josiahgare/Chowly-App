const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}


// Menu
export function getMenu() {
    return request("/menu");
}


// Staff
export function getStaff() {
    return request("/staff");
}


// Orders
export function getOrders() {
    return request("/orders");
}

export function getOrder(id) {
    return request(`/orders/${id}`);
}


// Create order
export function createOrder(items) {
    return request("/orders", {
        method: "POST",
        body: JSON.stringify({ items })
    });
}


// Assign staff / mark served
export function updateOrder(id, data) {
    return request(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}


// Complaint
export function submitComplaint(id, description) {
    return request(`/orders/${id}/complaint`, {
        method: "POST",
        body: JSON.stringify({ description })
    });
}


// Rating
export function submitRating(id, rating, comment) {
    return request(`/orders/${id}/rating`, {
        method: "POST",
        body: JSON.stringify({
            rating,
            comment
        })
    });
}


// Pretend payment
export function makePayment(id) {
    return request(`/orders/${id}/payment`, {
        method: "POST"
    });
}