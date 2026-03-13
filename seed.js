require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const NurseProfile = require('./models/NurseProfile');

const nurses = [
  { firstName:'Sara', lastName:'Ahmed', email:'sara@nurse.com', phone:'03001234501', city:'Karachi',
    specialization:'General Nursing', experience:5, bio:'Experienced nurse specializing in home care and post-operative recovery.', hourlyRate:800, rating:4.8, totalReviews:24, isVerified:true },
  { firstName:'Fatima', lastName:'Khan', email:'fatima@nurse.com', phone:'03001234502', city:'Lahore',
    specialization:'Pediatric Nursing', experience:8, bio:'Certified pediatric nurse with 8 years experience in child and newborn care.', hourlyRate:1000, rating:4.9, totalReviews:42, isVerified:true },
  { firstName:'Ayesha', lastName:'Malik', email:'ayesha@nurse.com', phone:'03001234503', city:'Islamabad',
    specialization:'Wound Care', experience:3, bio:'Specialized in wound dressing, IV therapy and post-surgical care.', hourlyRate:700, rating:4.6, totalReviews:18, isVerified:true },
  { firstName:'Zainab', lastName:'Ali', email:'zainab@nurse.com', phone:'03001234504', city:'Karachi',
    specialization:'ICU / Critical Care', experience:10, bio:'ICU-trained nurse providing critical care and monitoring at home.', hourlyRate:1200, rating:4.7, totalReviews:31, isVerified:true },
  { firstName:'Nadia', lastName:'Hassan', email:'nadia@nurse.com', phone:'03001234505', city:'Lahore',
    specialization:'Elderly Care', experience:6, bio:'Compassionate caregiver specializing in elderly patients and long-term care.', hourlyRate:900, rating:4.5, totalReviews:15, isVerified:false },
  { firstName:'Rabia', lastName:'Siddiqui', email:'rabia@nurse.com', phone:'03001234506', city:'Peshawar',
    specialization:'Phlebotomy', experience:4, bio:'Certified phlebotomist for home blood draws, tests, and IV placements.', hourlyRate:600, rating:4.4, totalReviews:20, isVerified:true },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({ role: { $in: ['nurse','patient','admin'] } });
  await NurseProfile.deleteMany({});
  const hashed = await bcrypt.hash('password123', 12);

  // Admin
  await User.create({ firstName:'Admin', lastName:'SehatSuhul', email:'admin@sehatsuhul.pk', phone:'03000000000', password: hashed, role:'admin', isVerified:true, city:'Karachi' });
  // Patient
  await User.create({ firstName:'Ahmed', lastName:'Khan', email:'patient@test.com', phone:'03009876543', password: hashed, role:'patient', city:'Karachi' });

  for (const n of nurses) {
    const user = await User.create({ firstName:n.firstName, lastName:n.lastName, email:n.email, phone:n.phone, password:hashed, role:'nurse', city:n.city, isVerified:n.isVerified });
    await NurseProfile.create({
      user: user._id, specialization:n.specialization, licenseNumber:`PNC-${Math.floor(10000+Math.random()*90000)}`,
      experience:n.experience, bio:n.bio, hourlyRate:n.hourlyRate, city:n.city,
      rating:n.rating, totalReviews:n.totalReviews, isVerified:n.isVerified,
      services:['Medication Administration','Vital Signs Monitoring','IV Therapy','Wound Dressing','Patient Assessment'],
      availability:[
        {day:'Monday',startTime:'08:00',endTime:'20:00',available:true},
        {day:'Tuesday',startTime:'08:00',endTime:'20:00',available:true},
        {day:'Wednesday',startTime:'08:00',endTime:'20:00',available:true},
        {day:'Thursday',startTime:'08:00',endTime:'20:00',available:true},
        {day:'Friday',startTime:'08:00',endTime:'18:00',available:true},
        {day:'Saturday',startTime:'10:00',endTime:'16:00',available:true},
        {day:'Sunday',startTime:'',endTime:'',available:false},
      ]
    });
  }
  console.log('✅ Seeded! Use password: password123');
  console.log('Admin: admin@sehatsuhul.pk | Patient: patient@test.com | Nurse: sara@nurse.com');
  process.exit();
}
seed().catch(console.error);
