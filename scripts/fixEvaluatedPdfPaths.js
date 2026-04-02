import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AnswerSheet from '../models/AnswerSheet.js';

dotenv.config();

/**
 * Script to fix evaluatedPdfUrl paths that use backslashes
 * Converts Windows-style paths (uploads\evaluated\...) to forward slashes (uploads/evaluated/...)
 */
async function fixEvaluatedPdfPaths() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all answer sheets with evaluatedPdfUrl containing backslashes
    const answerSheets = await AnswerSheet.find({
      evaluatedPdfUrl: { $exists: true, $ne: null }
    });

    console.log(`Found ${answerSheets.length} answer sheets with evaluatedPdfUrl`);

    let fixedCount = 0;

    for (const sheet of answerSheets) {
      if (sheet.evaluatedPdfUrl && sheet.evaluatedPdfUrl.includes('\\')) {
        const oldPath = sheet.evaluatedPdfUrl;
        const newPath = sheet.evaluatedPdfUrl.replace(/\\/g, '/');
        
        sheet.evaluatedPdfUrl = newPath;
        await sheet.save();
        
        console.log(`Fixed: ${oldPath} -> ${newPath}`);
        fixedCount++;
      }
    }

    console.log(`\nFixed ${fixedCount} paths`);
    console.log('Done!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixEvaluatedPdfPaths();
