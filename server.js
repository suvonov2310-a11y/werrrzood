const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = {}; // Onlayn foydalanuvchilar

io.on('connection', (socket) => {
    // Profil bilan kirish
    socket.on('login', (data) => {
        users[socket.id] = {
            id: socket.id,
            name: data.name,
            xp: 500,
            wins: 0,
            losses: 0,
            status: 'online'
        };
        io.emit('update-users', Object.values(users));
    });

    // Taklif yuborish
    socket.on('send-invite', (data) => {
        io.to(data.toId).emit('receive-invite', {
            fromId: socket.id,
            fromName: users[socket.id].name
        });
    });

    // Taklif qabul qilinganda xonaga birlashtirish
    socket.on('accept-invite', (data) => {
        const roomId = `room-${data.fromId}-${socket.id}`;
        socket.join(roomId);
        io.sockets.sockets.get(data.fromId).join(roomId);
        
        io.to(roomId).emit('start-game', {
            roomId,
            players: { [data.fromId]: 'white', [socket.id]: 'red' }
        });
    });

    // Chat xabarlari
    socket.on('send-msg', (data) => {
        io.to(data.roomId).emit('get-msg', {
            name: users[socket.id].name,
            text: data.text
        });
    });

    // O'yin tugaganda ballarni hisoblash
    socket.on('game-over', (data) => {
        if(data.winner === socket.id) {
            const winXP = Math.floor(Math.random() * (75 - 45 + 1)) + 45;
            users[socket.id].xp += winXP;
            users[socket.id].wins++;
        } else {
            users[socket.id].xp -= 25;
            users[socket.id].losses++;
        }
        io.emit('update-users', Object.values(users));
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

server.listen(3000, () => console.log('Server 3000-portda ishladi'));