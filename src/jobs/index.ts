import { Agenda } from 'agenda';
import { defineDynamicUserJob } from './dynamicUserJob';

export const registerJobs = (agenda: Agenda) => {
  defineDynamicUserJob(agenda);
  // Add more job registrations here as the project grows
};
