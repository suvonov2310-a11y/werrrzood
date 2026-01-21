const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = 'mongodb://127.0.0.1:27017/ssh_shashka';
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ MongoDB muvaffaqiyatli ulandi');
    } catch (err) {
        console.log('⚠️ MongoDB ulanmadi. Server vaqtinchalik xotira bilan ishlaydi.');
    }
};

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    xp: { type: Number, default: 500 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);
module.exports = { connectDB, User };