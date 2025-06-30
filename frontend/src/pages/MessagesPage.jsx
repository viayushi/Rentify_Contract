import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConversations, fetchConversationMessages, sendMessage } from '../store/slices/messageSlice';
import { getSocket } from '../services/socketService';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const MessagesPage = () => {
  const dispatch = useDispatch();
  const { conversations, currentConversation, loading } = useSelector((state) => state.message);
  const { user } = useSelector((state) => state.auth);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (selectedConversation) {
      dispatch(fetchConversationMessages(selectedConversation._id));
    }
  }, [dispatch, selectedConversation]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (currentConversation && currentConversation.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation]);

  useEffect(() => {
    // Socket event listeners for real-time messages
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.conversationId === selectedConversation?._id) {
        dispatch(fetchConversationMessages(selectedConversation._id));
      }
      dispatch(fetchConversations()); // Refresh conversation list
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [dispatch, selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await dispatch(sendMessage({
        conversationId: selectedConversation._id,
        content: newMessage.trim()
      })).unwrap();
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getOtherUser = (conversation) => {
    if (!conversation.participants) return null;
    return conversation.participants.find(p => p._id !== user?._id);
  };

  const getLastMessage = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    return conversation.lastMessage.content.length > 50 
      ? conversation.lastMessage.content.substring(0, 50) + '...'
      : conversation.lastMessage.content;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const otherUser = getOtherUser(conversation);
    if (!otherUser) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      otherUser.firstName?.toLowerCase().includes(searchLower) ||
      otherUser.lastName?.toLowerCase().includes(searchLower) ||
      (conversation.property?.title || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="border-r border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="overflow-y-auto h-[calc(600px-80px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No conversations found' : 'No messages yet'}
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const otherUser = getOtherUser(conversation);
                    if (!otherUser) return null;

                    return (
                      <div
                        key={conversation._id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                          selectedConversation?._id === conversation._id ? 'bg-indigo-50 border-indigo-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {otherUser.firstName?.charAt(0)}{otherUser.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {otherUser.firstName} {otherUser.lastName}
                              </h3>
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatDate(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {conversation.property && (
                              <p className="text-xs text-indigo-600 truncate">
                                {conversation.property.title}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 truncate">
                              {getLastMessage(conversation)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation && currentConversation && currentConversation.messages ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {getOtherUser(selectedConversation)?.firstName?.charAt(0)}
                          {getOtherUser(selectedConversation)?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {getOtherUser(selectedConversation)?.firstName} {getOtherUser(selectedConversation)?.lastName}
                        </h3>
                        {selectedConversation.property && (
                          <p className="text-sm text-indigo-600">
                            {selectedConversation.property.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {currentConversation.messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === user?._id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender._id === user?._id ? 'text-indigo-200' : 'text-gray-500'
                          }`}>
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleSendMessage} className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose a conversation from the list to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 