# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application that allows users to securely manage their glucose readings and monitor their daily and monthly records.

## Features

- **User Registration:** Create an account using name, email, and password.
- **User Login:** Secure login with password hashing and JWT authentication.
- **Personalized Dashboard:** View glucose readings associated with the logged-in account.
- **Add Readings:** Record glucose levels for different time slots.
- **View Readings:** Display saved readings grouped by date.
- **Edit Readings:** Update previously recorded glucose readings.
- **Delete Readings:** Remove existing readings.
- **Daily Reports:** View daily reading count, highest value, lowest value, and average.
- **Monthly Reports:** View current-month and previous-month reading summaries.
- **Secure API Routes:** Protect reading-related operations using JWT authentication.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML, CSS |
| Frontend Development Server | Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JSON Web Token (JWT) |
| Password Security | bcryptjs |
| API Communication | REST APIs |
| Other Tools | Git, GitHub, VS Code |

## Project Structure

```text
Sweety/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── server/
│   ├── auth.js
│   ├── db.js
│   ├── middleware.js
│   ├── readings.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── .gitignore
```

## Database Structure

The application uses PostgreSQL with two main tables.

### users

Stores registered user information.

| Column | Data Type |
|---|---|
| id | INTEGER (Primary Key) |
| name | VARCHAR(100) |
| email | VARCHAR(150) |
| password_hash | TEXT |
| created_at | TIMESTAMP |

### readings

Stores blood glucose readings associated with users.

| Column | Data Type |
|---|---|
| id | INTEGER (Primary Key) |
| user_id | INTEGER |
| reading_date | DATE |
| time_slot | VARCHAR(30) |
| glucose_level | INTEGER |
| created_at | TIMESTAMP |

## Installation and Setup

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/LikhithaRajanna/sweety_glucosetracker.git
cd sweety_glucosetracker
```

### 2. Backend Setup

Open a terminal and navigate to the server folder:

```bash
cd server
npm install
```

Create a `.env` file inside the server folder using `.env.example` as a reference.

Configure your PostgreSQL database credentials and JWT secret:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweety_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password

JWT_SECRET=your_jwt_secret
```

Make sure your PostgreSQL database and the required `users` and `readings` tables are created before starting the application.

Start the backend:

```bash
node server.js
```

The backend runs at:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal and navigate to the client folder:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in an existing user |

### Glucose Readings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/readings` | Retrieve user readings |
| POST | `/api/readings` | Add a new reading |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |
| GET | `/api/readings/reports/daily?date=YYYY-MM-DD` | Retrieve a daily report |
| GET | `/api/readings/reports/month-to-date` | Retrieve current-month report |
| GET | `/api/readings/reports/previous-month` | Retrieve previous-month report |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check whether the API is running |
| GET | `/api/health` | Check API and database connectivity |
| GET | `/api/protected` | Test JWT authentication |

## Authentication and Security

- Passwords are hashed using bcryptjs before storage.
- JWT tokens are generated during successful login.
- Protected API routes require a valid JWT token.
- Users can access and manage only their own glucose readings.
- Environment variables are used for database credentials and JWT secrets.

## Future Enhancements

- Graphical representation of glucose reading trends.
- Custom notifications and reminders.
- Additional health tracking and reporting features.

  ## Application Screenshots

### Login Page
[Sweety Login]
<img width="1902" height="907" alt="login" src="https://github.com/user-attachments/assets/8226e879-30c3-4884-b692-7f20f7bf17de" />

### Dashboard
[Sweety Dashboard]
<img width="1917" height="965" alt="dashboard" src="https://github.com/user-attachments/assets/04fe8764-341b-4bdf-886d-7b9dd831adec" />

### Add Glucose Reading
[Add Reading]
<img width="1830" height="887" alt="add-reading" src="https://github.com/user-attachments/assets/35452626-739f-42af-9b00-bf5345159232" />


### Daily and Monthly Reports
[Sweety Reports]
<img width="1901" height="892" alt="reports" src="https://github.com/user-attachments/assets/1fd5ed38-1685-4411-af21-5d09b065fdcf" />
<img width="1887" height="895" alt="reports2" src="https://github.com/user-attachments/assets/43745bb5-d183-4d3e-aeb3-33d1965ec1d1" />


## Author

**Likhitha R**

GitHub: [LikhithaRajanna](https://github.com/LikhithaRajanna)

---

*Sweety – A full-stack application for managing and tracking personal blood glucose readings.*
