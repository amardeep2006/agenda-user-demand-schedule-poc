import { Agenda, Job } from 'agenda';

export const defineDynamicUserJob = (agenda: Agenda) => {
  agenda.define('dynamic user job', async (job: Job) => {
    const { jobName, username: jobUser, userprompt: jobPrompt, jobId } = job.attrs.data as any;
    const containerId = process.env.HOSTNAME || 'local';
    
    console.log(`[${new Date().toISOString()}] [Container: ${containerId}] [JobID: ${jobId}] STARTING Job: ${jobName} | Prompt: "${jobPrompt}"`);
    
    // Simulate 2 seconds of work to allow the other replica to pick up other jobs
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`[${new Date().toISOString()}] [Container: ${containerId}] [JobID: ${jobId}] COMPLETED Job: ${jobName} | User: ${jobUser} | Prompt: "${jobPrompt}"`);
  });
};
