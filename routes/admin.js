import express from 'express';
import { auth, adminAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  addFaculty,
  getAllFaculties,
  updateFaculty,
  deleteFaculty,
  createExam,
  getAllExams,
  updateExam,
  addQuestionsToExam,
  getAvailableSubjectsForExam,
  assignSubjectsToExam,
  createSubject,
  getAllSubjects,
  getSubjectCriteria,
  getSubjectsByExam,
  updateSubject,
  deleteSubject,
  uploadQuestions,
  uploadAnswerSheets,
  getAllAnswerSheets,
  getUnassignedAnswerSheets,
  assignAnswerSheetsToFaculty,
  getDashboardStats,
  getAllStudents,
  getStudentById,
  getStudentByRollNumber,
  updateStudent,
  getStudentExamResults
} from '../controllers/adminController.js';

const router = express.Router();


// Faculty Management Routes
router.post('/faculty', [auth, adminAuth], addFaculty);
router.get('/faculty', [auth, adminAuth], getAllFaculties);
router.put('/faculty/:id', [auth, adminAuth], updateFaculty);
router.delete('/faculty/:id', [auth, adminAuth], deleteFaculty);

// Exam Management Routes
router.post('/exam', [auth, adminAuth], createExam);
router.get('/exam', [auth, adminAuth], getAllExams);
router.put('/exam/:id', [auth, adminAuth], updateExam);
router.post('/exam/:examId/questions', [auth, adminAuth, upload.fields([
  { name: 'questionPaperPDF', maxCount: 1 },
  { name: 'questionImages', maxCount: 50 }
])], addQuestionsToExam);
router.get('/exam/available-subjects', [auth, adminAuth], getAvailableSubjectsForExam);
router.post('/exam/:examId/assign-subjects', [auth, adminAuth], assignSubjectsToExam);

// Subject Management Routes
router.post('/subject', [auth, adminAuth], createSubject);
router.get('/subject', [auth, adminAuth], getAllSubjects);
router.get('/subject/criteria', [auth, adminAuth], getSubjectCriteria);
router.get('/subject/exam/:examId', [auth, adminAuth], getSubjectsByExam);
router.put('/subject/:id', [auth, adminAuth], updateSubject);
router.delete('/subject/:id', [auth, adminAuth], deleteSubject);
router.post('/subject/:id/questions', [auth, adminAuth, upload.single('questionFile')], uploadQuestions);

// Answer Sheet Management Routes
router.post('/answer-sheets', [auth, adminAuth, upload.array('answerSheets', 100)], uploadAnswerSheets);
router.get('/answer-sheets', [auth, adminAuth], getAllAnswerSheets);
router.get('/answer-sheets/unassigned', [auth, adminAuth], getUnassignedAnswerSheets);
router.post('/answer-sheets/assign', [auth, adminAuth], assignAnswerSheetsToFaculty);
router.post('/extract-pdf-info', [auth, adminAuth, upload.single('pdf')], async (req, res) => {
  try {
    const { extractStudentInfo } = await import('../utils/ocrUtils.js');
    
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    console.log('Extracting info from PDF:', req.file.originalname);
    const { rollNumber, name, rawText, error } = await extractStudentInfo(req.file.path);
    
    console.log('Extraction result - Roll:', rollNumber, 'Name:', name);
    
    return res.json({
      rollNumber: rollNumber || '',
      name: name || '',
      rawText: rawText || '',
      error: error || null
    });
  } catch (error) {
    console.error('Extract PDF info error:', error);
    return res.status(500).json({
      message: 'Failed to extract PDF info',
      error: error.message
    });
  }
});

// Student Management Routes
router.get('/students', [auth, adminAuth], getAllStudents);
router.get('/students/:id', [auth, adminAuth], getStudentById);
router.get('/students/roll/:rollNumber', [auth, adminAuth], getStudentByRollNumber);
router.put('/students/:id', [auth, adminAuth], updateStudent);
router.get('/students/roll/:rollNumber/exams', [auth, adminAuth], getStudentExamResults);
router.get('/students/roll/:rollNumber/exams/:examId', [auth, adminAuth], getStudentExamResults);


// Dashboard Routes
router.get('/dashboard/stats', [auth, adminAuth], getDashboardStats);

export default router;