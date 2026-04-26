import { Agenda } from 'agenda';
import type { NotificationChannel, Job } from 'agenda';
import { MongoBackend, MongoChangeStreamNotificationChannel, MongoJobLogger } from '@agendajs/mongo-backend';
import { MongoClient } from 'mongodb';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';

const mongoConnectionString = 'mongodb://127.0.0.1:27017/agenda-test?replicaSet=rs0&directConnection=true';

const app = express();
app.use(express.json());

// Swagger OpenAPI documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

(async function () {
  const client = await MongoClient.connect(mongoConnectionString);
  const db = client.db('agenda-test');

  // Create logger and pass with backend
  const backend = new MongoBackend({ mongo: db });

  // Initialize the logger with the db
  const logger = backend.logger as MongoJobLogger;
  await logger.setDb(db);

  const agenda = new Agenda({
    backend: backend,
    notificationChannel: new MongoChangeStreamNotificationChannel({ db }) as unknown as NotificationChannel,
    logging: true
  });

  // Wait for backend to connect
  await agenda.ready;

  // console.log('hasJobLogger:', agenda.hasJobLogger());
  // console.log('jobLogger:', (agenda as any).jobLogger);

  // Define a single, generic handler for all dynamic user jobs.
  // This is crucial because if the server restarts, Agenda needs to know how to process the jobs
  // saved in the database. If we use dynamic names, Agenda won't recognize them after a restart.
  agenda.define('dynamic user job', async (job: Job) => {
    const { jobName, username: jobUser, userprompt: jobPrompt } = job.attrs.data as any;
    console.log(`[${new Date().toISOString()}] Executing Job: ${jobName} | User: ${jobUser} | Prompt: "${jobPrompt}"`);
  });

  await agenda.start();
  console.log('Agenda started!');

  // Endpoint to create jobs on the fly
  app.post('/jobs', async (req, res) => {
    try {
      const { jobName, username, userprompt, schedule } = req.body;

      if (!jobName || !username || !userprompt || !schedule) {
        return res.status(400).json({ error: 'Missing required parameters: jobName, username, userprompt, schedule' });
      }

      // Schedule the job using our generic handler
      // We use agenda.create().repeatEvery().save() instead of agenda.every() 
      // because agenda.every() behaves as a singleton and would overwrite the schedule
      // for the existing 'dynamic user job' name.
      const job = agenda.create('dynamic user job', { jobName, username, userprompt });
      job.repeatEvery(schedule);
      await job.save();

      res.status(201).json({ message: 'Job successfully created', jobName, schedule });
    } catch (error: any) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Endpoint to list jobs by username
  app.get('/jobs', async (req, res) => {
    try {
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({ error: 'Missing required query parameter: username' });
      }

      // Fetch jobs directly from the MongoDB collection based on the dynamic handler name and the user's name
      const jobs = await db.collection('agendaJobs').find({
        name: 'dynamic user job',
        'data.username': username
      }).toArray();

      // Map to the requested attributes (plus the DB ID for future updates)
      const formattedJobs = jobs.map((job: any) => {
        const data = job.data || {};
        return {
          id: job._id,
          jobName: data.jobName,
          username: data.username,
          userprompt: data.userprompt,
          schedule: job.repeatInterval
        };
      });

      res.status(200).json(formattedJobs);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Endpoint to delete jobs by username
  app.delete('/jobs', async (req, res) => {
    try {
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({ error: 'Missing required query parameter: username' });
      }

      // Use agenda.cancel to delete all jobs matching the query
      const numRemoved = await agenda.cancel({ 
        name: 'dynamic user job',
        data: { username }
      });

      res.status(200).json({ message: `Successfully deleted ${numRemoved || 0} job(s) for user: ${username}`, count: numRemoved || 0 });
    } catch (error: any) {
      console.error('Error deleting jobs:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });

})();