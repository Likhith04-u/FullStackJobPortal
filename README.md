# Full Stack Job Portal

A full-stack job portal developed using React, Node.js, Express.js, and MongoDB. The application connects students looking for jobs with recruiters who want to hire candidates.

## Features

### Student Module
- Student registration and login
- Create and update student profiles
- Search and browse job listings
- View detailed job information
- Apply for jobs
- View application status

### Recruiter Module
- Recruiter registration and login
- Post new job openings
- View posted jobs
- Update existing job listings
- Delete job listings
- View applications received
- Update application statuses

### Additional Features
- Secure password hashing
- JWT-based authentication
- Role-based access control
- MongoDB database integration
- CRUD operations for job listings
- Responsive user interface

## Technology Stack

**Frontend**
- React.js
- Vite
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB

**Authentication**
- JSON Web Token (JWT)
- Password hashing

## Project Structure

```text
FullStackJobPortal/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── web/
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

## Prerequisites

Install the following software before running the project:

- Node.js
- npm
- MongoDB Community Server or MongoDB Atlas
- Visual Studio Code
- Git

## Installation and Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Likhith04-u/FullStackJobPortal.git
cd FullStackJobPortal
```

### Step 2: Configure the Backend

Open a terminal and run:

```bash
cd backend
npm install
```

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Configure the values in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fullstack_job_portal
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Use a strong, unique secret for `JWT_SECRET`. Never upload your `.env` file or credentials to GitHub.

### Step 3: Start the Backend Server

From the `backend` folder, run:

```bash
npm run dev
```

The backend should run at:

`http://localhost:5000`

### Step 4: Start the Frontend

Open a second terminal and run:

```bash
cd web
npm install
npm run dev
```

Open the local URL displayed in the terminal, usually:

`http://localhost:5173`

Make sure MongoDB is running before starting the backend.

## Database Design

The project uses MongoDB with the database name `fullstack_job_portal`.

Main collections:

- **Users:** Stores student and recruiter account information and profiles.
- **Jobs:** Stores job descriptions, requirements, locations, and recruiter ownership.
- **Applications:** Stores student applications, related job information, and application statuses.

## CRUD Operations

The application supports the following operations:

- **Create:** Register users, create job listings, and submit applications.
- **Read:** View profiles, search jobs, and view applications.
- **Update:** Edit profiles, update job listings, and change application statuses.
- **Delete:** Remove job listings owned by recruiters.

Access to protected operations should be restricted according to the user's role and ownership.

## Application Workflow

1. A student registers and logs in.
2. The student creates or updates their profile.
3. A recruiter registers and logs in.
4. The recruiter posts a job opening.
5. Students search for jobs and view job details.
6. Students apply for suitable jobs.
7. Recruiters review submitted applications.
8. Recruiters update application statuses.
9. Students track their application progress.

## Testing

To test the application:

1. Start MongoDB.
2. Start the backend server.
3. Start the React frontend.
4. Register a student account.
5. Register a recruiter account.
6. Post a job as the recruiter.
7. Apply for the job as the student.
8. Verify that the recruiter can view the application.
9. Test editing and deleting a job.
10. Verify application status updates.

## Security

- Passwords should be stored as hashes rather than plain text.
- Protected API routes should require valid authentication.
- Role-based authorization should restrict student and recruiter operations.
- Environment variables should be used for database credentials and JWT secrets.
- Sensitive configuration files and `node_modules` should not be committed to GitHub.

## Future Enhancements

- Resume upload
- Email notifications
- Advanced job filtering
- Pagination
- Recruiter analytics dashboard
- Forgot password functionality
- Online deployment

## Author

**Likhith04-u**

## License

This project was developed for educational and academic purposes.
