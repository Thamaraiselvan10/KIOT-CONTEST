# KIOT Contest Management Portal

A full-stack web application for managing college technical contests in the Computer Science Engineering department.

## 🚀 Features

- **Role-Based Access**: Student, Coordinator, and Mentor roles
- **Contest Management**: Create, view, and manage technical contests
- **Team Formation**: Create teams, join existing teams for team-based contests
- **Registration System**: Individual and team registrations with deadline enforcement
- **Mentor Assignment**: Assign mentors to contests and teams
- **Real-time Chat**: Contest-level group chat for participants

## 🛠️ Tech Stack

### Frontend
- React.js with Vite
- Tailwind CSS v4
- React Router DOM
- Axios for API calls

### Backend
- Node.js with Express
- SQLite database (sql.js)
- JWT Authentication
- bcryptjs for password hashing

## 📁 Project Structure

```
KIOT-CONTEST/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context (Auth)
│   │   ├── pages/         # Page components
│   │   └── services/      # API service
│   └── ...
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── db/           # Database setup & schema
│   │   ├── middleware/   # Auth middleware
│   │   └── routes/       # API routes
│   └── ...
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Backend Setup

```bash
cd server
npm install
npm run db:init    # Initialize database with seed data
npm run dev        # Start server on http://localhost:5000
```

### Frontend Setup

```bash
cd client
npm install
npm run dev        # Start on http://localhost:3000
```

## 📋 Test Credentials

| Role        | Email             | Password   |
|-------------|-------------------|------------|
| Coordinator | admin@kiot.edu    | admin123   |
| Mentor      | mentor@kiot.edu   | mentor123  |
| Student     | student@kiot.edu  | student123 |

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Student registration
- `GET /api/auth/me` - Get current user

### Contests
- `GET /api/contests` - List all contests
- `GET /api/contests/:id` - Get contest details
- `POST /api/contests` - Create contest (Coordinator)
- `PUT /api/contests/:id` - Update contest
- `DELETE /api/contests/:id` - Delete contest

### Registrations
- `POST /api/registrations` - Register for contest
- `GET /api/registrations/my` - My registrations
- `GET /api/registrations/contest/:id` - Contest registrations

### Teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/join` - Join team
- `GET /api/teams/contest/:id` - Contest teams
- `GET /api/teams/my/all` - My teams

### Chat
- `GET /api/chat/:contestId` - Get messages
- `POST /api/chat/:contestId` - Send message

## 📝 License

MIT
