import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    default: ''
  },
  questionImage: {
    type: String, // URL/path to uploaded image
    default: ''
  },
  maxMarks: {
    type: Number,
    required: true
  }
});

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  status: {
    type: String,
    enum: ['active', 'completed', 'upcoming'],
    default: 'upcoming'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  // Question paper can be either PDF or individual questions
  questionPaperPDF: {
    type: String, // URL/path to uploaded PDF
    default: null
  },
  questions: [questionSchema],
  totalMarks: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;