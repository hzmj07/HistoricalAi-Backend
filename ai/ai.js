import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import jwt from "jsonwebtoken";
import { UserDataSema  , Chat} from "../model/user.js";
import axios from "axios";
const route = express.Router();
const api = "AIzaSyA-HGFF6SL2-XFZVedFHj-su17VqoWRKPM"; // API anahtarınızı buraya ekleyin
const genAI = new GoogleGenerativeAI(api);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
import multer from 'multer';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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


export const processDocument = async (fileBuffer, mimeType, prompt) => {
  console.log( "doc fun içindekiii data" , fileBuffer , mimeType);
  
  try {
    const filePart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([
      prompt || "Analyize the document.",
      filePart,
    ]);
    return result.response.text();
  } catch (error) {
    console.error("Doküman işleme hatası:", error);
    throw new Error("Doküman analizi başarısız oldu");
  }
};

const generateResponse = async (chatHistory) => {
  const contents = chatHistory.map(item => ({
    role: item.role,   // 'user' ya da 'model'
    parts : [{text : item.text}]   // Mesajın içeriği
  }));  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api}`,
      {"contents"  : contents },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error with AI response:', error);
    throw new Error('AI response error');
  }
};


const storage = multer.memoryStorage(); // Bellekte saklamak için
const upload = multer({ storage });

route.post('/chat_with_ai', upload.single('file'), async (req, res) => {
  try {
    const { message } = req.body;
    const file = req.file; // Form-data ile gelen dosya
    console.log(file , message);
    if (!message) {
      console.log("mesajı yokk");
      res.status(400).json({ message: 'Mesaj--yok', success: false });
    }
    const id = req.userId;
    // Kullanıcının sohbet geçmişini al
    const userChat = await Chat.findOne({ id });

    const chatHistory = userChat ? userChat.chatHistory : [];

    const saveUserMassage = async  (message) =>{

      const aiMessage = {
        role: 'model',
        text: message ||'No response from AI'
      };
  
      chatHistory.push(aiMessage);
  
      // Kullanıcının sohbet geçmişini güncelle
      await Chat.findOneAndUpdate(
        { userId: id },
        { chatHistory: chatHistory },
        { upsert: true }
      );
      res.status(200).json({ message:message, success: true });

    }

    // Yeni mesajı ekle (eğer mesaj varsa)
    const Filles = async()=>{
      const newMessage = {
          role: 'user',
          text: message
        };
        console.log(newMessage);
        
        chatHistory.push(newMessage);
  
        const veri = await generateResponse(chatHistory);
        return veri.candidates[0].content.parts[0].text
    }

    const Fille = async(x , message)=>{
      
      const data = processDocument(x.buffer , x.mimetype , message );
      return data
    }
        
    const no = file ? await Fille(file) :  await Filles();
    saveUserMassage(no);
    
  

  } catch (err) {
    console.error('Error:', err);
    res.status(300).json({ message: 'Server error', error: err.message, success: false });
  }
});

export default route;