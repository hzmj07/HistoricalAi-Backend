import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import jwt from "jsonwebtoken";
import { UserDataSema } from "../model/user.js";

const route = express.Router();
const api = "AIzaSyA-HGFF6SL2-XFZVedFHj-su17VqoWRKPM";
const genAI = new GoogleGenerativeAI(api);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// MongoDB şema tanımı


// Token doğrulama middleware
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" , success : false  });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN); // Token'ı doğrula
    req.userId = decoded.id; // Token'dan userId'yi al ve req.userId'ye ata
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" ,  success : false });
  }
};

// AI mesajını kaydetme ve döndürme
route.post("/generateText", verifyToken, async (req, res) => {
  const { pront } = req.body;

  if (!pront) {
    return res.status(400).json({ message: "'pront' field is required" , success : false  });
  }

  try {
    // AI'dan içerik üret
    const result = await model.generateContent([pront]);
    const generatedMessage = result.response.candidates[0].content.parts[0].text; // AI'dan dönen mesaj
    // Token'dan alınan userId
    const userId = req.userId;
    // Kullanıcıya ait mesajları güncelle veya yeni bir kayıt oluştur
    await UserDataSema.updateOne(
      { _id: userId }, // Kullanıcı ID'sine göre güncelle veya oluştur
      { $push: { messages: generatedMessage } }, // Mesajları diziye ekle 
      { upsert: true } // Kayıt yoksa oluştur
    );
    res.status(200).json({ message: "Message saved successfully", data: generatedMessage , success : true  });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message  , success : false });
  }
})

export default route;
