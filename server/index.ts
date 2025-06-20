import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

interface Room { hash: string; hostId: string }
const rooms = new Map<string,Room>();

function genId() {
  return Math.random().toString(36).substr(2,6).toUpperCase();
}

const app = express();
const srv = http.createServer(app);
const io = new Server(srv, { cors: { origin: '*' } });

io.on('connection', socket => {
  socket.on('room:create', (hash, cb) => {
    const roomId = genId();
    rooms.set(roomId, { hash, hostId: socket.id });
    socket.join(roomId);
    cb({ roomId });
  });

  socket.on('room:join', (roomId, hash, cb) => {
    const room = rooms.get(roomId);
    if (!room) return cb({ error: 'Not found' });
    if (room.hash !== hash) return cb({ error: 'Hash mismatch' });
    socket.join(roomId);
    cb({ success: true });
    io.to(room.hostId).emit('peer:joined');
  });

  socket.on('sync:event', data => {
    io.to(data.roomId).emit('sync:event', data);
  });
});

srv.listen(4000, () => console.log('Signal server @ :4000'));
