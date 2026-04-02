import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';
import AnswerSheet from '../models/AnswerSheet.js';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function syncStudentExamResults() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all answer sheets
    const answerSheets = await AnswerSheet.find({})
      .populate('exam', 'totalMarks')
      .populate('subject', 'name code');

    console.log(`Found ${answerSheets.length} answer sheets`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const sheet of answerSheets) {
      // Find the student
      let student = await Student.findOne({ rollNumber: sheet.rollNumber });

      if (!student) {
        console.log(`Student not found: ${sheet.rollNumber}, skipping...`);
        continue;
      }

      // Check if exam result already exists
      const existingResultIndex = student.examResults.findIndex(
        r => r.exam.toString() === sheet.exam._id.toString() && 
             r.subject.toString() === sheet.subject._id.toString()
      );

      const examResult = {
        exam: sheet.exam._id,
        subject: sheet.subject._id,
        answerSheet: sheet._id,
        marksObtained: sheet.marksObtained || 0,
        maxMarks: sheet.maxTotalMarks,
        status: sheet.status === 'evaluated' ? 'evaluated' : sheet.status === 'unassigned' ? 'unassigned' : 'pending'
      };

      if (existingResultIndex >= 0) {
        // Update existing result
        student.examResults[existingResultIndex] = examResult;
        updatedCount++;
        console.log(`Updated exam result for ${student.rollNumber} - ${sheet.subject.name}`);
      } else {
        // Add new result
        student.examResults.push(examResult);
        createdCount++;
        console.log(`Created exam result for ${student.rollNumber} - ${sheet.subject.name}`);
      }

      await student.save();
    }

    console.log('\n=== Sync Complete ===');
    console.log(`Updated: ${updatedCount} exam results`);
    console.log(`Created: ${createdCount} exam results`);

    // Show summary
    const students = await Student.find({})
      .populate('examResults.exam', 'name code')
      .populate('examResults.subject', 'name code');

    console.log('\n=== Student Exam Results Summary ===');
    for (const student of students) {
      if (student.examResults.length > 0) {
        console.log(`\n${student.name} (${student.rollNumber}):`);
        student.examResults.forEach(result => {
          console.log(`  - ${result.exam.name} / ${result.subject.name} - Status: ${result.status}`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Sync error:', error);
    process.exit(1);
  }
}

syncStudentExamResults();
