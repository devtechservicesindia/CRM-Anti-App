import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('🔗 Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('🔗 Disconnected from WebSocket server');
});
