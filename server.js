const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        const clients = io.sockets.adapter.rooms.get(roomId);
        const numClients = clients ? clients.size : 0;
        
        // O'yinchilarga nechanchi bo'lib kirganini yuborish
        io.to(roomId).emit('status-update', {
            msg: numClients >= 2 ? "O'yin boshlandi!" : "Raqib kutilmoqda...",
            active: numClients >= 2,
            count: numClients
        });
    });

    socket.on('move', (data) => {
        socket.to(data.roomId).emit('move-received', data.move);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server is running...'));