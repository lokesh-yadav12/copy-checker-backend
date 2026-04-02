// import express from 'express';
// import { auth } from '../middleware/auth.js';
// import { login, changePassword, getCurrentUser } from '../controllers/authController.js';

// const router = express.Router();

// // Login
// router.post('/login', login);

// // Change Password
// router.post('/change-password', auth, changePassword);

// // Get current user
// router.get('/me', auth, getCurrentUser);

// export default router;


import express from 'express';
import { auth } from '../middleware/auth.js';
import { login, changePassword, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

// Login
router.post('/login', login);

// Change Password
router.post('/change-password', auth, changePassword);

// Get current user
router.get('/me', auth, getCurrentUser);

export default router;