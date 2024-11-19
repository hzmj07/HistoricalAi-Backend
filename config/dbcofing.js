import mongoose from 'mongoose';

export function dbCon() {

    try{
        mongoose.connect('mongodb://localhost:27017/data', {})
        .then(() => console.log('MongoDB bağlantısı başarılı'))

    }catch(e){
        console.log(e);
        
    };
    
}