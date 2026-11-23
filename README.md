# Ecommerce Backend

A REST API for user authentication, product catalog management, and order placement. It is built with Node.js, Express, and MongoDB/Mongoose.

## Requirements

- Node.js and npm
- MongoDB
- A MongoDB replica set for order creation transactions

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/ecommerce
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_EXPIRES_IN=1h
   ```

   `JWT_EXPIRES_IN` is optional and defaults to `1h`. Set `MONGO_URI` to a MongoDB replica-set connection string to support transactional order placement.

3. Start the server:

   ```sh
   npm start
   ```

   For development with automatic restarts:

   ```sh
   npm run dev
   ```

The API is mounted at `/api/v1`. The server uses the configured `PORT`.

## Authentication and roles

Sign up and log in using the authentication endpoints below. Login returns a JWT. Send it on protected routes as:

```http
Authorization: Bearer <token>
```

New users receive the `user` role by default. Supported roles are `admin`, `user`, and `guest`. The signup endpoint does not accept a role; admin access must be provisioned separately.

## Endpoints

### Authentication

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/signup` | Public | Create an account |
| `POST` | `/api/v1/login` | Public | Authenticate and receive a JWT |
| `GET` | `/api/v1/me` | Authenticated | Get the current user's profile |
| `GET` | `/api/v1/admin-check` | Admin | Verify admin access |

Signup requires `name`, `email`, `phone`, `gender`, and `password`. Email is trimmed and normalized to lowercase. Passwords are hashed before storage. Login requires `email` and `password`.

### Products

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/products` | Public | List and filter products |
| `GET` | `/api/v1/products/:id` | Public | Get a product by ID |
| `POST` | `/api/v1/products` | Admin | Create a product |
| `PATCH` | `/api/v1/products/:id` | Admin | Update product fields |
| `DELETE` | `/api/v1/products/:id` | Admin | Delete a product |

Create a product with `name`, `category`, and non-negative numeric `price`. `stock` is optional and defaults to `0`; when provided it must be a non-negative integer. Updates accept one or more of `name`, `category`, `price`, and `stock`.

`GET /api/v1/products` supports these query parameters:

| Parameter | Description |
|---|---|
| `search` | Case-insensitive match against product name or category |
| `category` | Exact category filter |
| `minPrice`, `maxPrice` | Inclusive price bounds |
| `sortBy` | `name`, `price`, or `createdAt` (default: `createdAt`) |
| `order` | `asc` or `desc` (default: `desc`) |

The list response contains `count` and `products`.

### Orders

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/orders` | User | Place an order |
| `GET` | `/api/v1/orders/my` | User | List the current user's orders |
| `GET` | `/api/v1/orders/admin` | Admin | List all orders |

Place an order with a non-empty `items` array. Each item must have a MongoDB product ID and a positive integer quantity:

```json
{
  "items": [
    {
      "productId": "64f000000000000000000001",
      "quantity": 2
    }
  ]
}
```

The API checks product availability, decrements stock, and creates the order in a MongoDB transaction. The order stores each item's purchase-time price and calculated total. If any product is missing or stock is insufficient, the transaction is not committed.

Both order-list endpoints support:

| Parameter | Description |
|---|---|
| `page` | Positive page number (default: `1`) |
| `limit` | Results per page, from `1` to `100` (default: `10`) |
| `status` | `pending`, `processing`, `shipped`, `delivered`, or `cancelled` |
| `sortBy` | `createdAt` or `totalAmount` (default: `createdAt`) |
| `order` | `asc` or `desc` (default: `desc`) |

Order-list responses include `count`, `total`, `page`, `pages`, and `orders`. The user's endpoint only returns their own orders; the admin endpoint includes user details.

## Data models

- **User:** name, email, phone, gender, role, and hashed password.
- **Product:** name, category, price, stock, and timestamps.
- **Order:** user, items with quantity and purchase-time price, total amount, status, and timestamps.

## Testing

No test suite is configured yet. The `npm test` script currently exits with a “no test specified” message.
