// import express from 'express';
// import { auth, facultyAuth } from '../middleware/auth.js';
// import upload from '../middleware/upload.js';
// import {
//   getDashboardStats,
//   getActiveExams,
//   getSubjectsByExam,
//   getAnswerSheetsBySubject,
//   getAnswerSheet,
//   updateAnswerSheetStatus,
//   submitMarks,
//   saveProgress
// } from '../controllers/facultyController.js';

// const router = express.Router();

// // Dashboard Routes
// router.get('/dashboard/stats', [auth, facultyAuth], getDashboardStats);

// // Exam Routes
// router.get('/exams', [auth, facultyAuth], getActiveExams);
// router.get('/exam/:examId/subjects', [auth, facultyAuth], getSubjectsByExam);

// // Subject Routes
// router.get('/subject/:subjectId/answer-sheets', [auth, facultyAuth], getAnswerSheetsBySubject);

// // Answer Sheet Routes
// router.get('/answer-sheet/:id', [auth, facultyAuth], getAnswerSheet);
// router.put('/answer-sheet/:id/status', [auth, facultyAuth], updateAnswerSheetStatus);
// router.post('/answer-sheet/:id/submit', [auth, facultyAuth, upload.single('annotatedPdf')], submitMarks);
// router.put('/answer-sheet/:id/progress', [auth, facultyAuth], saveProgress);

// export default router;






import express from 'express';
import { auth, facultyAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  getDashboardStats,
  getActiveExams,
  getSubjectsByExam,
  getAnswerSheetsBySubject,
  getAnswerSheet,
  updateAnswerSheetStatus,
  submitMarks,
  saveProgress
} from '../controllers/facultyController.js';

const router = express.Router();

// Dashboard Routes
router.get('/dashboard/stats', [auth, facultyAuth], getDashboardStats);

// Exam Routes
router.get('/exams', [auth, facultyAuth], getActiveExams);
router.get('/exam/:examId/subjects', [auth, facultyAuth], getSubjectsByExam);

// Subject Routes
router.get('/subject/:subjectId/answer-sheets', [auth, facultyAuth], getAnswerSheetsBySubject);

// Answer Sheet Routes
router.get('/answer-sheet/:id', [auth, facultyAuth], getAnswerSheet);
router.put('/answer-sheet/:id/status', [auth, facultyAuth], updateAnswerSheetStatus);
router.post('/answer-sheet/:id/submit', [auth, facultyAuth, upload.single('annotatedPdf')], submitMarks);
router.put('/answer-sheet/:id/progress', [auth, facultyAuth], saveProgress);

export default router;