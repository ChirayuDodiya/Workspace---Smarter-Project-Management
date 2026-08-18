import express from 'express';
import { register } from '../controllers/auth/register.controller.js';
import { login } from '../controllers/auth/login.controller.js';
import { logout } from '../controllers/auth/logout.controller.js';
import { myProfile } from '../controllers/auth/myProfile.controller.js';
import { refresh } from '../controllers/auth/refresh.controller.js';
import { forgotPassword } from '../controllers/auth/forgotPassword.controller.js';
import { resetPassword } from '../controllers/auth/resetPassword.controller.js';
import { changePassword } from '../controllers/auth/changePassword.controller.js';
import { verifyOTP } from '../controllers/auth/verifyOTP.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { etagMiddleware } from '../middlewares/etag.middleware.js';
import { validateEmail } from '../validators/email.validator.js';
import { validatePassword } from '../validators/password.validator.js';
import { validateName } from '../validators/name.validator.js';

const router = express.Router();

router.post('/register', validateName, validateEmail, validatePassword, register);
router.post('/verify-otp', validateEmail, verifyOTP);
router.post('/login', validateEmail, validatePassword, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, etagMiddleware, myProfile);
router.post('/refresh', refresh);
router.post('/forgot-password', validateEmail, forgotPassword);
router.post('/reset-password', validatePassword, resetPassword);
router.post('/change-password', authMiddleware, validatePassword, changePassword);

export default router;
