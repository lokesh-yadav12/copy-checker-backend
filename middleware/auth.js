// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({ message: 'No authentication token, access denied' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id).select('-password');
    
//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

// const adminAuth = (req, res, next) => {
//   try {
//     if (!req.user || req.user.role !== 'admin') {
//       return res.status(403).json({
//         message: 'Access denied. Admin only.'
//       });
//     }

//     next();
//   } catch (error) {
//     return res.status(403).json({
//       message: 'Access denied'
//     });
//   }
// };

// export default adminAuth;


// const facultyAuth = async (req, res, next) => {
//   try {
//     if (req.user.role !== 'faculty') {
//       return res.status(403).json({ message: 'Access denied. Faculty only.' });
//     }
//     next();
//   } catch (error) {
//     res.status(403).json({ message: 'Access denied' });
//   }
// };

// export { auth, adminAuth, facultyAuth };


import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

const facultyAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Access denied. Faculty only.' });
  }
  next();
};

export { auth, adminAuth, facultyAuth };
