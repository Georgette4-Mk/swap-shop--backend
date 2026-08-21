import { Router } from 'express';
import publicRoutes from './publicRoutes';
import clientRoutes from './clientRoutes';
import vendorRoutes from './vendorRoutes';

const router = Router();

router.use('/', publicRoutes);
router.use('/client', clientRoutes);
router.use('/vendor', vendorRoutes);

export default router;