import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AnswerSheet from '../models/AnswerSheet.js';
import Exam from '../models/Exam.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixFilePaths = async () => {
  try {
    await connectDB();

    // Fix answer sheet PDF paths
    const answerSheets = await AnswerSheet.find({});
    
    let answerSheetCount = 0;
    for (const sheet of answerSheets) {
      if (sheet.pdfUrl && sheet.pdfUrl.includes('\\')) {
        sheet.pdfUrl = sheet.pdfUrl.replace(/\\/g, '/');
        await sheet.save();
        answerSheetCount++;
        console.log(`Fixed answer sheet: ${sheet._id}`);
      }
    }

    // Fix exam question paper PDFs and question images
    const exams = await Exam.find({});
    
    let examCount = 0;
    let questionImageCount = 0;
    
    for (const exam of exams) {
      let modified = false;
      
      // Fix question paper PDF path
      if (exam.questionPaperPDF && exam.questionPaperPDF.includes('\\')) {
        exam.questionPaperPDF = exam.questionPaperPDF.replace(/\\/g, '/');
        modified = true;
        examCount++;
      }
      
      // Fix question image paths
      if (exam.questions && exam.questions.length > 0) {
        for (const question of exam.questions) {
          if (question.questionImage && question.questionImage.includes('\\')) {
            question.questionImage = question.questionImage.replace(/\\/g, '/');
            modified = true;
            questionImageCount++;
          }
        }
      }
      
      if (modified) {
        await exam.save();
        console.log(`Fixed exam: ${exam._id}`);
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Fixed ${answerSheetCount} answer sheet PDF paths`);
    console.log(`Fixed ${examCount} exam question paper PDF paths`);
    console.log(`Fixed ${questionImageCount} question image paths`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

fixFilePaths();
