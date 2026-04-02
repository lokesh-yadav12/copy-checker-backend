// import mongoose from 'mongoose';

// const marksSchema = new mongoose.Schema({
//   questionNumber: {
//     type: Number,
//     required: true
//   },
//   marksObtained: {
//     type: Number,
//     required: true,
//     default: 0,
//     min: 0
//   },
//   maxMarks: {
//     type: Number,
//     required: true,
//     min: 0
//   }
// }, { _id: false }); // prevents extra _id for each mark

// const answerSheetSchema = new mongoose.Schema({
//   rollNumber: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   studentName: {
//     type: String,
//     required: true,
//     trim: true
//   },

//   subject: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Subject',
//     required: true,
//     index: true
//   },

//   exam: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Exam',
//     required: true,
//     index: true
//   },

//   pdfUrl: {
//     type: String,
//     required: true
//   },

//   annotatedPdfUrl: {
//     type: String
//   },

//   // 👇 This tells which faculty it is assigned to
//   assignedTo: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     default: null
//   },

//   status: {
//     type: String,
//     enum: ['pending', 'in-progress', 'completed'],
//     default: 'pending'
//   },

//   marks: [marksSchema],

//   totalMarks: {
//     type: Number,
//     default: 0
//   },

//   maxTotalMarks: {
//     type: Number,
//     required: true
//   },

//   checkedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },

//   checkedAt: {
//     type: Date
//   }

// }, { timestamps: true });


// // Prevent duplicate answer sheet upload for same student, subject, exam
// answerSheetSchema.index(
//   { rollNumber: 1, subject: 1, exam: 1 },
//   { unique: true }
// );

// const AnswerSheet = mongoose.model('AnswerSheet', answerSheetSchema);

// export default AnswerSheet;

import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false }); // prevents extra _id for each mark

const answerSheetSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },

  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },

  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },

  pdfUrl: {
    type: String,
    required: true
  },

  annotatedPdfUrl: {
    type: String
  },

  evaluatedPdfUrl: {
    type: String
  },

  // 👇 This tells which faculty it is assigned to
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  status: {
    type: String,
    enum: ['unassigned', 'pending', 'in-progress', 'evaluated', 'completed'],
    default: 'unassigned'
  },

  marks: [marksSchema],

  totalMarks: {
    type: Number,
    default: 0
  },

  marksObtained: {
    type: Number,
    default: 0
  },

  maxTotalMarks: {
    type: Number,
    required: true
  },

  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  checkedAt: {
    type: Date
  }

}, { timestamps: true });


// Prevent duplicate answer sheet upload for same student, subject, exam
answerSheetSchema.index(
  { rollNumber: 1, subject: 1, exam: 1 },
  { unique: true }
);

const AnswerSheet = mongoose.model('AnswerSheet', answerSheetSchema);

export default AnswerSheet;

