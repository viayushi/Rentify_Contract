import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import socket, { registerSocketUser } from '../socket';

const API_BASE = 'http://localhost:5000';

function Messages() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      registerSocketUser(user._id);
    }
  }, [user]);

  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        if (user) {
          const response = await axios.get(`${API_BASE}/api/chat/my`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setChats(response.data);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load messages.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [user]);

  // Listen for real-time messages
  useEffect(() => {
    if (!user) return;

    const handleReceiveMessage = (newMessage) => {
      setChats(prevChats => {
        return prevChats.map(chat => {
         
          const isInThisChat = chat.participants.some(p => 
            String(p._id || p) === String(newMessage.sender?._id || newMessage.sender)
          );
          if (isInThisChat) {
            return {
              ...chat,
              messages: [...(chat.messages || []), newMessage]
            };
          }
          return chat;
        });
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [user]);

  useEffect(() => {
    if (user && chats.length > 0) {
      socket.emit('messages_viewed', { userId: user._id });
    }
  }, [user, chats]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-green-900 text-lg">Loading messages...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-700 text-lg">{error}</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 rounded-3xl shadow-xl p-10 text-center">
          <h2 className="text-2xl font-bold text-green-900 mb-2">Please Login</h2>
          <p className="text-green-800">You need to be logged in to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-8 pt-32">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-green-900 font-semibold hover:underline"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="text-4xl font-bold text-green-900 mb-8">Messages</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-green-700 text-xl mb-4">No messages yet</div>
              <p className="text-gray-600">Start a conversation by contacting a property owner!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chats.map(chat => {
                const otherParticipant = chat.participants.find(p => String(p._id || p) !== String(user._id));
                const lastMessage = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
                const property = chat.property;
                const avatar = otherParticipant?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}`;
                const displayName = otherParticipant?.name || 'Unknown User';
                
                return (
                  <div 
                    key={chat._id} 
                    className="flex items-center gap-4 p-6 border border-green-200 rounded-2xl hover:bg-green-50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white/80 backdrop-blur-sm"
                    onClick={() => navigate(`/chat/${chat._id}`)}
                  >
                    <div className="relative">
                      <img 
                        src={avatar}
                        alt={displayName}
                        className="h-14 w-14 rounded-full border-3 border-green-200 object-cover shadow-lg" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-green-900">{displayName}</h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500">
                            {new Date(lastMessage.timestamp || Date.now()).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Re: {property?.title || 'Property'}
                      </p>
                      <p className="text-sm text-gray-700 truncate">
                        {lastMessage ? lastMessage.text : 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages; 