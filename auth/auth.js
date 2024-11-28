import express from 'express';
import User from '../model/user.js'; // Kullanıcı modeli import edilir
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';

const router = express.Router();

const mongoUri = process.env.JWT_ACCESS_TOKEN;


// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

  
    const hashedPassword = await argon2.hash(password); // Hashlenmiş şifreyi kaydedin
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(mongoUri);
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Şifre doğrulama
    const isMatch = await argon2.verify(user.password, password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Token'ları oluştur
    const accessToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_ACCESS_TOKEN,
      { expiresIn: "48h" }
    );
    console.log(accessToken , );
    const TokenS = {
      accessToken : accessToken,
      refreshToken : refreshToken
    }
    
    res.status(200).json({
      TokenS,
      user,
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
