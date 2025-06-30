import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MessageInterface from '../../../legal-chat-agreements/src/components/MessageInterface';
import { fetchConversations, fetchConversationMessages, sendMessage } from '../store/slices/messageSlice';

const LegalMessagesPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { conversations, currentConversation, loading } = useSelector((state) => state.message);
  const currentUser = user?.userType === 'landlord' ? 'seller' : 'buyer';
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      dispatch(fetchConversationMessages(activeConversation._id));
    }
  }, [dispatch, activeConversation]);

  const handleSendMessage = async (msg) => {
    if (!activeConversation) return;
    await dispatch(sendMessage({
      conversationId: activeConversation._id,
      content: msg,
      messageType: 'text'
    }));
  };

  // Map backend messages to the format expected by MessageInterface
  const messages = (currentConversation?.messages || []).map((m) => ({
    id: m._id,
    sender: m.senderId === user._id ? currentUser : (currentUser === 'buyer' ? 'seller' : 'buyer'),
    content: m.content,
    timestamp: new Date(m.timestamp || m.createdAt),
    type: m.messageType || 'text',
    fileData: m.attachment ? {
      name: m.attachment.filename,
      size: m.attachment.size,
      type: m.attachment.type
    } : undefined
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <MessageInterface
          currentUser={currentUser}
          onCreateOrder={() => {}}
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default LegalMessagesPage; 