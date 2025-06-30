import { io } from 'socket.io-client';
import store from '../store';
import { setSocketConnected, addRealTimeMessage, updateUnreadCount } from '../store/slices/messageSlice';
import { addNotification } from '../store/slices/uiSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection
  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
    store.dispatch(setSocketConnected(true));
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    store.dispatch(setSocketConnected(false));
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    store.dispatch(setSocketConnected(false));
    
    // Show notification for connection error
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'error',
      message: 'Connection lost. Trying to reconnect...',
      duration: 3000
    }));
  });

  // Message events
  socket.on('new_message', (data) => {
    const { conversationId, message } = data;
    
    // Add message to store
    store.dispatch(addRealTimeMessage({ conversationId, message }));
    
    // Update unread count
    store.dispatch(updateUnreadCount(data.unreadCount));
    
    // Show notification if not in the conversation
    const { currentConversation } = store.getState().messages;
    if (!currentConversation || currentConversation._id !== conversationId) {
      store.dispatch(addNotification({
        id: Date.now(),
        type: 'info',
        message: `New message from ${message.senderName}`,
        duration: 5000
      }));
    }
  });

  socket.on('message_read', (data) => {
    const { conversationId, userId } = data;
    store.dispatch(updateUnreadCount(data.unreadCount));
  });

  // Order events
  socket.on('order_created', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'success',
      message: 'New order received!',
      duration: 5000
    }));
  });

  socket.on('order_updated', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'info',
      message: 'Order status updated',
      duration: 5000
    }));
  });

  // Property events
  socket.on('property_updated', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'info',
      message: 'Property has been updated',
      duration: 5000
    }));
  });

  // Agreement events
  socket.on('agreement_signed', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'success',
      message: 'Agreement has been signed!',
      duration: 5000
    }));
  });

  // Payment events
  socket.on('payment_received', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'success',
      message: 'Payment received successfully!',
      duration: 5000
    }));
  });

  socket.on('payment_failed', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'error',
      message: 'Payment failed. Please try again.',
      duration: 5000
    }));
  });

  // User events
  socket.on('user_online', (data) => {
    console.log('User online:', data.userId);
  });

  socket.on('user_offline', (data) => {
    console.log('User offline:', data.userId);
  });

  // Error events
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'error',
      message: 'Connection error occurred',
      duration: 5000
    }));
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitMessage = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn('Socket not connected');
  }
};

export const joinRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('join_room', { roomId });
  }
};

export const leaveRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('leave_room', { roomId });
  }
};

export const getSocket = () => {
  return socket;
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

// Auto-reconnect logic
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 1000; // 1 second

export const setupAutoReconnect = () => {
  if (socket) {
    socket.on('disconnect', () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
          console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          reconnectAttempts++;
          initializeSocket();
        }, reconnectDelay * reconnectAttempts);
      } else {
        console.error('Max reconnection attempts reached');
        store.dispatch(addNotification({
          id: Date.now(),
          type: 'error',
          message: 'Unable to connect to server. Please refresh the page.',
          duration: 0 // No auto-dismiss
        }));
      }
    });

    socket.on('connect', () => {
      reconnectAttempts = 0; // Reset on successful connection
    });
  }
};

// Initialize auto-reconnect
setupAutoReconnect(); 