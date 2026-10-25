import 'dotenv/config';
import app from './app';
import { logger } from './lib/logger';

const PORT = process.env.PORT ?? 8080;

app.listen(PORT, () => {
  logger.info(`SynapseMed API on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
});
