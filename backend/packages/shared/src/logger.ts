interface LogContext {
  correlationId?: string;
  service: string;
  [key: string]: unknown;
}

const log = (level: 'INFO' | 'WARN' | 'ERROR', msg: string, ctx: LogContext) => {
  console.log(
    JSON.stringify({
      level,
      msg,
      timestamp: new Date().toISOString(),
      ...ctx,
    }),
  );
};

export const logger = {
  info: (msg: string, ctx: LogContext) => log('INFO', msg, ctx),
  warn: (msg: string, ctx: LogContext) => log('WARN', msg, ctx),
  error: (msg: string, ctx: LogContext) => log('ERROR', msg, ctx),
};
