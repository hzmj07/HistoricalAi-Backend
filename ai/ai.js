import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import jwt from "jsonwebtoken";

const route = express.Router();
const api = "AIzaSyA-HGFF6SL2-XFZVedFHj-su17VqoWRKPM";
const genAI = new GoogleGenerativeAI(api);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Token doğrulama için bir middleware fonksiyonu
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token);
   // Bearer token yapısı
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Token'dan gelen kullanıcı bilgilerini request'e ekle
    next(); // Bir sonraki middleware'e geç
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

//tokenin kontrol edilirken hata alınıyor 
route.post("/generateText", verifyToken, async (req, res) => {
  const { pront } = req.body;

  if (!pront) {
    return res.status(400).json({ message: "'pront' field is required" });
  }

  try {
    const result = await model.generateContent([pront]);
    res.status(200).json({ message: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default route;
