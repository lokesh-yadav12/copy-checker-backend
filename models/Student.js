// import mongoose from 'mongoose';

// const examResultSchema = new mongoose.Schema({
//   exam: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Exam',
//     required: true
//   },
//   subject: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Subject',
//     required: true
//   },
//   answerSheet: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'AnswerSheet'
//   },
//   marksObtained: {
//     type: Number,
//     default: 0
//   },
//   maxMarks: {
//     type: Number,
//     default: 0
//   },
//   status: {
//     type: String,
//     enum: ['unassigned', 'pending', 'evaluated', 'published'],
//     default: 'unassigned'
//   },
//   evaluatedAt: {
//     type: Date
//   }
// }, { _id: false });

// const studentSchema = new mongoose.Schema({
//   rollNumber: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     uppercase: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     trim: true,
//     lowercase: true
//   },
//   department: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   year: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 5
//   },
//   degree: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   examResults: [examResultSchema],
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// }, { timestamps: true });

// // Index for faster queries
// studentSchema.index({ rollNumber: 1 });
// studentSchema.index({ department: 1, year: 1, degree: 1 });
// studentSchema.index({ 'examResults.exam': 1 });

// // Method to add or update exam result
// studentSchema.methods.addExamResult = function(examResult) {
//   const existingIndex = this.examResults.findIndex(
//     r => r.exam.toString() === examResult.exam.toString() && 
//          r.subject.toString() === examResult.subject.toString()
//   );

//   if (existingIndex >= 0) {
//     this.examResults[existingIndex] = examResult;
//   } else {
//     this.examResults.push(examResult);
//   }
// };

// // Method to get results for a specific exam
// studentSchema.methods.getExamResults = function(examId) {
//   return this.examResults.filter(r => r.exam.toString() === examId.toString());
// };

// const Student = mongoose.model('Student', studentSchema);

// export default Student;

import mongoose from 'mongoose';

const examResultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  answerSheet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnswerSheet'
  },
  marksObtained: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['unassigned', 'pending', 'evaluated', 'published'],
    default: 'unassigned'
  },
  evaluatedAt: {
    type: Date
  }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  degree: {
    type: String,
    required: true,
    trim: true
  },
  examResults: [examResultSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for faster queries
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ department: 1, year: 1, degree: 1 });
studentSchema.index({ 'examResults.exam': 1 });

// Method to add or update exam result
studentSchema.methods.addExamResult = function(examResult) {
  const existingIndex = this.examResults.findIndex(
    r => r.exam.toString() === examResult.exam.toString() && 
         r.subject.toString() === examResult.subject.toString()
  );

  if (existingIndex >= 0) {
    this.examResults[existingIndex] = examResult;
  } else {
    this.examResults.push(examResult);
  }
};

// Method to get results for a specific exam
studentSchema.methods.getExamResults = function(examId) {
  return this.examResults.filter(r => r.exam.toString() === examId.toString());
};

const Student = mongoose.model('Student', studentSchema);

export default Student;

