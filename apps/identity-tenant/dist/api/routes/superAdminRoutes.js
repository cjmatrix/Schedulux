import { Router } from 'express';
import { SuperAdminRepository } from '../../repository/SuperAdminRepository.js';
import { CacheRepository } from '../../repository/CacheRepository.js';
import { redisClient } from '../../config/redis.js';
import { SuperAdminService } from '../../services/superAdminService.js';
import { SuperAdminController } from '../controller/SuperAdminController.js';
import { superAdminAuthMiddleware } from '../middlewares/superAdminAuthMiddleware.js';
const superAdminRepo = new SuperAdminRepository();
const cacheRepo = new CacheRepository(redisClient);
export const superAdminService = new SuperAdminService(superAdminRepo, cacheRepo);
const superAdminController = new SuperAdminController(superAdminService);
const router = Router();
// Public routes
router.post('/login', superAdminController.login);
router.post('/refresh-token', superAdminController.refreshToken);
router.post('/logout', superAdminController.logout);
router.post('/register', superAdminController.createSuperAdmin);
// Protected routes
router.get('/me', superAdminAuthMiddleware, superAdminController.getProfile);
export default router;
