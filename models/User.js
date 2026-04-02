// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },

//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },

//   password: {
//     type: String,
//     required: true,
//     minlength: 6,
//     select: false // 🔥 password will NOT return by default
//   },

//   role: {
//     type: String,
//     enum: ['admin', 'faculty'],
//     default: 'faculty'
//   },

//   subjects: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Subject'
//   }],

//   isPasswordChanged: {
//     type: Boolean,
//     default: false
//   }

// }, { timestamps: true });


// // 🔐 Hash password before saving
// userSchema.pre('save', async function () {
//   if (!this.isModified('password')) return;

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });



// // 🔎 Compare password method
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };


// const User = mongoose.model('User', userSchema);

// export default User;

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // 🔥 password will NOT return by default
  },

  role: {
    type: String,
    enum: ['admin', 'faculty'],
    default: 'faculty'
  },

  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],

  isPasswordChanged: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });


// 🔐 Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});



// 🔎 Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


const User = mongoose.model('User', userSchema);

export default User;

