import express from 'express';
import { UserDataSema } from '../model/user.js';

const histori = express.Router();


histori.post('/actions', async (req, res) => {
  try {
    const { UserID } = req.body;

    // Gerekli alanların kontrolü
    if (!UserID) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Kullanıcı verisini getir
    const userData = await UserDataSema.findOne({ _id: UserID });

    // Kullanıcı verisi yoksa
    if (!userData) {
      return res.status(200).json({ durum :"not found",message: 'No data found for this user' });
    }

    // `data` alanını döndür
    return res.status(200).json({ durum :"data" ,data: userData.data });
  } catch (err) {
    // Hata durumunda
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default histori;