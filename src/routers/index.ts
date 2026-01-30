import express from 'express';
import episode from '../episode/episode.router';

const router = express.Router();

router.get('/api/health', (req, res) => {
    res.status(200).send('OK');
});

router.use('/api/', episode);

export default router;
