import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';

export const socket: Socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});
