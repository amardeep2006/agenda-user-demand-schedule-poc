import { Agenda } from 'agenda';
import type { NotificationChannel } from 'agenda';
import { MongoBackend, MongoChangeStreamNotificationChannel, MongoJobLogger } from '@agendajs/mongo-backend';
import { MongoClient } from 'mongodb';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';
import { createExpressMiddleware } from 'agendash';
import { MONGO_URI, DB_NAME, PORT } from './config';
import { registerJobs } from './jobs';
import { createJobRouter } from './routes/jobRoutes';
import { createLogRouter } from './routes/logRoutes';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Swagger OpenAPI documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

(async function () {
  try {
    const client = await MongoClient.connect(MONGO_URI);
    const db = client.db(DB_NAME);

    // Create logger and pass with backend
    const backend = new MongoBackend({ mongo: db });

    // Initialize the logger with the db
    const logger = backend.logger as MongoJobLogger;
    await logger.setDb(db);

    // Clear stale locks from previous runs so they are picked up immediately
    await db.collection('agendaJobs').updateMany(
      { lockedAt: { $exists: true } },
      { $unset: { lockedAt: 1, lastRunBy: 1 } }
    );

    const agenda = new Agenda({
      name: `agenda-${process.env.HOSTNAME || 'local'}`,
      backend: backend,
      notificationChannel: new MongoChangeStreamNotificationChannel({ db }) as unknown as NotificationChannel,
      logging: true
    });

    // Register all jobs
    registerJobs(agenda);

    // Wait for backend to connect
    await agenda.ready;
    await agenda.start();
    console.log('Agenda started!');

    // Mount Agendash
    app.use('/dash', createExpressMiddleware(agenda));

    // Mount Routes
    app.use('/jobs', createJobRouter(agenda, db));
    app.use('/stream-logs', createLogRouter());

    app.listen(PORT, () => {
      console.log(`Express server running on http://localhost:${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
      console.log(`Agendash available at http://localhost:${PORT}/dash`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
})();