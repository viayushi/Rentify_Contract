const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { Server } = require('socket.io');
require('dotenv').config();
const Chat = require('./models/Chat');
const User = require('./models/User');
const contractApproval = require('./controllers/contract/contractApproval');
const contractSignature = require('./controllers/contract/contractSignature');
const Contract = require('./models/Contract');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentify';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

// Socket.IO user management
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  socket.on('register', (userId) => {
    console.log('User registered:', userId, 'with socket:', socket.id);
    onlineUsers.set(userId, socket.id);
    socket.join(userId); //joining a room for direct messaging
  });

  socket.on('send_message', async ({ from, to, propertyId, message }) => {
    try {
      console.log('Received message:', { from, to, propertyId, message });
      
      //finding the chat between these users for this property
      let chat = await Chat.findOne({ 
        property: propertyId, 
        participants: { $all: [from, to], $size: 2 } 
      });
      
      if (!chat) {
        chat = new Chat({ 
          property: propertyId, 
          participants: [from, to], 
          messages: [] 
        });
        await chat.save();
        console.log('Created new chat:', chat._id);
      }
      const msgObj = { 
        sender: from, 
        text: message, 
        timestamp: new Date() 
      };
      chat.messages.push(msgObj);
      await chat.save();
      await chat.populate({ path: 'messages.sender', select: 'name profileImage' });
      const lastMsg = chat.messages[chat.messages.length - 1];
      
      console.log('Sending message to users:', { to, from });
      
      //emit to recipient and sender
      io.to(to).emit('receive_message', lastMsg);
      io.to(from).emit('receive_message', lastMsg);
      
      //emit to all participants in the chat room
      const chatRoom = `chat_${propertyId}_${from}_${to}`;
      io.to(chatRoom).emit('receive_message', lastMsg);
      
    } catch (err) {
      console.error('Socket send_message error:', err);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  //Join chat room for specific property and users
  socket.on('join_chat', ({ propertyId, userId1, userId2 }) => {
    const chatRoom = `chat_${propertyId}_${userId1}_${userId2}`;
    socket.join(chatRoom);
    console.log('Joined chat room:', chatRoom);
  });

  socket.on('contractAction', async (data) => {
    try {
      const { action, contractId, userId, signatureText, signatureImage, useStoredSignature } = data;
      const contract = await Contract.findOne({ contractId });
      if (!contract) {
        socket.emit('contractUpdate', { contractId, error: 'Contract not found' });
        return;
      }
      const req = {
        params: { contractId },
        user: { _id: userId, name: data.userName || '' },
        body: { signatureText, signatureImage, useStoredSignature },
        ip: socket.handshake.address,
        app: app
      };
      const res = {
        status: (code) => ({ json: (obj) => socket.emit('contractUpdate', { contractId, error: obj.message }) }),
        json: (obj) => {
          const updatedContract = obj.contract || contract;
          io.to(String(updatedContract.landlordId)).emit('contractUpdate', { contractId, contract: updatedContract });
          io.to(String(updatedContract.tenantId)).emit('contractUpdate', { contractId, contract: updatedContract });
        }
      };
      if (action === 'approve') {
        await contractApproval.approveContract(req, res);
      } else if (action === 'reject') {
        await contractApproval.rejectContract(req, res);
      } else if (action === 'sign') {
        await contractSignature.signContract(req, res);
      }
    } catch (err) {
      socket.emit('contractUpdate', { contractId: data.contractId, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    // Remove user from online map
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log('User removed from online map:', userId);
        break;
      }
    }
  });
});

app.set('io', io);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 