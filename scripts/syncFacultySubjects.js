import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Subject from '../models/Subject.js';

dotenv.config();

/**
 * Script to sync faculty-subject relationships
 * This will update the subjects collection to reflect faculty assignments
 */
async function syncFacultySubjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all faculty members
    const faculties = await User.find({ role: 'faculty' });
    console.log(`Found ${faculties.length} faculty members`);

    let updatedCount = 0;

    for (const faculty of faculties) {
      if (faculty.subjects && faculty.subjects.length > 0) {
        console.log(`\nProcessing faculty: ${faculty.name} (${faculty.userId})`);
        console.log(`Assigned subjects: ${faculty.subjects.length}`);

        // Add this faculty to each of their assigned subjects
        for (const subjectId of faculty.subjects) {
          const result = await Subject.updateOne(
            { _id: subjectId },
            { $addToSet: { assignedFaculty: faculty._id } }
          );

          if (result.modifiedCount > 0) {
            console.log(`  ✓ Added to subject: ${subjectId}`);
            updatedCount++;
          } else {
            console.log(`  - Already assigned to subject: ${subjectId}`);
          }
        }
      }
    }

    console.log(`\n✅ Sync completed! Updated ${updatedCount} subject assignments.`);

    // Show current state
    console.log('\n=== Current Faculty-Subject Assignments ===');
    const subjects = await Subject.find().populate('assignedFaculty', 'name userId');
    
    for (const subject of subjects) {
      console.log(`\nSubject: ${subject.name} (${subject.code})`);
      if (subject.assignedFaculty && subject.assignedFaculty.length > 0) {
        subject.assignedFaculty.forEach(faculty => {
          console.log(`  - ${faculty.name} (${faculty.userId})`);
        });
      } else {
        console.log('  (No faculty assigned)');
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error syncing faculty subjects:', error);
    process.exit(1);
  }
}

// Run the script
syncFacultySubjects();
