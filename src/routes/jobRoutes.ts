import { Router } from 'express';
import { Agenda } from 'agenda';
import { Db } from 'mongodb';
import { v7 as uuidv7 } from 'uuid';

export const createJobRouter = (agenda: Agenda, db: Db) => {
  const router = Router();

  // Endpoint to create jobs on the fly
  router.post('/', async (req, res) => {
    try {
      const { jobName, username, userprompt, schedule } = req.body;

      if (!jobName || !username || !userprompt || !schedule) {
        return res.status(400).json({ error: 'Missing required parameters: jobName, username, userprompt, schedule' });
      }

      const jobId = uuidv7();
      const job = agenda.create('dynamic user job', { jobName, username, userprompt, jobId });
      job.repeatEvery(schedule);
      await job.save();

      res.status(201).json({ message: 'Job successfully created', jobId, jobName, schedule });
    } catch (error: any) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Endpoint to list jobs by username
  router.get('/', async (req, res) => {
    try {
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({ error: 'Missing required query parameter: username' });
      }

      const jobs = await db.collection('agendaJobs').find({
        name: 'dynamic user job',
        'data.username': username
      }).toArray();

      const formattedJobs = jobs.map((job: any) => {
        const data = job.data || {};
        return {
          id: job._id,
          jobId: data.jobId,
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
  router.delete('/', async (req, res) => {
    try {
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({ error: 'Missing required query parameter: username' });
      }

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

  return router;
};
