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

Create a `.env` file in the `server` directory containing the required PostgreSQL connection details.

Example:

```env
DATABASE_URL=<YOUR_DATABASE_URL>
PORT=3001
```

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

## Deployment

The Chowly application is deployed using Render.

The frontend is deployed as a **Render Static Site**, while the backend is deployed as a **Render Web Service**.

The production frontend communicates with the deployed backend through the `VITE_API_URL` environment variable.

The PostgreSQL database is hosted using **Render PostgreSQL**.

## Live Application

**Frontend:** [<YOUR-FRONTEND-URL>](https://chowly-client.onrender.com)

**Backend API:** [<YOUR-BACKEND-URL>](https://chowly-api-dl7u.onrender.com/api/health)

## GitHub Repository

**Repository:** [<YOUR-GITHUB-REPOSITORY-URL>](https://github.com/Josiahgare/Chowly-App)

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
