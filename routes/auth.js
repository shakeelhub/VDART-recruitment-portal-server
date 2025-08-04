import express from 'express';
import { login, checkLockoutStatus } from '../controllers/authController.js';

const router = express.Router();

// Login route
router.post('/login', login);

// 🔒 NEW: Check lockout status route
router.get('/lockout-status/:empId', checkLockoutStatus);

export default router;