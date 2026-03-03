const log = (level, msg, ctx) => {
    console.log(JSON.stringify({
        level,
        msg,
        timestamp: new Date().toISOString(),
        ...ctx,
    }));
};
export const logger = {
    info: (msg, ctx) => log('INFO', msg, ctx),
    warn: (msg, ctx) => log('WARN', msg, ctx),
    error: (msg, ctx) => log('ERROR', msg, ctx),
};
