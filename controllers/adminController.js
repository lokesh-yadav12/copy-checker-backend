import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import AnswerSheet from '../models/AnswerSheet.js';
import Student from '../models/Student.js';
import { extractStudentInfo } from '../utils/ocrUtils.js';

// Faculty Management Controllers

export const addFaculty = async (req, res) => {
  try {
    const { name, email, subjects } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const facultyId = 'FAC' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const defaultPassword = 'faculty123';

    const faculty = new User({
      userId: facultyId,
      name,
      email,
      password: defaultPassword,
      role: 'faculty',
      subjects: subjects || []
    });

    await faculty.save();

    res.status(201).json({
      message: 'Faculty added successfully',
      faculty: {
        id: faculty._id,
        userId: facultyId,
        name: faculty.name,
        email: faculty.email,
        defaultPassword
      }
    });
  } catch (error) {
    console.error('Add faculty error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllFaculties = async (req, res) => {
  try {
    const faculties = await User.find({ role: 'faculty' })
      .select('-password')
      .populate('subjects');
    res.json(faculties);
  } catch (error) {
    console.error('Get faculties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { name, email, subjects } = req.body;

    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (faculty.role !== 'faculty') {
      return res.status(400).json({ message: 'User is not a faculty member' });
    }

    // Get old subjects to remove faculty from them
    const oldSubjects = faculty.subjects || [];
    const newSubjects = subjects || [];

    // Remove faculty from old subjects that are no longer assigned
    const subjectsToRemove = oldSubjects.filter(
      oldSubId => !newSubjects.some(newSubId => newSubId.toString() === oldSubId.toString())
    );

    // Add faculty to new subjects
    const subjectsToAdd = newSubjects.filter(
      newSubId => !oldSubjects.some(oldSubId => oldSubId.toString() === newSubId.toString())
    );

    console.log('Updating faculty subjects:');
    console.log('- Removing from:', subjectsToRemove);
    console.log('- Adding to:', subjectsToAdd);

    // Remove faculty from old subjects
    if (subjectsToRemove.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjectsToRemove } },
        { $pull: { assignedFaculty: req.params.id } }
      );
      console.log(`Removed faculty from ${subjectsToRemove.length} subjects`);
    }

    // Add faculty to new subjects
    if (subjectsToAdd.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjectsToAdd } },
        { $addToSet: { assignedFaculty: req.params.id } }
      );
      console.log(`Added faculty to ${subjectsToAdd.length} subjects`);
    }

    // Update faculty record
    const updatedFaculty = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, subjects: newSubjects },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('Faculty updated successfully:', updatedFaculty.name);

    res.json(updatedFaculty);
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (faculty.role !== 'faculty') {
      return res.status(400).json({ message: 'User is not a faculty member' });
    }

    // Remove faculty from all assigned subjects
    if (faculty.subjects && faculty.subjects.length > 0) {
      await Subject.updateMany(
        { _id: { $in: faculty.subjects } },
        { $pull: { assignedFaculty: req.params.id } }
      );
      console.log(`Removed faculty from ${faculty.subjects.length} subjects`);
    }

    await User.findByIdAndDelete(req.params.id);
    console.log('Faculty deleted successfully:', faculty.name);
    
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Exam Management Controllers

