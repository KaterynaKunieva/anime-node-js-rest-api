import express from 'express';
import cors from 'cors';
import router from './routers';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use(cors());
app.use('/', router);
app.use(errorHandler);

export default app;
