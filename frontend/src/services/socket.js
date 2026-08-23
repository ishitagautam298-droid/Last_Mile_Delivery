import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
  }
  return socket;
};

export const joinOrderRoom = (trackingNumber) => {
  const s = getSocket();
  s.emit('join_order', trackingNumber);
};
