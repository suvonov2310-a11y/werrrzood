const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/'));

let users = {};

io.on('connection', (socket) => {
    // Profil bilan kirish
    socket.on('login', (data) => {
        users[socket.id] = { 
            id: socket.id, 
            name: data.name, 
            xp: 500, 
            wins: 0, 
            losses: 0,
            status: 'lobby'
        };
        io.emit('update-users', Object.values(users));
    });

    // Taklif yuborish
    socket.on('send-invite', (toId) => {
        if(users[socket.id] && users[toId]) {
            io.to(toId).emit('receive-invite', { 
                fromId: socket.id, 
                fromName: users[socket.id].name 
            });
        }
    });

    // Taklifni qabul qilish va o'yinni boshlash
    socket.on('accept-invite', (fromId) => {
        if(!users[fromId] || !users[socket.id]) return;
        
        const roomId = `room-${fromId}-${socket.id}`;
        socket.join(roomId);
        const inviter = io.sockets.sockets.get(fromId);
        if(inviter) inviter.join(roomId);

        users[socket.id].status = 'playing';
        users[fromId].status = 'playing';

        io.to(roomId).emit('start-game', { 
            roomId, 
            players: { [fromId]: 'white', [socket.id]: 'red' },
            names: { [fromId]: users[fromId].name, [socket.id]: users[socket.id].name }
        });
        io.emit('update-users', Object.values(users));
    });

    // O'yin harakatlarini sinxronlash
    socket.on('make-move', (data) => {
        socket.to(data.roomId).emit('move-made', data);
    });

    // Chat tizimi
    socket.on('chat-msg', (data) => {
        io.to(data.roomId).emit('new-msg', { 
            name: users[socket.id].name, 
            text: data.text 
        });
    });

    // O'yin tugashi va ballarni hisoblash
    socket.on('game-over', (data) => {
        const user = users[socket.id];
        if(!user) return;

        if(data.isWinner) {
            const winXP = Math.floor(Math.random() * (75 - 45 + 1)) + 45;
            user.xp += winXP;
            user.wins += 1;
        } else {
            user.xp = Math.max(0, user.xp - 25);
            user.losses += 1;
        }
        user.status = 'lobby';
        socket.emit('update-profile', user);
        io.emit('update-users', Object.values(users));
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));