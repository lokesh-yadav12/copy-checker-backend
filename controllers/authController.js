// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';

// // Login Controller
// export const login = async (req, res) => {
//   try {
//     const { userId, password } = req.body;

//     // Validate input
//     if (!userId || !password) {
//       return res.status(400).json({ message: 'Please provide userId and password' });
//     }

//     // Admin login
//     if (
//       userId === process.env.ADMIN_ID &&
//       password === process.env.ADMIN_PASSWORD
//     ) {
//       let admin = await User.findOne({
//         $or: [
//           { userId: process.env.ADMIN_ID },
//           { email: 'admin@copychecker.com' },
//           { role: 'admin' }
//         ]
//       });

//       if (!admin) {
//         admin = new User({
//           userId: process.env.ADMIN_ID,
//           name: 'Administrator',
//           email: 'admin@copychecker.com',
//           password: process.env.ADMIN_PASSWORD,
//           role: 'admin',
//           isPasswordChanged: true
//         });
//         await admin.save();
//       }

//       const token = jwt.sign(
//         { id: admin._id, role: admin.role },
//         process.env.JWT_SECRET,
//         { expiresIn: '7d' }
//       );

//       return res.json({
//         token,
//         user: {
//           id: admin._id,
//           userId: admin.userId,
//           name: admin.name,
//           email: admin.email,
//           role: admin.role,
//           isPasswordChanged: admin.isPasswordChanged
//         }
//       });
//     }

//     // Faculty login
//     const user = await User.findOne({ userId });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await user.comparePassword(password);

//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         userId: user.userId,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         isPasswordChanged: user.isPasswordChanged,
//         subjects: user.subjects
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Change Password Controller
// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     // Validate input
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ message: 'Please provide current and new password' });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ message: 'New password must be at least 6 characters' });
//     }

//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const isMatch = await user.comparePassword(currentPassword);

//     if (!isMatch) {
//       return res.status(400).json({ message: 'Current password is incorrect' });
//     }

//     user.password = newPassword;
//     user.isPasswordChanged = true;
//     await user.save();

//     res.json({ message: 'Password changed successfully' });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get Current User Controller
// export const getCurrentUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id)
//       .select('-password')
//       .populate('subjects');

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ user });
//   } catch (error) {
//     console.error('Get current user error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Login Controller
export const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Validate input
    if (!userId || !password) {
      return res.status(400).json({ message: 'Please provide userId and password' });
    }

    // Admin login
    if (
      userId === process.env.ADMIN_ID &&
      password === process.env.ADMIN_PASSWORD
    ) {
      let admin = await User.findOne({
        $or: [
          { userId: process.env.ADMIN_ID },
          { email: 'admin@copychecker.com' },
          { role: 'admin' }
        ]
      });

      if (!admin) {
        admin = new User({
          userId: process.env.ADMIN_ID,
          name: 'Administrator',
          email: 'admin@copychecker.com',
          password: process.env.ADMIN_PASSWORD,
          role: 'admin',
          isPasswordChanged: true
        });
        await admin.save();
      }

      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: admin._id,
          userId: admin.userId,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isPasswordChanged: admin.isPasswordChanged
        }
      });
    }

    // Faculty login
  const user = await User.findOne({ userId }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

   const isMatch = await user.comparePassword(password);

if (!isMatch) {
 

  return res.status(400).json({ message: 'Invalid credentials' });
}
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        isPasswordChanged: user.isPasswordChanged,
        subjects: user.subjects
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change Password Controller
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.isPasswordChanged = true;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Current User Controller
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('subjects');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

