# Store Rating Web Application

A full-stack store rating platform developed as part of the Roxiler Systems FullStack Intern Coding Challenge.

The application provides role-based access for **System Administrators, Normal Users, and Store Owners**. Users can discover stores, submit ratings, and manage their ratings, while administrators manage users and stores and store owners can monitor ratings for their stores.

---

## Tech Stack

### Frontend

* React.js
* React Router
* Axios
* Lucide React
* Vite

### Backend

* Node.js
* Express.js
* JWT Authentication
* bcryptjs
* Prisma ORM

### Database

* PostgreSQL

---

## User Roles

### 1. System Administrator

Administrators can:

* View dashboard statistics
* Add new stores
* Add normal users
* Add admin users
* View and search users
* Filter users by role
* View and search stores
* Sort users and stores
* View detailed user information
* View store ratings
* Assign store owners
* Update store information
* Log out

### 2. Normal User

Normal users can:

* Sign up
* Log in
* Change their password
* View all registered stores
* Search stores by name or address
* View overall store ratings
* View their submitted rating
* Submit a rating from 1 to 5
* Modify an existing rating
* Log out

### 3. Store Owner

Store owners can:

* Log in
* Change their password
* View their stores
* View users who submitted ratings
* View individual ratings
* View average store ratings
* View rating distribution
* Log out

---

## Features

### Authentication and Authorization

* Single login system for all roles
* JWT-based authentication
* Role-based authorization
* Protected frontend routes
* Protected backend routes
* Password hashing using bcrypt
* Automatic authentication header through Axios interceptor

### Store Ratings

* Ratings range from 1 to 5
* Each user can have only one rating per store
* Existing ratings can be modified
* Overall average rating is calculated
* Number of ratings is displayed

### Search and Sorting

Users and stores support:

* Search
* Role filtering
* Ascending sorting
* Descending sorting
* Rating-based sorting

Store search supports:

* Store name
* Store address

### Validation

The application validates:

| Field    | Requirement                    |
| -------- | ------------------------------ |
| Name     | 20–60 characters               |
| Address  | Maximum 400 characters         |
| Password | 8–16 characters                |
| Password | At least one uppercase letter  |
| Password | At least one special character |
| Email    | Valid email format             |
| Rating   | Integer between 1 and 5        |

Validation is implemented on the backend and supported by frontend form validation.

---

# Project Structure

```text
Roxiler_Systems-Assignment/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── user/
│   │   │   └── owner/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── global.css
│   │
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── prisma.js
│   │   └── seedAdmin.js
│   │
│   ├── prisma.config.ts
│   ├── package.json
│   └── .env
│
└── README.md
```

---

# Database Design

The application uses PostgreSQL with Prisma ORM.

### User

Stores:

* ID
* Name
* Email
* Password hash
* Address
* Role
* Created date

### Store

Stores:

* ID
* Name
* Email
* Address
* Owner
* Created date

### Rating

Stores:

* ID
* User
* Store
* Rating
* Created date
* Updated date

A composite unique constraint ensures that a user can submit only one rating per store:

```prisma
@@unique([userId, storeId])
```

This also allows an existing rating to be updated instead of creating duplicate ratings.

---

# Installation and Setup

## Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* PostgreSQL
* Git

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Roxiler_Systems-Assignment
```

---

# Backend Setup

Open a terminal and navigate to the server:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `server` directory:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/rating_app"
JWT_SECRET="your_super_secret_key"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

---

## 2. Create the Database

Create a PostgreSQL database named:

```text
rating_app
```

For example, using PostgreSQL:

```sql
CREATE DATABASE rating_app;
```

---

## 3. Run Prisma Migrations

From the `server` directory:

```bash
npx prisma migrate dev
```

Generate the Prisma client if required:

```bash
npx prisma generate
```

---

## 4. Create the Admin Account

Run:

```bash
node src/seedAdmin.js
```

This creates the default administrator account.

### Default Admin Credentials

```text
Email: admin@example.com
Password: Admin@123
```

For production or deployment, replace these credentials with secure credentials.

---

## 5. Start the Backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

The API base URL is:

```text
http://localhost:5000/api
```

---

# Frontend Setup

Open another terminal:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# Application Flow

## Administrator

```text
Login
  ↓
Admin Dashboard
  ├── Dashboard
  ├── Users
  │    ├── Search
  │    ├── Filter
  │    ├── Sort
  │    └── User Details
  │
  └── Stores
       ├── Search
       ├── Sort
       ├── Add Store
       ├── Edit Store
       └── Store Details
```

## Normal User

```text
Signup
  ↓
Login
  ↓
Store Discovery
  ├── Search
  ├── Sort
  ├── View Rating
  └── Submit / Modify Rating
```

## Store Owner

```text
Login
  ↓
Owner Dashboard
  ├── Store Information
  ├── Average Rating
  ├── Rating Distribution
  └── Users Who Submitted Ratings
```

---

# API Overview

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
PUT  /api/auth/change-password
```

## Admin

```text
GET    /api/admin/dashboard

GET    /api/admin/users
POST   /api/admin/users
GET    /api/admin/users/:id

GET    /api/admin/stores
POST   /api/admin/stores
GET    /api/admin/stores/:id
PUT    /api/admin/stores/:id
```

## Normal User

```text
GET  /api/user/stores
POST /api/user/stores/:storeId/rating
```

## Store Owner

```text
GET /api/owner/dashboard
```

All protected endpoints require JWT authentication.

---

# Security

The application follows basic backend security practices:

* Passwords are never stored as plain text.
* Passwords are hashed using bcrypt.
* JWT is used for authentication.
* Protected API routes require authentication.
* Role-based middleware restricts access to authorized users.
* Database-level unique constraints prevent duplicate user-store ratings.
* Sensitive configuration is stored in environment variables.
* Input validation is performed on the backend.

---

# Frontend Practices

The frontend includes:

* Reusable components
* Protected routes
* Centralized Axios configuration
* JWT token interceptor
* React Context for authentication state
* Debounced search
* Request cancellation using `AbortController`
* Responsive UI
* Loading and error states
* Form validation
* Reusable global styling
* Role-based navigation

---

# Backend Practices

The backend follows a modular structure:

```text
Routes
  ↓
Authentication / Authorization Middleware
  ↓
Controllers
  ↓
Prisma ORM
  ↓
PostgreSQL
```

Responsibilities are separated between:

* Routes
* Controllers
* Middleware
* Validation utilities
* Database configuration

---

# Future Improvements

Possible improvements for a production-scale version include:

* Pagination for large user and store lists
* Refresh token based authentication
* Rate limiting
* Centralized error handling
* API request logging
* Automated testing
* Docker-based deployment
* Production database configuration
* CI/CD pipeline
* More advanced database-level rating aggregation

---

# Author

**Ruchika Sonkusare**

Full-Stack / Software Development
