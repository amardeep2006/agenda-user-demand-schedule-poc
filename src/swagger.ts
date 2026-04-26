export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Agenda Jobs API",
    version: "1.0.0",
    description: "API for dynamically creating and managing Agenda jobs. Jobs are scheduled via a generic Agenda handler to ensure they persist and execute properly across server restarts."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server"
    }
  ],
  tags: [
    {
      name: "Jobs",
      description: "Endpoints for managing jobs"
    }
  ],
  paths: {
    "/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "List jobs by username",
        description: "Fetches all jobs created by a specific user.",
        parameters: [
          {
            name: "username",
            in: "query",
            required: true,
            description: "The name of the user whose jobs you want to retrieve.",
            schema: {
              type: "string",
              example: "amardeep"
            }
          }
        ],
        responses: {
          "200": {
            description: "List of jobs for the user.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "The unique MongoDB ID of the job",
                        example: "64a2b1c3d4e5f6a7b8c9d0e1"
                      },
                      jobName: {
                        type: "string",
                        example: "monthly-report-generation"
                      },
                      username: {
                        type: "string",
                        example: "amardeep"
                      },
                      userprompt: {
                        type: "string",
                        example: "Generate Q3 metrics"
                      },
                      schedule: {
                        type: "string",
                        example: "5 minutes"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad Request - Missing username."
          },
          "500": {
            description: "Internal Server Error."
          }
        }
      },
      post: {
        tags: ["Jobs"],
        summary: "Create and schedule a new job",
        description: "Dynamically creates a new job with a user-defined name and schedules it. The job will print its details to the console when executed.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "jobName",
                  "username",
                  "userprompt",
                  "schedule"
                ],
                properties: {
                  jobName: {
                    type: "string",
                    description: "The custom user-defined name for this job.",
                    example: "monthly-report-generation"
                  },
                  username: {
                    type: "string",
                    description: "The name of the user requesting the job.",
                    example: "amardeep"
                  },
                  userprompt: {
                    type: "string",
                    description: "The prompt associated with the job.",
                    example: "Generate Q3 metrics"
                  },
                  schedule: {
                    type: "string",
                    description: "The interval or specific time to run the job (e.g., '5 minutes', 'in 10 minutes', 'Monday at 8am').",
                    example: "5 minutes"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Job successfully scheduled.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Job successfully created"
                    },
                    jobName: {
                      type: "string",
                      example: "monthly-report-generation"
                    },
                    schedule: {
                      type: "string",
                      example: "5 minutes"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad Request - Missing required parameters.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Missing required parameters: jobName, username, userprompt, schedule"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Internal Server Error."
          }
        }
      },
      delete: {
        tags: ["Jobs"],
        summary: "Delete jobs by username",
        description: "Deletes all jobs associated with a specific user.",
        parameters: [
          {
            name: "username",
            in: "query",
            required: true,
            description: "The name of the user whose jobs you want to delete.",
            schema: {
              type: "string",
              example: "amardeep"
            }
          }
        ],
        responses: {
          "200": {
            description: "Successfully deleted the user's jobs.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Successfully deleted 2 job(s) for user: amardeep"
                    },
                    count: {
                      type: "number",
                      example: 2
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad Request - Missing username."
          },
          "500": {
            description: "Internal Server Error."
          }
        }
      }
    }
  }
};
