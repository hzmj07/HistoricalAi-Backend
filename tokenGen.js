import jwt from 'jsonwebtoken';


export const generateToken = (payload, secretKey, expiresIn = '1h') => {
    try {
      return jwt.sign(payload, secretKey, { expiresIn });
    } catch (error) {
      console.error('Token oluşturulurken hata:', error);
      return null;
    }
  };
  