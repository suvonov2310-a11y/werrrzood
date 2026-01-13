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
            msg: num >= 2 ? "O'yin boshlandi!" : "Raqib kutilmoqda...",
            active: num >= 2,
            count: num
        });
    });

    socket.on('move', (data) => {
        // Yurishni boshqa o'yinchiga yuborish
        socket.to(data.roomId).emit('move-received', data.move);
    });
});

http.listen(process.env.PORT || 3000, () => console.log('Ready'));