import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '/';
    socket = io(serverUrl, {
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
