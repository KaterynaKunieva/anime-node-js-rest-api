import express from 'express';
import episode from '../episode/episode.router';

const router = express.Router();

router.use('/api/', episode);

export default router;
