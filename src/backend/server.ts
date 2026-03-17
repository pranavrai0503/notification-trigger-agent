import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { curlRoutes } from './routes/curl.routes';
import { testsRoutes } from './routes/tests.routes';
import { logsRoutes } from './routes/logs.routes';
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/curl', curlRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/logs', logsRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
