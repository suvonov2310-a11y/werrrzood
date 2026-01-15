const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let onlineUsers = {}; 

io.on('connection', (socket) => {
    console.log('Foydalanuvchi ulandi:', socket.id);

    socket.on('join-lobby', (user) => {
        // Foydalanuvchi ma'lumotlariga socket.id ni qat'iy biriktiramiz
        onlineUsers[socket.id] = { 
            id: user.id, 
            name: user.name, 
            socketId: socket.id 
        };
        io.emit('update-users', Object.values(onlineUsers));
    });

    socket.on('send-invite', (data) => {
        // Taklif yuborilayotgan odamni qidirish
        const targetUser = Object.values(onlineUsers).find(u => u.id === data.toId);
        if (targetUser) {
            console.log(`Taklif ketdi: ${data.fromName} -> ${targetUser.name}`);
            io.to(targetUser.socketId).emit('receive-invite', data);
        }
    });

    socket.on('accept-invite', (data) => {
        const roomId = "room_" + Math.random().toString(36).slice(2, 9);
        
        // Har ikkala o'yinchining hozirgi socket ob'ektlarini topamiz
        const sender = Object.values(onlineUsers).find(u => u.id === data.fromId);
        const receiver = Object.values(onlineUsers).find(u => u.id === data.toId);

        if (sender && receiver) {
            const sSocket = io.sockets.sockets.get(sender.socketId);
            const rSocket = io.sockets.sockets.get(receiver.socketId);

            if (sSocket && rSocket) {
                // Ikkalasini ham xonaga kirgizamiz
                sSocket.join(roomId);
                rSocket.join(roomId);

                const roles = {};
                roles[data.fromId] = 'red';
                roles[data.toId] = 'light';

                console.log(`O'yin boshlandi: ${roomId}`);
                io.to(roomId).emit('start-game', { roomId, players: roles });
            }
        }
    });

    socket.on('make-move', (data) => {
        // Xonadagi boshqa o'yinchiga yurishni yuborish
        socket.to(data.roomId).emit('move-made', data);
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.emit('update-users', Object.values(onlineUsers));
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server ${PORT}-portda yondi`));