import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

interface Room {
  hash: string;
  hostId: string;
}
const rooms = new Map<string,Room>();

function genId() {
  return Math.random().toString(36).substr(2,6).toUpperCase();
}

const app = express();
const srv = http.createServer(app);
const io = new Server(srv, { cors: { origin: '*' } });

function getRoomSize(roomId: string): number {
  // `adapter.rooms.get(roomId)` is a Set of socket IDs
  return io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
}

io.on('connection', socket => {
  socket.on('room:create', (hash, cb) => {
    const roomId = genId();
    rooms.set(roomId, { hash, hostId: socket.id });
    socket.join(roomId);

    // let everyone know the brand-new size (1)
    io.to(roomId).emit('peer:update', getRoomSize(roomId));
    cb({ roomId });
  });

  // Let clients ask for the count if they missed the initial update
  socket.on('room:getPeers', (roomId: string, cb: (count: number) => void) => {
    cb(getRoomSize(roomId));
  });

  socket.on('room:join', (roomId, hash, cb) => {
    const room = rooms.get(roomId);
    if (!room) return cb({ error: 'Not found' });
    if (room.hash !== hash) return cb({ error: 'Hash mismatch' });

    socket.join(roomId);

    // broadcast updated size
    io.to(roomId).emit('peer:update', getRoomSize(roomId));
    cb({ success: true });
  });

  // client explicitly wants to leave this room
  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId);
    // broadcast the new room size
    io.to(roomId).emit('peer:update', getRoomSize(roomId));
  });

  socket.on('disconnecting', () => {
    for (const r of socket.rooms) {
      if (r === socket.id) continue;
      // after this socket leaves, size will drop by 1
      io.to(r).emit('peer:update', getRoomSize(r) - 1);
    }
  });

  // core sync
  socket.on('sync:event', data => {
    io.to(data.roomId).emit('sync:event', data);
  });

  // drift correction ping/pong
  socket.on('sync:ping', ({ roomId, clientTime }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    // forward to host only
    io.to(room.hostId).emit('sync:ping', { clientTime });
  });
  socket.on('sync:pong', ({ roomId, clientTime, hostTime }) => {
    // broadcast host reply to all in room
    io.to(roomId).emit('sync:pong', { clientTime, hostTime });
  });
});

srv.listen(4000, () => console.log('Signal server @ :4000'));
