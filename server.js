const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let onlineUsers = {}; 

io.on('connection', (socket) => {
    console.log('Ulandi:', socket.id);

    socket.on('join-lobby', (user) => {
        // MUHIM: Agar shu foydalanuvchi eski ulanish bilan ro'yxatda bo'lsa, o'chirib tashlaymiz
        // Bu ismlar ko'payib ketishining oldini oladi
        for (let sId in onlineUsers) {
            if (onlineUsers[sId].id === user.id) {
                delete onlineUsers[sId];
            }
        }

        onlineUsers[socket.id] = { 
            id: user.id, 
            name: user.name, 
            socketId: socket.id 
        };
        io.emit('update-users', Object.values(onlineUsers));
    });

    socket.on('send-invite', (data) => {
        const target = Object.values(onlineUsers).find(u => u.id === data.toId);
        if (target) {
            // Taklif aynan maqsadli foydalanuvchining hozirgi socketId siga boradi
            io.to(target.socketId).emit('receive-invite', data);
        }
    });

    socket.on('accept-invite', (data) => {
        const sender = Object.values(onlineUsers).find(u => u.id === data.fromId);
        const receiver = onlineUsers[socket.id];

        if (sender && receiver) {
            const roomId = `room_${Date.now()}`; // Noyob xona ID si
            
            const sSocket = io.sockets.sockets.get(sender.socketId);
            const rSocket = io.sockets.sockets.get(receiver.socketId);

            if(sSocket && rSocket) {
                sSocket.join(roomId);
                rSocket.join(roomId);

                const roles = {};
                roles[sender.id] = 'red';
                roles[receiver.id] = 'light';

                io.to(roomId).emit('start-game', { roomId, players: roles });
            }
        }
    });

    socket.on('find-random', (userData) => {
        // O'zidan boshqa onlayn foydalanuvchilarni qidirish
        const others = Object.values(onlineUsers).filter(u => u.id !== userData.id);
        if (others.length > 0) {
            const randomOpponent = others[Math.floor(Math.random() * others.length)];
            io.to(randomOpponent.socketId).emit('receive-invite', {
                fromId: userData.id,
                fromName: userData.name,
                toId: randomOpponent.id
            });
        } else {
            socket.emit('status-msg', "Hozircha hech kim yo'q...");
        }
    });

    socket.on('make-move', (data) => {
        socket.to(data.roomId).emit('move-made', data);
    });

    socket.on('disconnect', () => {
        if (onlineUsers[socket.id]) {
            delete onlineUsers[socket.id];
            io.emit('update-users', Object.values(onlineUsers));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server yondi: ${PORT}`));