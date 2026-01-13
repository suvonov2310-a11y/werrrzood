const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        const room = io.sockets.adapter.rooms.get(roomId);
        const playersCount = room ? room.size : 0;

        // Xonadagi hamma (ikkala o'yinchi)ga xabar yuboramiz
        io.to(roomId).emit('update-status', {
            count: playersCount,
            message: playersCount === 2 ? "Raqib ulandi! O'yinni boshlang." : "Raqib kutilmoqda..."
        });
    });

    socket.on('move', (data) => {
        socket.to(data.roomId).emit('move-received', data.move);
    });
});

server.listen(3000, () => console.log("Server running on port 3000"));