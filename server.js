const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/'));

let users = {};

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        users[socket.id] = { 
            id: socket.id, name: data.name, 
            xp: 500, wins: 0, losses: 0 
        };
        io.emit('update-users', Object.values(users));
    });

    socket.on('send-invite', (toId) => {
        if(users[socket.id]) io.to(toId).emit('receive-invite', { fromId: socket.id, fromName: users[socket.id].name });
    });

    socket.on('accept-invite', (fromId) => {
        const roomId = `room-${fromId}-${socket.id}`;
        socket.join(roomId);
        if(io.sockets.sockets.get(fromId)) io.sockets.sockets.get(fromId).join(roomId);
        io.to(roomId).emit('start-game', { roomId, players: { [fromId]: 'white', [socket.id]: 'red' } });
    });

    socket.on('make-move', (data) => {
        socket.to(data.roomId).emit('move-made', data);
    });

    socket.on('chat-msg', (data) => {
        io.to(data.roomId).emit('new-msg', { name: users[socket.id].name, text: data.text });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update-users', Object.values(users));
    });
});

server.listen(process.env.PORT || 3000);