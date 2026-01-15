const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let activePlayers = {};

io.on('connection', (socket) => {
    socket.on('join-lobby', (user) => {
        activePlayers[socket.id] = { ...user, id: socket.id };
        io.emit('update-users', Object.values(activePlayers));
    });

    socket.on('disconnect', () => {
        delete activePlayers[socket.id];
        io.emit('update-users', Object.values(activePlayers));
    });
});

http.listen(process.env.PORT || 3000, () => console.log('Server ishga tushdi'));