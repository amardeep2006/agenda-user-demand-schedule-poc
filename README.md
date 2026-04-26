# Agenda User Demand Schedule POC

This project is a Proof of Concept (POC) demonstrating how to schedule and manage user-specific tasks dynamically using an Express-based API and [Agenda.js](https://github.com/agenda/agenda). It leverages MongoDB Change Streams (via a replica set) for real-time job notifications, moving away from polling-based execution to an event-driven approach.

## Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

## Setting up MongoDB (Replica Set)

Agenda requires a MongoDB Replica Set to utilize the `MongoChangeStreamNotificationChannel` for real-time, event-driven job execution.

1. Ensure your Docker daemon is running.
2. Start the MongoDB replica set using the provided `docker-compose.yaml` file:

```bash
docker compose up -d
```

This command starts a MongoDB instance and automatically initializes the replica set `rs0`. 

The MongoDB connection string used by the application is:
```text
mongodb://localhost:27017/?replicaSet=rs0&directConnection=true
```

To stop the database later, you can run:
```bash
docker compose down
```

## Running the Application

Once the MongoDB container is up and healthy, you can start the Node application.

1. **Install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

This will execute the application using `ts-node` (via the `dev` script in `package.json`).

## API Documentation

The project includes an interactive Swagger UI to explore and test the API. Once the server is running, you can access it at:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Available Endpoints

- **POST `/jobs`**: Create a new recurring job for a specific user.
  - Body: `{ "jobName": "Task A", "username": "John", "userprompt": "Check logs", "schedule": "5 minutes" }`
- **GET `/jobs`**: List all jobs associated with a specific username.
  - Query Param: `?username=John`
- **DELETE `/jobs`**: Remove all jobs associated with a specific username.
  - Query Param: `?username=John`

### Management & Monitoring

- **Web UI**: A simple, modern interface to create, list, and delete jobs.
  - URL: [http://localhost:3000](http://localhost:3000)
- **Agendash**: A real-time dashboard to monitor and manage Agenda jobs.
  - URL: [http://localhost:3000/dash](http://localhost:3000/dash)
- **Swagger API Docs**: Interactive API documentation for manual testing.
  - URL: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Project Structure

```text
agenda-user-demand-schedule-poc/
├── public/
│   └── index.html      # Web UI for job management
├── src/
│   ├── index.ts        # Main Express application & Agenda setup
│   └── swagger.ts      # Swagger/OpenAPI documentation definitions
├── docker-compose.yaml # MongoDB Replica Set configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Key Features

- **Real-time Notifications**: Uses `MongoChangeStreamNotificationChannel` to respond to job events immediately using MongoDB Change Streams.
- **Dynamic Scheduling**: Allows creating jobs on-the-fly with human-readable intervals (e.g., "5 minutes", "every Monday at 9am").
- **Custom Web UI**: A bespoke, premium-designed interface for end-users to manage their own jobs.
- **Agendash Dashboard**: Integrated web-based dashboard for real-time monitoring and manual management of scheduled jobs.
- **Persistence**: Jobs are stored in MongoDB and survive application restarts.
- **User Isolation**: Endpoints are designed to manage jobs based on a `username` attribute stored in the job data.
