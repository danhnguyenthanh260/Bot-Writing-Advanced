import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import googleDocsRouter from './routes/googleDocs';

const app = express();
const port = Number(process.env.PORT ?? 3001);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : undefined;

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

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Đã xảy ra lỗi không xác định trên máy chủ.' });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});