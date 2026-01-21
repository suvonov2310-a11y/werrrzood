const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '/')));

let users = {};

io.on('connection', (socket) => {
    // Foydalanuvchi lobbiga kirganda
    socket.on('join-lobby', (data) => {
        users[socket.id] = { id: socket.id, name: data.name, xp: 500 };
        io.emit('update-users', Object.values(users)); // Hammaga yangi ro'yxatni yuborish
    });

    // Taklif yuborish
    socket.on('send-invite', (data) => {
        if (users[data.toId]) {
            io.to(data.toId).emit('receive-invite', { 
                fromId: socket.id, 
                fromName: data.fromName 
            });
        }
    });

    // Taklifni qabul qilish
    socket.on('accept-invite', (data) => {
        const roomId = `room-${socket.id}-${data.fromId}`;
        const players = {};
        players[socket.id] = 'red';
        players[data.fromId] = 'white';

        io.to(socket.id).emit('start-game', { roomId, players });
        io.to(data.fromId).emit('start-game', { roomId, players });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));