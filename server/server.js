import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Admin API running');
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(5000, () => console.log("Server running on http://localhost:5000"));
});