const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// Oddiy ma'lumotlar ombori (Vaqtinchalik)
let users = {}; 
let rooms = {};

io.on('connection', (socket) => {
    console.log('Ulandi:', socket.id);

    // Lobbyga qo'shilish
    socket.on('join-lobby', (data) => {
        users[socket.id] = {
            id: socket.id,
            name: data.name,
            xp: 500, // Standart XP
            wins: 0,
            losses: 0
        };
        
        // Profil ma'lumotlarini qaytarish
        socket.emit('profile-data', users[socket.id]);
        
        // Hammaning ro'yxatini yangilash
        io.emit('update-users', Object.values(users));
    });

    // Taklif yuborish
    socket.on('send-invite', (data) => {
        const fromUser = users[socket.id];
        if (users[data.toId]) {
            io.to(data.toId).emit('receive-invite', {
                fromId: socket.id,
                fromName: fromUser.name
            });
        }
    });

    // Taklifni qabul qilish va o'yinni boshlash
    socket.on('accept-invite', (data) => {
        const roomId = `room_${data.fromId}_${socket.id}`;
        const players = {};
        players[data.fromId] = 'red';
        players[socket.id] = 'white';

        rooms[roomId] = { players, board: null, turn: 'red' };

        io.to(data.fromId).to(socket.id).emit('start-game', {
            roomId: roomId,
            players: players
        });
    });

    // Chat tizimi
    socket.on('send-chat', (data) => {
        socket.to(data.roomId).emit('receive-chat', {
            sender: users[socket.id].name,
            msg: data.msg
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Elite Server ${PORT}-portda tayyor!`);
});