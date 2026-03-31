const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Update CORS to allow your production frontend domain
// Replace 'https://your-frontend-domain.com' with your actual frontend URL
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://sehatsehul.in',
    'https://www.sehatsehul.in',
    'https://sehatsehul.vercel.app',
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
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/orders',    require('./routes/orderRoutes'));
app.get('/', (req, res) => res.json({ status: 'SehatSehul API ✅' }));

// Groq AI proxy — keeps API key server-side
const https = require('https');
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  try {
    const payload = JSON.stringify({
      model: 'llama3-8b-8192',
      messages
    });
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const request = https.request(options, (groqRes) => {
      let data = '';
      groqRes.on('data', chunk => data += chunk);
      groqRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.json({ reply: parsed.choices[0].message.content });
        } catch { res.status(500).json({ error: 'Failed to parse Groq response' }); }
      });
    });
    request.on('error', (e) => res.status(500).json({ error: e.message }));
    request.write(payload);
    request.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 API: http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => { console.error('❌ DB Error:', err); process.exit(1); });
