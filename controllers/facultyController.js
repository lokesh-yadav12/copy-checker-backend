import AnswerSheet from '../models/AnswerSheet.js';
import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import fs from 'fs';
import path from 'path';

// Dashboard Stats Controller
export const getDashboardStats = async (req, res) => {
  try {
    console.log('Faculty dashboard stats requested by:', req.user.name);

    const totalAssigned = await AnswerSheet.countDocuments({ assignedTo: req.user._id });
    const checked = await AnswerSheet.countDocuments({
      assignedTo: req.user._id,
      status: 'evaluated'
    });
    const pending = await AnswerSheet.countDocuments({
      assignedTo: req.user._id,
      status: 'pending'
    });
    const inProgress = await AnswerSheet.countDocuments({
      assignedTo: req.user._id,
      status: 'in-progress'
    });

    // Exam-wise breakdown
    const examStats = await AnswerSheet.aggregate([
      { $match: { assignedTo: req.user._id } },
      {
        $group: {
          _id: '$exam',
          total: { $sum: 1 },
          checked: {
            $sum: { $cond: [{ $eq: ['$status', 'evaluated'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' }
    ]);

    // Subject-wise breakdown
    const subjectStats = await AnswerSheet.aggregate([
      { $match: { assignedTo: req.user._id } },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          checked: {
            $sum: { $cond: [{ $eq: ['$status', 'evaluated'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' }
    ]);

    res.json({
      totalAssigned,
      checked,
      pending,
      inProgress,
      progress: totalAssigned > 0 ? ((checked / totalAssigned) * 100).toFixed(2) : 0,
      examStats,
      subjectStats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Active Exams Controller
export const getActiveExams = async (req, res) => {
  try {
    console.log('Getting active exams for faculty:', req.user.name);

    // Get distinct exams from answer sheets assigned to this faculty
    const answerSheets = await AnswerSheet.find({ assignedTo: req.user._id })
      .distinct('exam');

    const exams = await Exam.find({
      _id: { $in: answerSheets },
      status: 'active'
    });

    console.log(`Found ${exams.length} active exams`);
    res.json(exams);
  } catch (error) {
    console.error('Get active exams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Subjects by Exam Controller
export const getSubjectsByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    console.log('Getting subjects for exam:', examId, 'faculty:', req.user.name);

    // Get distinct subjects from answer sheets for this exam and faculty
    const answerSheets = await AnswerSheet.find({
      exam: examId,
      assignedTo: req.user._id
    }).distinct('subject');

    const subjects = await Subject.find({
      _id: { $in: answerSheets }
    });

    // Add answer sheet counts
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        const total = await AnswerSheet.countDocuments({
          exam: examId,
          subject: subject._id,
          assignedTo: req.user._id
        });
        const checked = await AnswerSheet.countDocuments({
          exam: examId,
          subject: subject._id,
          assignedTo: req.user._id,
          status: 'evaluated'
        });
        const pending = await AnswerSheet.countDocuments({
          exam: examId,
          subject: subject._id,
          assignedTo: req.user._id,
          status: 'pending'
        });

        return {
          ...subject.toObject(),
          stats: { total, checked, pending }
        };
      })
    );

    console.log(`Found ${subjectsWithCounts.length} subjects`);
    res.json(subjectsWithCounts);
  } catch (error) {
    console.error('Get subjects by exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Answer Sheets by Subject Controller
export const getAnswerSheetsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    console.log('Getting answer sheets for subject:', subjectId, 'faculty:', req.user.name);

    const filter = {
      subject: subjectId,
      assignedTo: req.user._id
    };

    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [answerSheets, total] = await Promise.all([
      AnswerSheet.find(filter)
        .populate('exam', 'name code')
        .populate('subject', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AnswerSheet.countDocuments(filter)
    ]);

    console.log(`Found ${answerSheets.length} answer sheets`);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: answerSheets
    });
  } catch (error) {
    console.error('Get answer sheets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Single Answer Sheet Controller
export const getAnswerSheet = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Fetching answer sheet:', id, 'for faculty:', req.user.name);

    const answerSheet = await AnswerSheet.findOne({
      _id: id,
      assignedTo: req.user._id
    })
      .populate('exam', 'name code questions totalMarks')
      .populate('subject', 'name code totalMarks');

    if (!answerSheet) {
      console.log('Answer sheet not found or not assigned to this faculty');
      return res.status(404).json({ message: 'Answer sheet not found or not assigned to you' });
    }

    console.log('Answer sheet found:', answerSheet.rollNumber);
    console.log('PDF URL:', answerSheet.pdfUrl);
    console.log('Exam questions:', answerSheet.exam?.questions?.length || 0);

    res.json(answerSheet);
  } catch (error) {
    console.error('Get answer sheet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Answer Sheet Status Controller
export const updateAnswerSheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const answerSheet = await AnswerSheet.findOneAndUpdate(
      { _id: id, assignedTo: req.user._id },
      { status },
      { new: true }
    );

    if (!answerSheet) {
      return res.status(404).json({ message: 'Answer sheet not found or not assigned to you' });
    }

    res.json(answerSheet);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit Marks Controller
export const submitMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, totalMarks, comments, annotations } = req.body;

    const answerSheet = await AnswerSheet.findOne({
      _id: id,
      assignedTo: req.user._id
    });

    if (!answerSheet) {
      return res.status(404).json({ message: 'Answer sheet not found or not assigned to you' });
    }

    // Update marks
    if (marks && Array.isArray(marks)) {
      answerSheet.marks = marks;
    }

    // Calculate total marks obtained
    const marksObtained = marks.reduce((sum, mark) => sum + (mark.marksObtained || 0), 0);

    answerSheet.marksObtained = marksObtained;
    answerSheet.status = 'evaluated';
    answerSheet.checkedBy = req.user._id;
    answerSheet.checkedAt = new Date();
    answerSheet.comments = comments;

    // Handle annotated PDF if annotations are provided
    if (annotations && annotations.length > 0) {
      const { mergeAnnotationsWithPDF } = await import('../utils/pdfAnnotation.js');
      
      // Generate unique filename for evaluated PDF
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1E9);
      const evaluatedFilename = `evaluated-${timestamp}-${randomNum}.pdf`;
      // Use forward slashes for consistency
      const evaluatedPath = `uploads/evaluated/${evaluatedFilename}`;
      
      // Ensure evaluated directory exists
      const evaluatedDir = path.join('uploads', 'evaluated');
      if (!fs.existsSync(evaluatedDir)) {
        fs.mkdirSync(evaluatedDir, { recursive: true });
      }
      
      // Merge annotations with original PDF
      const originalPdfPath = path.resolve(answerSheet.pdfUrl);
      await mergeAnnotationsWithPDF(originalPdfPath, annotations, evaluatedPath);
      
      answerSheet.evaluatedPdfUrl = evaluatedPath;
    }

    // Handle manually uploaded annotated PDF (fallback)
    if (req.file) {
      answerSheet.annotatedPdfUrl = req.file.path;
    }

    await answerSheet.save();

    // Update student exam result
    const student = await Student.findOne({ rollNumber: answerSheet.rollNumber });
    if (student) {
      const examResultIndex = student.examResults.findIndex(
        result => 
          result.exam.toString() === answerSheet.exam.toString() &&
          result.subject.toString() === answerSheet.subject.toString()
      );

      if (examResultIndex !== -1) {
        student.examResults[examResultIndex].marksObtained = marksObtained;
        student.examResults[examResultIndex].status = 'evaluated';
        student.examResults[examResultIndex].evaluatedAt = new Date();
        await student.save();
      }
    }

    res.json({
      message: 'Marks submitted successfully',
      answerSheet
    });
  } catch (error) {
    console.error('Submit marks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save Progress Controller
export const saveProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, comments } = req.body;

    const answerSheet = await AnswerSheet.findOneAndUpdate(
      { _id: id, assignedTo: req.user._id },
      {
        marks,
        comments,
        status: 'in-progress'
      },
      { new: true }
    );

    if (!answerSheet) {
      return res.status(404).json({ message: 'Answer sheet not found or not assigned to you' });
    }

    res.json({
      message: 'Progress saved successfully',
      answerSheet
    });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
