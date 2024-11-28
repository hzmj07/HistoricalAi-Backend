import express from 'express';
import { UserDataSema } from '../model/user.js';

const histori = express.Router();


histori.post('/actions', async (req, res) => {
  try {
    const { UserID } = req.body;

    if (!UserID) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userData = await UserDataSema.findOne({_id: UserID });

    if (!userData) {
      return res.status(200).json({  message:"data yoktur"  });
    }

    return res.status(200).json({ data: userData });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
export default histori;