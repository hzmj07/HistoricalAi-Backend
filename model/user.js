import mongoose from 'mongoose';


// Kullanıcı Şeması
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // Kullanıcı adı benzersiz olmalı
      minlength: 3, // Kullanıcı adı en az 3 karakter olmalı
      maxlength: 30, // Kullanıcı adı en fazla 30 karakter olmalı
    },
    email: {
      type: String,
      required: true,
      unique: true, // E-posta adresi benzersiz olmalı
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, // E-posta formatı doğrulama
    },
    password: {
      type: String,
      required: true, // Şifre zorunlu
      minlength: 6, // Şifre en az 6 karakter olmalı
    },
    createdAt: {
      type: Date,
      default: Date.now, // Varsayılan olarak, kullanıcı oluşturulma tarihi şu anki zaman
    },
  },
  {
    timestamps: true, // createdAt ve updatedAt otomatik olarak eklenir
  }
);
// Şifreyi kaydetmeden önce hashleme

const UserDataSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Belge ID'si olarak user ID kullan
    messages: [{ type: String }], // Kullanıcının mesajlarını sakla
  },
  { timestamps: true }
);

export const UserDataSema = mongoose.model("UserData", UserDataSchema);


  
  export const User = mongoose.model('User', userSchema , 'users');
  

