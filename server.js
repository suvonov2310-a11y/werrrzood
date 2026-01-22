const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let users = {};

io.on('connection', (socket) => {
    socket.on('login', (userData) => {
        users[socket.id] = { ...userData, id: socket.id };
        io.emit('update-users', Object.values(users));
    });

    socket.on('invite-player', (targetId) => {
        if (users[targetId]) {
            io.to(targetId).emit('receive-invite', { fromId: socket.id, name: users[socket.id].name });
        }
    });

    socket.on('accept-invite', (senderId) => {
        const gameId = `game_${senderId}_${socket.id}`;
        socket.join(gameId);
        if (io.sockets.sockets.get(senderId)) {
            io.sockets.sockets.get(senderId).join(gameId);
            io.to(senderId).emit('start-online-game', { color: 'white', opponentName: users[socket.id].name, gameId });
            io.to(socket.id).emit('start-online-game', { color: 'red', opponentName: users[senderId].name, gameId });
        }
    });

    socket.on('make-move', (data) => {
        socket.to(data.gameId).emit('opponent-moved', data);
    });

    socket.on('send-chat', (data) => {
        socket.to(data.gameId).emit('receive-chat', data);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`SSH Shashka Server running on port ${PORT}`));