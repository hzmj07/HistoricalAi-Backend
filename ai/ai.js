import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import jwt from "jsonwebtoken";
import { UserDataSema } from "../model/user.js";

const route = express.Router();
const api = "AIzaSyA-HGFF6SL2-XFZVedFHj-su17VqoWRKPM"; // API anahtarınızı buraya ekleyin
const genAI = new GoogleGenerativeAI(api);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

// Token doğrulama middleware
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided", success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN); // Token'ı doğrula
    req.userId = decoded.id; // Token'dan userId'yi al ve req.userId'ye ata
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token", success: false });
  }
};

// AI mesajını kaydetme ve döndürme
route.post("/generateText", verifyToken, async (req, res) => {
  const { pront } = req.body;
  const { mesaj } = req.body; // istemcinin gönderdiği mesaj

  if (!pront) {
    return res.status(400).json({ message: "'pront' field is required", success: false });
  }
  if (!mesaj) {
        return res.status(400).json({ message: "'mesaj' field is required", success: false });
    }

  try {
    // AI'dan içerik üret
    const result = await model.generateContent([pront]);
    const generatedMessage = result.response.candidates[0].content.parts[0].text;

    const userId = req.userId;

    // Kullanıcıya ait mevcut mesaj geçmişini getirme
    const user = await UserDataSema.findOne({ _id: userId }).exec();

    let chatHistory;
    if (user) {
        chatHistory = user.data; // Eğer var ise mevcut chat history'sini al.
    } else {
        chatHistory = [];
    }

    // Yeni mesajı chat history'sine ekleme
    chatHistory.push({ req: mesaj, res: generatedMessage });


    // Kullanıcıya ait mesajları güncelle veya yeni bir kayıt oluştur
   await UserDataSema.updateOne(
      { _id: userId },
      { $set: { data: chatHistory } },  // data dizisine direkt set et
      { upsert: true } 
    );


    res.status(200).json({ message: "Message saved successfully", data: generatedMessage, success: true });
  } catch (err) {
    console.error("Error generating or saving message:", err); // Hata mesajını konsolda da göster
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
});

export default route;