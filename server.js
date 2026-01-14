const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        const clients = io.sockets.adapter.rooms.get(roomId);
        const num = clients ? clients.size : 0;
        io.to(roomId).emit('status-update', {
            active: num >= 2,
            count: num,
            msg: num >= 2 ? "O'yin boshlandi!" : "Raqib kutilmoqda..."
        });
    });

    socket.on('move', (data) => {
        socket.to(data.roomId).emit('move-received', data.move);
    });

    socket.on('chat-message', (data) => {
        socket.to(data.roomId).emit('chat-received', data);
    });
});

http.listen(process.env.PORT || 3000, () => console.log('Server OK'));