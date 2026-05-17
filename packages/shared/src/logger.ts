const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';
export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(JSON.stringify({
      service: SERVICE_NAME,
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...(data ? { data } : {}),
    }));
  },
  error: (message: string, error?: unknown) => {
    console.error(JSON.stringify({
      service: SERVICE_NAME,
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
    }));
  },
};
