const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  phone:      { type: String, required: true },
  password:   { type: String, required: true, minlength: 8 },
  role:       { type: String, enum: ['patient','nurse','admin','shopOwner','doctor'], required: true },
  avatar:     { type: String, default: '' },
  city:       { type: String, default: '' },
  address:    { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now },
  emailVerifyToken:   { type: String, default: '' },
  emailVerifyExpires: { type: Date },
  passwordResetToken:   { type: String, default: '' },
  passwordResetExpires: { type: Date },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
