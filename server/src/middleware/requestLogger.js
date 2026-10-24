const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestPath = req.path;

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    console[level](
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event: 'http_request',
        method: req.method,
        path: requestPath,
        statusCode,
        durationMs: Date.now() - startTime,
      })
    );
  });

  next();
};

module.exports = requestLogger;
