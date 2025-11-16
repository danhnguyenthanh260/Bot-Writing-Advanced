import dotenv from 'dotenv';
dotenv.config();

import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import googleDocsRouter from './routes/googleDocs.ts';
import processingRouter from './routes/processingRoutes.ts';
import contextRouter from './routes/contextRoutes.ts';
import resultsRouter from './routes/resultsRoutes.ts';
import logsRouter from './routes/logsRoutes.ts';
import authRouter from './routes/authRoutes.ts';
import { deploySchema, checkSchemaDeployed } from './db/migrate.ts';

const app = express();
const port = Number(process.env.PORT ?? 3001);

const parsedOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

const allowedOrigins = parsedOrigins && parsedOrigins.length > 0 ? parsedOrigins : undefined;
app.use(
  cors({
    origin: allowedOrigins ?? true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/google-docs', googleDocsRouter);
app.use('/api/processing', processingRouter);
app.use('/api/context', contextRouter);
app.use('/api/results', resultsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/auth', authRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Đã xảy ra lỗi không xác định trên máy chủ.' });
};

app.use(errorHandler);

// Initialize database schema on startup
async function initializeServer() {
  try {
    const schemaExists = await checkSchemaDeployed();
    if (!schemaExists) {
      console.log('Schema not found, deploying...');
      await deploySchema();
    } else {
      console.log('Schema already deployed');
    }
    
    // Recover pending jobs after server restart
    try {
      const { recoverAllJobs } = await import('./jobs/jobRecovery.ts');
      const recoveryResult = await recoverAllJobs();
      console.log(`Job recovery: ${recoveryResult.books} books, ${recoveryResult.chapters} chapters queued`);
    } catch (recoveryError) {
      console.warn('Job recovery failed (non-critical):', recoveryError);
      // Don't fail server startup if recovery fails
    }
    
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();