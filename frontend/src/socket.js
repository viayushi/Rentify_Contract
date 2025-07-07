import { io } from 'socket.io-client';

// Connect to backend Socket.IO server with proper configuration
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Register user with their MongoDB _id
export function registerSocketUser(userId) {
  if (userId) {
    socket.emit('register', userId);
  }
}

// Join a chat room for a property and two users
export function joinChatRoom(propertyId, userId1, userId2) {
  if (propertyId && userId1 && userId2) {
    socket.emit('join_chat', { propertyId, userId1, userId2 });
  }
}

// Add connection event listeners for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export default socket; 