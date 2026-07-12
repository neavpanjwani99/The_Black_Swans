import { Router } from 'express';
import { authController } from '../controllers/authController';

export const authRouter = Router();

// /api/auth/login
authRouter.post('/login', authController.login);
