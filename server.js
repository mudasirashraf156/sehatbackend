const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Update CORS to allow your production frontend domain
// Replace 'https://your-frontend-domain.com' with your actual frontend URL
app.use(cors({
  origin: [
    'http://localhost:3000',           // Local development
    'https://sehatsehul.vercel.app', // Replace with your production frontend URL
    'http://10.203.187.88:3000'        // Your current network IP for testing
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/nurses',   require('./routes/nurseRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));
app.use('/api/labtests', require('./routes/labTestRoutes'));
app.get('/', (req, res) => res.json({ status: 'SehatSehul API ✅' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 API: http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => { console.error('❌ DB Error:', err); process.exit(1); });
