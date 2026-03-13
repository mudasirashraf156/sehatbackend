const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/nurses',   require('./routes/nurseRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

app.get('/', (req, res) => res.json({ status: 'SehatSuhul API ✅' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 API: http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => { console.error('❌ DB Error:', err); process.exit(1); });
