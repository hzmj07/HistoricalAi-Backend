import { GoogleGenerativeAI   } from "@google/generative-ai";
import express from 'express';

const route = express.Router();
const api = "AIzaSyA-HGFF6SL2-XFZVedFHj-su17VqoWRKPM";
const genAI = new GoogleGenerativeAI(api);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

route.post('/generateText', async (req, res) => {
    try {
      const { pront } = req.body;
      if (pront) {
        const istek = pront
        const result = await model.generateContent([istek]);
        res.status(200).json({ message:  result  });
      }else{
        res.status(404).json({ message: 'hata' });
      }
     
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  export default route;
