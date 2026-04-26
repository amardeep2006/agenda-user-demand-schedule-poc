import { Router } from 'express';
import Docker from 'dockerode';

export const createLogRouter = () => {
  const router = Router();

  // Real-time Docker log streaming endpoint (SSE)
  router.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Cross-platform Docker socket detection
    const isWindows = process.platform === 'win32';
    const dockerOptions = isWindows 
      ? { socketPath: '//./pipe/docker_engine' } 
      : { socketPath: '/var/run/docker.sock' };
    
    const docker = new Docker(dockerOptions);
    
    try {
      const containers = await docker.listContainers();
      // Filter for containers related to the API only
      const projectContainers = containers.filter(c => {
        const names = c.Names || [];
        return names.some(n => n.includes('agenda-poc'));
      });

      projectContainers.forEach(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.Id);
        const logStream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true,
          tail: 20
        });

        logStream.on('data', (chunk) => {
          if (!chunk || chunk.length < 8) return;
          
          let message = chunk.toString('utf8');
          if (chunk[0] < 8) { // Docker multiplex header indicator
             message = chunk.slice(8).toString('utf8');
          }
          
          const names = containerInfo.Names || [];
          const logEntry = {
            timestamp: new Date(),
            containerId: names.length > 0 ? names[0]!.replace('/', '') : 'unknown',
            message: message.trim()
          };
          
          if (logEntry.message) {
            res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
          }
        });

        req.on('close', () => {
          if (logStream && (logStream as any).destroy) {
            (logStream as any).destroy();
          }
        });
      });

    } catch (err) {
      console.error('Docker API error:', err);
    }
  });

  return router;
};