export const createExam = async (req, res) => {
  try {
    const { name, code, department, year, degree, startDate, endDate, status } = req.body;

    if (!name || !code || !department || !year || !degree || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate year
    if (year < 1 || year > 5) {
      return res.status(400).json({
        message: 'Year must be between 1 and 5'
      });
    }

    const existingExam = await Exam.findOne({ code });
    if (existingExam) {
      return res.status(400).json({ message: 'Exam code already exists' });
    }

    const exam = new Exam({
      name,
      code,
      department,
      year,
      degree,
      startDate,
      endDate,
      status: status || 'upcoming'
    });

    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate('subjects').sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedExam);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add questions to exam
export const addQuestionsToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questions: questionsJSON } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Handle PDF upload
    if (req.files && req.files['questionPaperPDF']) {
      const pdfFile = req.files['questionPaperPDF'][0];
      exam.questionPaperPDF = pdfFile.path.replace(/\\/g, '/');
      exam.questions = [];
      exam.totalMarks = 0;
    }
    // Handle individual questions with images
    else if (questionsJSON) {
      const questions = JSON.parse(questionsJSON);
      
      // Validate questions
      const questionNumbers = new Set();
      for (const q of questions) {
        if (!q.questionNumber || !q.maxMarks) {
          return res.status(400).json({
            message: 'Each question must have questionNumber and maxMarks'
          });
        }
        if (questionNumbers.has(q.questionNumber)) {
          return res.status(400).json({
            message: 'Duplicate question numbers found'
          });
        }
        questionNumbers.add(q.questionNumber);
      }

      // Map uploaded images to questions
      if (req.files && req.files['questionImages']) {
        const imageFiles = req.files['questionImages'];
        questions.forEach((q, index) => {
          if (imageFiles[index]) {
            q.questionImage = imageFiles[index].path.replace(/\\/g, '/');
          }
        });
      }

      exam.questions = questions;
      exam.totalMarks = questions.reduce((sum, q) => sum + Number(q.maxMarks), 0);
      exam.questionPaperPDF = null;
    } else {
      return res.status(400).json({
        message: 'Either questions or questionPaperPDF is required'
      });
    }

    await exam.save();

    return res.status(200).json({
      message: 'Questions added successfully',
      exam
    });
  } catch (error) {
    console.error('Add questions error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get available subjects for an exam based on department, year, and degree
export const getAvailableSubjectsForExam = async (req, res) => {
  try {
    const { department, year, degree } = req.query;

    if (!department || !year || !degree) {
      return res.status(400).json({
        message: 'Department, year, and degree are required'
      });
    }

    const subjects = await Subject.find({
      department,
      year: Number(year),
      degree
    })
      .populate('assignedFaculty', '-password')
      .sort({ name: 1 });

    res.json(subjects);
  } catch (error) {
    console.error('Get available subjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign subjects to exam
export const assignSubjectsToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { subjectIds } = req.body;

    if (!subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({
        message: 'Subject IDs array is required'
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Validate subjects match exam's department, year, and degree
    const subjects = await Subject.find({
      _id: { $in: subjectIds },
      department: exam.department,
      year: exam.year,
      degree: exam.degree
    });

    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        message: 'Some subjects do not match exam criteria (department, year, degree)'
      });
    }

    // Remove exam reference from previously assigned subjects
    await Subject.updateMany(
      { exam: examId },
      { $unset: { exam: "" } }
    );

    // Update exam with new subjects
    exam.subjects = subjectIds;
    await exam.save();

    // Update subjects with exam reference
    await Subject.updateMany(
      { _id: { $in: subjectIds } },
      { $set: { exam: examId } }
    );

    const updatedExam = await Exam.findById(examId)
      .populate({
        path: 'subjects',
        populate: {
          path: 'assignedFaculty',
          select: '-password'
        }
      });

    res.json({
      message: 'Subjects assigned successfully',
      exam: updatedExam
    });
  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Subject Management Controllers

export const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      year,
      degree,
      exam,
      assignedFaculty = [],
      deadline
    } = req.body;

    // Validate required fields
    if (!name || !code || !department || !year || !degree) {
      return res.status(400).json({
        message: 'Name, code, department, year, and degree are required'
      });
    }

    // Validate year
    if (year < 1 || year > 5) {
      return res.status(400).json({
        message: 'Year must be between 1 and 5'
      });
    }

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code: code.toUpperCase() });
    if (existingSubject) {
      return res.status(400).json({
        message: 'Subject code already exists'
      });
    }

    // If exam is provided, check if it exists
    if (exam) {
      const examExists = await Exam.findById(exam);
      if (!examExists) {
        return res.status(404).json({
          message: 'Exam not found'
        });
      }
    }

    // Validate assigned faculty
    if (assignedFaculty.length > 0) {
      const validFaculty = await User.find({
        _id: { $in: assignedFaculty },
        role: 'faculty'
      });

      if (validFaculty.length !== assignedFaculty.length) {
        return res.status(400).json({
          message: 'One or more assigned users are invalid faculty'
        });
      }
    }

    // Create subject
    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      department,
      year,
      degree,
      exam: exam || null,
      assignedFaculty,
      deadline: deadline || null
    });

    // Add subject to exam if exam is provided
    if (exam) {
      await Exam.findByIdAndUpdate(exam, {
        $addToSet: { subjects: subject._id }
      });
    }

    // Add subject to faculty
    if (assignedFaculty.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedFaculty } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    return res.status(201).json({
      message: 'Subject created successfully',
      subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('assignedFaculty', '-password')
      .populate('exam')
      .sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get unique departments, years, and degrees from subjects
export const getSubjectCriteria = async (req, res) => {
  try {
    const subjects = await Subject.find().select('department year degree');
    
    const departments = [...new Set(subjects.map(s => s.department))].sort();
    const years = [...new Set(subjects.map(s => s.year))].sort((a, b) => a - b);
    const degrees = [...new Set(subjects.map(s => s.degree))].sort();

    res.json({
      departments,
      years,
      degrees
    });
  } catch (error) {
    console.error('Get subject criteria error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSubjectsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate({
      path: 'subjects',
      populate: {
        path: 'assignedFaculty',
        select: '-password'
      }
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    return res.status(200).json({
      examId: exam._id,
      examName: exam.name,
      subjects: exam.subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      department,
      year,
      degree,
      exam,
      assignedFaculty,
      deadline
    } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check for duplicate code
    if (code && code !== subject.code) {
      const existing = await Subject.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({
          message: 'Subject code already exists'
        });
      }
      subject.code = code.toUpperCase();
    }

    // Validate year if provided
    if (year !== undefined && (year < 1 || year > 5)) {
      return res.status(400).json({
        message: 'Year must be between 1 and 5'
      });
    }

    // Update fields
    if (name) subject.name = name;
    if (department) subject.department = department;
    if (year) subject.year = year;
    if (degree) subject.degree = degree;
    if (deadline) subject.deadline = deadline;

    // Handle exam assignment
    if (exam !== undefined) {
      if (exam) {
        const examExists = await Exam.findById(exam);
        if (!examExists) {
          return res.status(404).json({ message: 'Exam not found' });
        }
        
        // Remove from old exam if exists
        if (subject.exam) {
          await Exam.findByIdAndUpdate(subject.exam, {
            $pull: { subjects: subject._id }
          });
        }
        
        // Add to new exam
        await Exam.findByIdAndUpdate(exam, {
          $addToSet: { subjects: subject._id }
        });
        subject.exam = exam;
      } else {
        // Remove from exam if setting to null
        if (subject.exam) {
          await Exam.findByIdAndUpdate(subject.exam, {
            $pull: { subjects: subject._id }
          });
        }
        subject.exam = null;
      }
    }

    // Handle faculty reassignment
    if (assignedFaculty) {
      // Remove subject from old faculty
      await User.updateMany(
        { _id: { $in: subject.assignedFaculty } },
        { $pull: { subjects: subject._id } }
      );

      // Validate new faculty
      const validFaculty = await User.find({
        _id: { $in: assignedFaculty },
        role: 'faculty'
      });

      if (validFaculty.length !== assignedFaculty.length) {
        return res.status(400).json({
          message: 'One or more assigned users are invalid faculty'
        });
      }

      // Assign new faculty
      subject.assignedFaculty = assignedFaculty;
      await User.updateMany(
        { _id: { $in: assignedFaculty } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    await subject.save();

    return res.status(200).json({
      message: 'Subject updated successfully',
      subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if there are answer sheets
    const answerSheetCount = await AnswerSheet.countDocuments({ subject: id });
    if (answerSheetCount > 0) {
      return res.status(400).json({
        message: `Cannot delete subject. ${answerSheetCount} answer sheets are associated with it.`
      });
    }

    // Remove subject from exam
    if (subject.exam) {
      await Exam.updateOne(
        { _id: subject.exam },
        { $pull: { subjects: id } }
      );
    }

    // Remove subject from faculty
    await User.updateMany(
      { subjects: id },
      { $pull: { subjects: id } }
    );

    await Subject.findByIdAndDelete(id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (!questions) {
      return res.status(400).json({ message: 'Questions data is required' });
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid JSON format for questions' });
    }

    // Validate questions
    const questionNumbers = new Set();
    for (const q of parsedQuestions) {
      if (!q.questionNumber || !q.maxMarks) {
        return res.status(400).json({
          message: 'Each question must have questionNumber and maxMarks'
        });
      }
      if (questionNumbers.has(q.questionNumber)) {
        return res.status(400).json({
          message: 'Duplicate question numbers found'
        });
      }
      questionNumbers.add(q.questionNumber);
    }

    const updatedQuestions = parsedQuestions.map(q => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText || '',
      maxMarks: q.maxMarks,
      questionImage: req.file ? req.file.path : q.questionImage || ''
    }));

    subject.questions = updatedQuestions;
    await subject.save();

    return res.status(200).json({
      message: 'Questions uploaded successfully',
      subject
    });
  } catch (error) {
    console.error('Upload questions error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Answer Sheet Management Controllers

import fs from "fs";
import path from "path";

export const uploadAnswerSheets = async (req, res) => {
  try {
    const { subjectId, examId } = req.body;

    console.log("=== ANSWER SHEET UPLOAD STARTED ===");

    if (!subjectId || !examId || !req.files?.length) {
      return res.status(400).json({
        message: "Subject ID, Exam ID, and files are required"
      });
    }

    // Validate exam and subject
    const [exam, subject] = await Promise.all([
      Exam.findById(examId).select("name department year degree questions totalMarks"),
      Subject.findById(subjectId)
        .select("name assignedFaculty department year degree")
        .populate("assignedFaculty", "_id")
    ]);

    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const marksTemplate = exam.questions.map(q => ({
      questionNumber: q.questionNumber,
      marksObtained: 0,
      maxMarks: q.maxMarks
    }));

    const results = {
      successful: [],
      failed: [],
      duplicates: [],
      logs: []
    };

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const fileLog = {
        filename: file.originalname,
        step: "started",
        details: []
      };

      try {
        console.log(`\nProcessing: ${file.originalname}`);

        // 🔥 ABSOLUTE PATH FIX
        const absolutePath = path.resolve(file.path);

        if (!fs.existsSync(absolutePath)) {
          throw new Error("Uploaded file not found on server");
        }

        fileLog.details.push("File verified on server");

        // Extract student info safely
        fileLog.step = "extracting";

        const extraction = await extractStudentInfo(absolutePath);

        const rollNumber = extraction?.rollNumber;
        const name = extraction?.name;
        const rawText = extraction?.rawText;

        fileLog.details.push(
          `Text length: ${rawText ? rawText.length : 0}`
        );

        if (!rollNumber) {
          throw new Error("Could not extract roll number from PDF");
        }

        // Duplicate check
        fileLog.step = "checking_duplicate";

        const existingSheet = await AnswerSheet.findOne({
          rollNumber,
          subject: subjectId,
          exam: examId
        });

        if (existingSheet) {
          results.duplicates.push({
            rollNumber,
            file: file.originalname,
            reason: "Answer sheet already exists"
          });

          fileLog.step = "duplicate";
          fileLog.details.push("Duplicate answer sheet detected");
          results.logs.push(fileLog);
          continue;
        }

        // Find or create student
        fileLog.step = "student_check";

        let student = await Student.findOne({ rollNumber });

        if (!student) {
          student = new Student({
            rollNumber,
            name: name || `Student ${rollNumber}`,
            department: subject.department,
            year: subject.year,
            degree: subject.degree
          });
          await student.save();
          fileLog.details.push("New student created");
        } else {
          fileLog.details.push("Existing student found");
        }

        // Create answer sheet WITHOUT assignment
        fileLog.step = "creating_answer_sheet";

        const answerSheet = await AnswerSheet.create({
          rollNumber,
          studentName: student.name,
          subject: subjectId,
          exam: examId,
          pdfUrl: file.path.replace(/\\/g, '/'),
          assignedTo: null, // No auto-assignment
          maxTotalMarks: exam.totalMarks,
          marks: marksTemplate,
          status: "unassigned" // New status
        });

        // Update student exam results
        student.addExamResult({
          exam: examId,
          subject: subjectId,
          answerSheet: answerSheet._id,
          marksObtained: 0,
          maxMarks: exam.totalMarks,
          status: "unassigned"
        });

        await student.save();

        results.successful.push({
          rollNumber,
          name: student.name,
          file: file.originalname
        });

        fileLog.step = "success";
        fileLog.details.push("Answer sheet created successfully");
        results.logs.push(fileLog);

      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error.message);

        results.failed.push({
          file: file.originalname,
          reason: error.message
        });

        fileLog.step = "error";
        fileLog.details.push(error.message);
        results.logs.push(fileLog);
      }
    }

    console.log("=== UPLOAD COMPLETE ===");

    return res.status(201).json({
      message: "Answer sheets processing completed",
      summary: {
        total: req.files.length,
        successful: results.successful.length,
        failed: results.failed.length,
        duplicates: results.duplicates.length
      },
      results,
      logs: results.logs
    });

  } catch (error) {
    console.error("Upload answer sheets error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



export const getAllAnswerSheets = async (req, res) => {
  try {
    const {
      examId,
      subjectId,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};
    if (examId) filter.exam = examId;
    if (subjectId) filter.subject = subjectId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [answerSheets, total] = await Promise.all([
      AnswerSheet.find(filter)
        .select('rollNumber studentName status totalMarks maxTotalMarks assignedTo subject exam uploadedAt')
        .populate({ path: 'subject', select: 'name code' })
        .populate({ path: 'exam', select: 'name code' })
        .populate({ path: 'assignedTo', select: 'name email' })
        .populate({ path: 'checkedBy', select: 'name email' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AnswerSheet.countDocuments(filter)
    ]);

    return res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: answerSheets
    });
  } catch (error) {
    console.error('Get answer sheets error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Dashboard Stats Controller

export const getDashboardStats = async (req, res) => {
  try {
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalExams = await Exam.countDocuments();
    const activeExams = await Exam.countDocuments({ status: 'active' });
    const totalSubjects = await Subject.countDocuments();
    const totalAnswerSheets = await AnswerSheet.countDocuments();
    const checkedSheets = await AnswerSheet.countDocuments({ status: 'completed' });
    const pendingSheets = await AnswerSheet.countDocuments({ status: 'pending' });
    const inProgressSheets = await AnswerSheet.countDocuments({ status: 'in-progress' });

    const subjectStats = await AnswerSheet.aggregate([
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          checked: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
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
      totalFaculty,
      totalExams,
      activeExams,
      totalSubjects,
      totalAnswerSheets,
      checkedSheets,
      pendingSheets,
      inProgressSheets,
      checkingProgress:
        totalAnswerSheets > 0
          ? ((checkedSheets / totalAnswerSheets) * 100).toFixed(2)
          : 0,
      subjectStats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get unassigned answer sheets for an exam/subject
export const getUnassignedAnswerSheets = async (req, res) => {
  try {
    const { examId, subjectId } = req.query;

    if (!examId || !subjectId) {
      return res.status(400).json({
        message: "Exam ID and Subject ID are required"
      });
    }

    const [answerSheets, subject] = await Promise.all([
      AnswerSheet.find({
        exam: examId,
        subject: subjectId,
        status: "unassigned"
      })
        .populate('exam', 'name code')
        .populate('subject', 'name code')
        .sort({ createdAt: -1 }),
      Subject.findById(subjectId)
        .populate('assignedFaculty', 'name email userId')
    ]);

    return res.status(200).json({
      answerSheets,
      faculty: subject?.assignedFaculty || [],
      totalSheets: answerSheets.length
    });
  } catch (error) {
    console.error('Get unassigned answer sheets error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Assign answer sheets to faculty
export const assignAnswerSheetsToFaculty = async (req, res) => {
  try {
    const { assignments } = req.body;
    // assignments format: [{ facultyId, count }]

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        message: "Assignments array is required"
      });
    }

    const { examId, subjectId } = req.query;

    if (!examId || !subjectId) {
      return res.status(400).json({
        message: "Exam ID and Subject ID are required"
      });
    }

    // Get unassigned answer sheets
    const unassignedSheets = await AnswerSheet.find({
      exam: examId,
      subject: subjectId,
      status: "unassigned"
    }).sort({ createdAt: 1 });

    const totalUnassigned = unassignedSheets.length;
    const totalToAssign = assignments.reduce((sum, a) => sum + a.count, 0);

    if (totalToAssign > totalUnassigned) {
      return res.status(400).json({
        message: `Cannot assign ${totalToAssign} sheets. Only ${totalUnassigned} unassigned sheets available.`
      });
    }

    let currentIndex = 0;
    const results = [];

    for (const assignment of assignments) {
      const { facultyId, count } = assignment;
      const sheetsToAssign = unassignedSheets.slice(currentIndex, currentIndex + count);

      for (const sheet of sheetsToAssign) {
        sheet.assignedTo = facultyId;
        sheet.status = "pending";
        await sheet.save();

        // Update student exam result status
        const student = await Student.findOne({ rollNumber: sheet.rollNumber });
        if (student) {
          const examResult = student.examResults.find(
            er => er.exam.toString() === examId && er.subject.toString() === subjectId
          );
          if (examResult) {
            examResult.status = "pending";
            await student.save();
          }
        }
      }

      results.push({
        facultyId,
        assigned: sheetsToAssign.length,
        sheets: sheetsToAssign.map(s => s.rollNumber)
      });

      currentIndex += count;
    }

    return res.status(200).json({
      message: "Answer sheets assigned successfully",
      results,
      totalAssigned: currentIndex
    });
  } catch (error) {
    console.error('Assign answer sheets error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// Student Management Controllers

export const getAllStudents = async (req, res) => {
  try {
    const { department, year, degree, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = Number(year);
    if (degree) filter.degree = degree;
    if (search) {
      filter.$or = [
        { rollNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [students, total] = await Promise.all([
      Student.find(filter)
        .select('rollNumber name email department year degree examResults isActive')
        .populate({
          path: 'examResults.exam',
          select: 'name code startDate endDate'
        })
        .populate({
          path: 'examResults.subject',
          select: 'name code'
        })
        .populate({
          path: 'examResults.answerSheet',
          select: 'pdfUrl evaluatedPdfUrl status marksObtained maxTotalMarks'
        })
        .sort({ rollNumber: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Student.countDocuments(filter)
    ]);

    return res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate('examResults.exam', 'name code startDate endDate')
      .populate('examResults.subject', 'name code')
      .populate('examResults.answerSheet', 'status totalMarks');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getStudentByRollNumber = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() })
      .populate('examResults.exam', 'name code startDate endDate')
      .populate('examResults.subject', 'name code')
      .populate('examResults.answerSheet', 'status totalMarks');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, year, degree, isActive } = req.body;

    const student = await Student.findByIdAndUpdate(
      id,
      { name, email, department, year, degree, isActive },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const getStudentExamResults = async (req, res) => {
  try {
    const { rollNumber, examId } = req.params;

    const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() })
      .populate({
        path: 'examResults.exam',
        match: examId ? { _id: examId } : {},
        select: 'name code startDate endDate'
      })
      .populate('examResults.subject', 'name code')
      .populate('examResults.answerSheet', 'status totalMarks marks');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const results = examId 
      ? student.examResults.filter(r => r.exam && r.exam._id.toString() === examId)
      : student.examResults;

    return res.status(200).json({
      student: {
        rollNumber: student.rollNumber,
        name: student.name,
        department: student.department,
        year: student.year,
        degree: student.degree
      },
      results
    });
  } catch (error) {
    console.error('Get student exam results error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
