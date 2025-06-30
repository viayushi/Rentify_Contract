import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchConversationMessages = createAsyncThunk(
  'messages/fetchConversationMessages',
  async (conversationId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/messages/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content, messageType = 'text' }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.post(`${API_URL}/messages/conversation/${conversationId}/send`, {
        content,
        messageType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const startConversation = createAsyncThunk(
  'messages/startConversation',
  async ({ propertyId, initialMessage }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.post(`${API_URL}/messages/start-conversation`, {
        propertyId,
        initialMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start conversation');
    }
  }
);

export const uploadAttachment = createAsyncThunk(
  'messages/uploadAttachment',
  async ({ conversationId, attachment }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const formData = new FormData();
      formData.append('attachment', attachment);
      
      const response = await axios.post(`${API_URL}/messages/conversation/${conversationId}/upload-attachment`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload attachment');
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'messages/markConversationAsRead',
  async (conversationId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      await axios.put(`${API_URL}/messages/conversation/${conversationId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const archiveConversation = createAsyncThunk(
  'messages/archiveConversation',
  async (conversationId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      await axios.put(`${API_URL}/messages/conversation/${conversationId}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to archive conversation');
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  'messages/getUnreadCount',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get unread count');
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: null,
  unreadCount: 0,
  loading: false,
  error: null,
  socketConnected: false,
  realTimeMessages: []
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    addRealTimeMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      
      // Add to real-time messages
      state.realTimeMessages.push({ conversationId, message });
      
      // Update conversation if it's the current one
      if (state.currentConversation && state.currentConversation._id === conversationId) {
        state.currentConversation.messages.push(message);
        state.currentConversation.lastMessage = {
          content: message.content,
          timestamp: message.timestamp,
          senderId: message.senderId
        };
      }
      
      // Update conversation in list
      const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = {
          content: message.content,
          timestamp: message.timestamp,
          senderId: message.senderId
        };
      }
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    markMessageAsRead: (state, action) => {
      const { conversationId, userId } = action.payload;
      
      if (state.currentConversation && state.currentConversation._id === conversationId) {
        state.currentConversation.messages.forEach(message => {
          if (message.senderId !== userId && !message.isRead) {
            message.isRead = true;
            message.readAt = new Date().toISOString();
          }
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.conversations;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Conversation Messages
      .addCase(fetchConversationMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentConversation) {
          state.currentConversation.messages.push(action.payload.newMessage);
          state.currentConversation.lastMessage = {
            content: action.payload.newMessage.content,
            timestamp: action.payload.newMessage.timestamp,
            senderId: action.payload.newMessage.senderId
          };
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Start Conversation
      .addCase(startConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations.unshift(action.payload.conversation);
        state.currentConversation = action.payload.conversation;
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Upload Attachment
      .addCase(uploadAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        state.loading = false;
        // The message will be added via real-time socket
      })
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark Conversation as Read
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        
        // Update conversation in list
        const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].messages.forEach(message => {
            if (!message.isRead) {
              message.isRead = true;
              message.readAt = new Date().toISOString();
            }
          });
        }
        
        // Update current conversation
        if (state.currentConversation && state.currentConversation._id === conversationId) {
          state.currentConversation.messages.forEach(message => {
            if (!message.isRead) {
              message.isRead = true;
              message.readAt = new Date().toISOString();
            }
          });
        }
      })
      
      // Archive Conversation
      .addCase(archiveConversation.fulfilled, (state, action) => {
        const conversationId = action.payload;
        
        // Remove from conversations list
        state.conversations = state.conversations.filter(c => c._id !== conversationId);
        
        // Clear current conversation if it's the archived one
        if (state.currentConversation && state.currentConversation._id === conversationId) {
          state.currentConversation = null;
        }
      })
      
      // Get Unread Count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
      });
  },
});

export const { 
  clearError, 
  setSocketConnected, 
  addRealTimeMessage, 
  setCurrentConversation, 
  clearCurrentConversation,
  updateUnreadCount,
  markMessageAsRead
} = messageSlice.actions;

export default messageSlice.reducer; 