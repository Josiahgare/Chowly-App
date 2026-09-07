# Chowly

Chowly is a full-stack restaurant ordering and management application that allows customers to browse a menu, place orders, and interact with restaurant staff through an order management workflow.

The application demonstrates a complete full-stack implementation with a React frontend, Node.js/Express backend, PostgreSQL database, and cloud deployment using Render.

## Features

* Browse food and drink menu items
* View item prices and preparation times
* Place restaurant orders
* Calculate estimated order wait time
* View existing orders
* Assign chefs and bartenders to orders
* Update order status
* Mark orders as served
* Record pretend payments
* Submit complaints
* Submit ratings and comments
* Persistent data storage using PostgreSQL
* Production deployment with separate frontend and backend services

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express.js
* PostgreSQL
* `pg` PostgreSQL client
* CORS
* dotenv

### Database

* PostgreSQL
* Relational database design
* Foreign keys and constraints

### Deployment

* Render
* GitHub
* GitHub Actions

## Application Architecture

Chowly uses a three-layer architecture:

**Frontend → Backend API → PostgreSQL Database**

The React frontend communicates with the Express REST API. The backend handles business logic, validates requests, and communicates with PostgreSQL for persistent data storage.

The production frontend and backend are deployed separately on Render.

## Database Design

The application uses seven main tables:

* `menu_items` — stores available food and drink items
* `staff` — stores restaurant staff members and their roles
* `orders` — stores customer orders and their status
* `order_items` — stores the individual items belonging to each order
* `complaints` — stores customer complaints
* `ratings` — stores customer ratings and comments
* `payments` — stores pretend payment records

That is seven tables in total: two lookup/entity tables (`menu_items`, `staff`), the order core (`orders`, `order_items`), and three per-order records (`complaints`, `ratings`, `payments`).

The database uses primary keys, foreign keys, unique constraints, and `CHECK` constraints to maintain data integrity.

The database schema is provided in `schema.sql`, while sample data is provided in `seed.sql`.

## Project Structure

```text
Chowly/
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

## Local Setup

### 1. Clone the Repository

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd Chowly
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure the Backend Environment

Create a `.env` file in the `server` directory containing the required PostgreSQL connection details. See `.env.example` for the full list of supported variables.

The backend accepts either a single connection string or discrete connection variables. If `DATABASE_URL` is set, it takes precedence.

**Option A — single connection string (recommended for hosted databases such as Render):**

```env
PORT=3001
DATABASE_URL=<YOUR_DATABASE_URL>
```

**Option B — discrete variables (handy for local development):**

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5433
DB_USER=<YOUR_USERNAME>
DB_PASSWORD=<YOUR_PASSWORD>
DB_NAME=<YOUR_DATABASE_NAME>
```

SSL is enabled automatically in production when using `DATABASE_URL`. To force SSL on or off locally, set `PGSSL=true` or `PGSSL=false`.

> **Important:** Do not commit `.env` or database credentials to GitHub.

### 4. Start the Backend

```bash
npm start
```

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

### 6. Configure the Frontend

Create the required frontend environment variable:

```env
VITE_API_URL=http://localhost:3001/api
```

### 7. Start the Frontend

```bash
npm run dev
```

The application can then be accessed through the local Vite development URL.

## API Endpoints

| Method | Endpoint                    | Description               |
| ------ | --------------------------- | ------------------------- |
| `GET`  | `/api/health`               | Check API status          |
| `GET`  | `/api/menu`                 | Retrieve menu items       |
| `GET`  | `/api/staff`                | Retrieve staff            |
| `POST` | `/api/orders`               | Create an order           |
| `GET`  | `/api/orders`               | Retrieve orders           |
| `GET`  | `/api/orders/:id`           | Retrieve a specific order |
| `PUT`  | `/api/orders/:id`           | Update an order           |
| `POST` | `/api/orders/:id/complaint` | Submit a complaint        |
| `POST` | `/api/orders/:id/rating`    | Submit a rating           |
| `POST` | `/api/orders/:id/payment`   | Record pretend payment    |

## Application Behaviour (Feature by Feature)

This section describes what happens at every step of the story, from menu to payment.

### Menu browsing (Customer)

A customer opens the app at a table and lands in **Customer** mode. The app loads the menu from `GET /api/menu` and splits items into **Food** and **Drinks**. Each card shows the item name, price (in ₦), and preparation time ("Ready in _n_ min"). Pressing **+ Add** places the item in the cart; adding the same item again increases its quantity.

### Order placement (Customer)

The cart shows each selected item with quantity steppers and a running order total. Pressing **Place Order** sends the cart to `POST /api/orders`. The backend validates every item exists, creates the order inside a database transaction, and stores each line with its unit price. The estimated wait time is calculated as the **longest preparation time** among the ordered items (items are prepared in parallel, so the order is ready when the slowest item is ready). The customer is then shown the order details: order number, status, estimated wait, itemised list, and total. The order id is saved in `localStorage`, so a page refresh restores the current order, and the order view polls every few seconds to reflect status changes made by the waiter.

### Order assignment (Waiter)

Switching to **Waiter** mode shows a dashboard of all orders (`GET /api/orders`) with counts for Pending, Served, Paid, and Total. Opening an order reveals an assignment panel where the waiter records the **chef** and **bartender** from a staff list loaded via `GET /api/staff`. Saving sends `PUT /api/orders/:id` with the assigned staff ids; the backend validates that the chosen chef actually has the `CHEF` role and the bartender has the `BARTENDER` role. Pressing **Mark as Served** requires both a chef and bartender to be selected, then sets the order status to `SERVED` and stamps `served_at`.

### Complaint and rating (Customer)

From the current order view, the customer can submit a complaint (`POST /api/orders/:id/complaint`) describing what went wrong, and a star rating from 1 to 5 with an optional comment (`POST /api/orders/:id/rating`). Both are stored against that specific order. Each order may be rated once — a duplicate rating is rejected by a unique constraint and reported back to the customer.

### Payment (Customer)

Once an order is marked **Served**, a payment panel appears, clearly labelled as a **pretend payment**. Pressing **Pay ₦_total_** calls `POST /api/orders/:id/payment`. The backend re-checks that the order is served, computes the amount from the stored line items inside a transaction, records a payment row (`payment_type = 'PRETEND'`, `status = 'PAID'`), and flips the order status to `PAID`. The customer then sees a confirmation that a pretend payment was recorded and no real money was charged.

## How to Use It (Walkthrough)

A stranger can follow these steps on the deployed link:

1. Open the frontend URL. You start as a **Customer**.
2. Browse the **Food** and **Drinks** menus and press **+ Add** on the items you want. Adjust quantities in the cart.
3. Press **Place Order**. You will see your order number, estimated wait time, items, and total.
4. **Switch roles** using the **Customer / Waiter** toggle in the top-right of the header. No login is required — the switch is all you need.
5. In **Waiter** mode, find the order in the dashboard and press **Open**. Select a **chef** and a **bartender**, then press **Mark as Served**.
6. **Switch back to Customer.** The order now shows as *Served*, and a **pretend payment** button appears. Press it to pay.
7. Optionally, submit a **complaint** and a **star rating** on the order from the customer view.
8. Refresh the page at any point — your current order is restored from storage, and all data persists in the database.

## How AI Was Used

AI was used as a working tool throughout this build, in line with the assignment's requirement to work with it.

**Tools used**

* **ChatGPT** — used for planning, drafting the schema and route logic, and working through problems in conversation.
* **Kiro** — an AI development environment used inside the editor for scaffolding, code review, refactoring, and debugging directly against the codebase.

**What AI was asked to do**

* Scaffold the Express route handlers and the React component structure (customer view, waiter dashboard, order/feedback panels).
* Draft the PostgreSQL schema with appropriate constraints (checks, foreign keys, unique constraints).
* Review the codebase against the assignment requirements and flag gaps.
* Suggest fixes for configuration and deployment issues.

**What was accepted**

* The transactional order-creation and payment logic, including the "must be served before payment" guard and the max-preparation-time wait calculation.
* The schema design with `CHECK` constraints and `ON DELETE CASCADE`, and unique constraints on one rating/payment per order.
* The role-switch UX and the per-order feedback flow.

**What was rejected or changed**

* Suggestions to over-engineer (for example, adding authentication/logins) were rejected, because the assignment explicitly says a simple role switch is enough.
* Any generated copy or links containing placeholders were removed in favour of the real deployed URLs.

**What had to be corrected manually**

* The database connection was corrected to support a single `DATABASE_URL` (as used by Render) in addition to discrete connection variables, and to enable SSL for the hosted database. The initial version only read discrete variables and had no SSL handling, which would have failed against Render PostgreSQL.
* Documentation was aligned with the actual code (environment variables, table count, and deployment links).

## Deployment

The Chowly application is deployed using Render.

The frontend is deployed as a **Render Static Site**, while the backend is deployed as a **Render Web Service**.

The production frontend communicates with the deployed backend through the `VITE_API_URL` environment variable.

The PostgreSQL database is hosted using **Render PostgreSQL**.

## Live Application

**Frontend:** https://chowly-client.onrender.com

**Backend API:** https://chowly-api-dl7u.onrender.com/api/health

## GitHub Repository

**Repository:** https://github.com/Josiahgare/Chowly-App

## Testing

The deployed application was tested from the live frontend through the production backend and database.

The following functionality was verified:

* Menu retrieval
* Staff retrieval
* Order retrieval
* Order creation
* Order management
* Payment workflow
* Complaint submission
* Rating submission
* Database persistence
* Frontend-to-backend communication

The complete production application successfully passed end-to-end testing.

## Project Status

**Status: Complete and Deployed**

Chowly is currently deployed and accessible through its production frontend URL. The application uses a persistent PostgreSQL database and a RESTful backend API.
