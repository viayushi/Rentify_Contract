import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, MoreVertical, Image, Paperclip, Smile, FileText, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import socket, { registerSocketUser, joinChatRoom } from '../socket';
import axios from 'axios';
import Modal from 'react-modal';
import SignaturePadWrapper from 'react-signature-pad-wrapper';
import { ContractCard, canApprove, canReject, canSign } from './Contracts';
import FAQCard from '../components/FAQCard';

const API_BASE = 'http://localhost:5000';

const ChatPage = () => {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const [systemMessages, setSystemMessages] = useState([]);
  const [approvedContracts, setApprovedContracts] = useState([]);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [modalContractId, setModalContractId] = useState(null);
  const [modalContractPdf, setModalContractPdf] = useState(null);
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [contractFormData, setContractFormData] = useState({});
  const [signatureData, setSignatureData] = useState('');
  const [signaturePadRef, setSignaturePadRef] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [creatingContract, setCreatingContract] = useState(false);
  const [contractsForFAQ, setContractsForFAQ] = useState([]);
  const [currentViewingContract, setCurrentViewingContract] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSigningContract, setCurrentSigningContract] = useState(null);

  // Fetch chat history from backend
  useEffect(() => {
    const fetchChat = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Check if we have a seller parameter (from property details)
        const sellerId = searchParams.get('seller');
        
        if (sellerId) {
            const initiateRes = await axios.post(`${API_BASE}/api/chat/initiate`, {
            propertyId: chatId,
            participantId: sellerId
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          setChat(initiateRes.data);
        } else {
          try {
            const historyRes = await axios.get(`${API_BASE}/api/chat/history/${chatId}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            

            const myChatsRes = await axios.get(`${API_BASE}/api/chat/my`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            const foundChat = myChatsRes.data.find(c => c._id === chatId);
            if (foundChat) {
              setChat({
                ...foundChat,
                messages: historyRes.data
              });
            } else {
              setChat(null);
            }
          } catch (err) {
            console.error('Error fetching chat:', err);
            setChat(null);
          }
        }
      } catch (err) {
        console.error('Error in fetchChat:', err);
        setChat(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChat();
  }, [user, chatId, searchParams]);

  // Register user and join chat room
  useEffect(() => {
    if (user && chat) {
      registerSocketUser(user._id);
      // Find the other participant
      const other = chat.participants.find(p => String(p._id || p) !== String(user._id));
      if (other) {
        const otherId = typeof other === 'string' ? other : other._id;
        joinChatRoom(chat.property, user._id, otherId);
      }
    }
  }, [user, chat]);

  // Listen for real-time messages and contract creation events
  useEffect(() => {
    if (!user) return;
    const handleReceive = (msg) => {
      setChat(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
    };
    socket.on('receive_message', handleReceive);

    // Listen for contractCreated event
    const handleContractCreated = async (data) => {
      try {
        const response = await axios.get(`${API_BASE}/api/contract/${data.contractId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSystemMessages(prev => [
          ...prev,
          response.data
        ]);
        // Refresh contracts list instead of setting single contract
        await fetchContractsForProperty();
      } catch (err) {
        setSystemMessages(prev => [
          ...prev,
          {
            type: 'contract',
            contractId: data.contractId,
            propertyId: data.propertyId,
            message: data.message,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    };
    socket.on('contractCreated', handleContractCreated);

    // Listen for contractUpdated/contractSigned events and update FAQ/ContractCard
    const handleContractUpdated = async (data) => {
      try {
        console.log('Contract updated event received:', data);
        // Refresh all contracts for the property to get latest data
        await fetchContractsForProperty();
      } catch (err) {
        console.error('Error updating contracts:', err);
      }
    };
    socket.on('contractUpdated', handleContractUpdated);
    socket.on('contractSigned', handleContractUpdated);
    socket.on('contract_updated', handleContractUpdated);

    // Listen for contract approval events
    const handleContractApproved = async (data) => {
      console.log('Contract approved event received:', data);
      await fetchContractsForProperty();
    };
    socket.on('contractApproved', handleContractApproved);

    // Listen for contract rejection events
    const handleContractRejected = async (data) => {
      console.log('Contract rejected event received:', data);
      await fetchContractsForProperty();
    };
    socket.on('contractRejected', handleContractRejected);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('contractCreated', handleContractCreated);
      socket.off('contractUpdated', handleContractUpdated);
      socket.off('contractSigned', handleContractUpdated);
      socket.off('contract_updated', handleContractUpdated);
      socket.off('contractApproved', handleContractApproved);
      socket.off('contractRejected', handleContractRejected);
    };
  }, [user, chat]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || !user) return;
    
    try {
      // Send message via backend
      const res = await axios.post(`${API_BASE}/api/chat/send`, {
        chatId: chat._id,
        text: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setChat(prev => prev ? { 
        ...prev, 
        messages: [...prev.messages, res.data] 
      } : prev);
      
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

 

  const handleCreateContract = () => {
    // Redirect to contract creation page with proper parameters
    const propertyId = chat.property?._id || chat.property;
    const participantId = otherParticipant?._id || otherParticipant;
    navigate(`/create-contract?propertyId=${propertyId}&participantId=${participantId}`);
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp || Date.now());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to fetch contracts for property
  const fetchContractsForProperty = async () => {
    if (!chat || !chat.property) {
      console.log('No chat or property found');
      return;
    }
    try {
      const propertyId = chat.property._id || chat.property;
      console.log('Fetching contracts for property:', propertyId);
      const res = await axios.get(`${API_BASE}/api/contract/property/${propertyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Contracts response:', res.data);
      if (res.data) {
        // If it's a single contract, convert to array
        const contracts = Array.isArray(res.data) ? res.data : [res.data];
        setContractsForFAQ(contracts);
      }
    } catch (err) {
      console.error('Error fetching contracts for FAQ:', err);
      setContractsForFAQ([]);
    }
  };
  useEffect(() => {
    fetchContractsForProperty();
  }, [chat]);

  


  // Add polling to keep contracts updated
  useEffect(() => {
    if (!chat?.property) return;
    
    const interval = setInterval(() => {
        fetchContractsForProperty();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [chat?.property]);

  // Signature handling functions
  const handleSignatureSave = async (contractId) => {
    if (!signaturePadRef || signaturePadRef.isEmpty()) {
      alert('Please provide your signature.');
      return;
    }

    try {
      const signatureImage = signaturePadRef.toDataURL();
      await axios.post(`${API_BASE}/api/contract/${contractId}/sign`, {
        signatureText: `Signed electronically by ${user.name}`,
        signatureImage: signatureImage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Clear signature and hide pad
      setSignatureData('');
      setShowSignaturePad(false);
      setCurrentSigningContract(null);
      if (signaturePadRef) signaturePadRef.clear();

      // Refresh contracts
      await fetchContractsForProperty();
      alert('Contract signed successfully!');
    } catch (err) {
      console.error('Error signing contract:', err);
      alert('Failed to sign contract. Please try again.');
    }
  };

  const handleSignatureClear = () => {
    if (signaturePadRef) {
      signaturePadRef.clear();
    }
    setSignatureData('');
  };

  const handleShowSignaturePad = (contract) => {
    setCurrentSigningContract(contract);
    setShowSignaturePad(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-900 mx-auto mb-4"></div>
          <div className="text-green-900 text-lg font-semibold">Loading chat...</div>
          <div className="text-green-700 text-sm mt-2">Connecting to conversation</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-green-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-green-900" />
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-4">Please Login</h2>
          <p className="text-green-800 text-lg">You need to be logged in to chat.</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-green-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-4">Chat Not Found</h2>
          <p className="text-green-800 text-lg">The chat you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Get the other participant
  const otherParticipant = chat.participants.find(p => String(p._id || p) !== String(user._id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col pt-25">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-green-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/messages')}
              className="p-3 hover:bg-green-100 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-6 w-6 text-green-900" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={otherParticipant?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}&background=3c7655&color=fff`}
                  alt={otherParticipant?.name}
                  className="h-14 w-14 rounded-full border-4 border-green-200 object-cover shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="font-bold text-xl text-green-900">{otherParticipant?.name || 'Unknown User'}</h2>
                <p className="text-sm text-green-700 font-medium">Re: {chat.property?.title || 'Property'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Online</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 hover:bg-green-100 rounded-full transition-all duration-200 hover:scale-105">
              <MoreVertical className="h-5 w-5 text-green-900" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-green-50/50 to-white chat-scrollbar">
        {chat.messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-12 w-12 text-green-700" />
            </div>
            <div className="text-green-900 text-2xl font-bold mb-2">Start the Conversation!</div>
            <p className="text-green-700 text-lg">Send your first message to begin chatting</p>
            <div className="mt-6 text-sm text-green-600">
              💬 Real-time messaging • 🔒 Secure • 📱 Responsive
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chat.messages.map((message, index) => {
              const isOwnMessage = String(message.sender?._id || message.sender) === String(user._id);
              const sender = chat.participants.find(p => String(p._id || p) === String(message.sender?._id || message.sender));
              const isLastMessage = index === chat.messages.length - 1;
              
                              return (
                  <div
                    key={message.id || index}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isOwnMessage ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                  <div className={`flex items-end gap-3 max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isOwnMessage && (
                      <img
                        src={sender?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.name || 'User')}&background=3c7655&color=fff`}
                        alt={sender?.name}
                        className="h-8 w-8 rounded-full border-2 border-green-200 object-cover shadow-sm"
                      />
                    )}
                    <div className={`relative group ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      <div 
                        className={`
                          px-4 py-3 rounded-2xl shadow-sm border max-w-full break-words
                          ${isOwnMessage 
                            ? 'bg-green-600 text-white rounded-br-md' 
                            : 'bg-white text-green-900 border-green-200 rounded-bl-md'
                          }
                          transition-all duration-200 hover:shadow-md
                        `}
                      >
                        {message.image ? (
                          <div>
                            <img
                              src={message.image.startsWith('http') ? message.image : `${API_BASE}${message.image}`}
                              alt="Shared image"
                              className="w-full max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.image.startsWith('http') ? message.image : `${API_BASE}${message.image}`, '_blank')}
                            />
                            {message.text && (
                              <div className="text-sm leading-relaxed mt-2">{message.text}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed">{message.text}</div>
                        )}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end gap-3">
                  <img
                    src={otherParticipant?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}&background=3c7655&color=fff`}
                    alt={otherParticipant?.name}
                    className="h-8 w-8 rounded-full border-2 border-green-200 object-cover"
                  />
                                     <div className="bg-white border border-green-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-green-400 rounded-full typing-dot"></div>
                       <div className="w-2 h-2 bg-green-400 rounded-full typing-dot"></div>
                       <div className="w-2 h-2 bg-green-400 rounded-full typing-dot"></div>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FAQ/ContractCards always at the bottom above input */}
      <div className="px-6 pb-2 space-y-4">
        {/* Only show FAQCards if there are contracts */}
        {contractsForFAQ.length > 0 && contractsForFAQ.map((contract, index) => (
          <FAQCard
            key={`${contract.contractId}-${contract.contractStatus?.current || contract.status}-${JSON.stringify(contract.approvals)}-${JSON.stringify(contract.signatures)}`}
            contract={contract}
            currentUser={user}
            onContractAction={async (action) => {
                  try {
                switch (action) {
                  case 'create':
                    setShowCreateContractModal(true);
                    break;
                  case 'approve':
                    await axios.post(`${API_BASE}/api/contract/${contract.contractId}/approve`, {}, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    await fetchContractsForProperty();
                    break;
                  case 'reject':
                    await axios.post(`${API_BASE}/api/contract/${contract.contractId}/reject`, {}, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    await fetchContractsForProperty();
                    break;
                  case 'download':
                  try {
                      const res = await axios.post(`${API_BASE}/api/contract/${contract.contractId}/pdf`, {}, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                      responseType: 'blob'
                    });
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                      link.setAttribute('download', `Rental_Contract_${contract.contractId}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (err) {
                      console.error('Error downloading PDF:', err);
                    alert('Failed to download PDF.');
                  }
                    return;
                  case 'sign':
                    handleShowSignaturePad(contract);
                    return;
                  default:
                    console.warn('Unknown action:', action);
                }
              } catch (err) {
                console.error(`Error performing ${action}:`, err);
                alert(`Failed to ${action} contract.`);
              }
            }}
            onSignatureSave={() => handleSignatureSave(contract.contractId)}
            showSignaturePad={showSignaturePad && currentSigningContract?.contractId === contract.contractId}
            setShowSignaturePad={handleShowSignaturePad}
            signaturePadRef={signaturePadRef}
            onClearSignature={handleSignatureClear}
            onSaveSignature={() => handleSignatureSave(contract.contractId)}
            onDelete={async (contractId) => {
              try {
                await axios.delete(`${API_BASE}/api/contract/remove/${contractId}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setContractsForFAQ(prev => prev.filter(c => c.contractId !== contractId));
              } catch (err) {
                console.error('Error deleting contract:', err);
                alert('Failed to delete contract.');
              }
            }}
            isLatest={index === 0}
              />
            ))}
      </div>

      {/* Enhanced Message Input */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-green-200 p-6">
                  <div className="flex items-end gap-4">
            <div className="flex items-center gap-2">
              <button 
                className="p-3 hover:bg-green-100 rounded-full transition-all duration-200 hover:scale-105"
                onClick={() => imageInputRef.current?.click()}
              >
                <Image className="h-5 w-5 text-green-700" />
              </button>
              <button 
                className="p-3 hover:bg-green-100 rounded-full transition-all duration-200 hover:scale-105"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-5 w-5 text-green-700" />
              </button>
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                className="w-full rounded-2xl border-2 border-green-200 p-4 resize-none focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                rows={1}
                placeholder="Type your message..."
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              {/* Hidden file input for image selection */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateContract}
                className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <FileText className="h-4 w-4" />
                Contract
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className={`
                  p-4 rounded-full font-bold transition-all duration-200 flex items-center justify-center
                  ${newMessage.trim() 
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-4 p-4 bg-white border border-green-200 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-700 font-semibold">Image Preview</span>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-48 object-cover rounded-lg mb-3"
            />
            <button
              onClick={handleSendImage}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200"
            >
              Send Image
            </button>
          </div>
        )}
        
        {/* Emoji Picker (placeholder) */}
        {showEmojiPicker && (
          <div className="mt-4 p-4 bg-white border border-green-200 rounded-2xl shadow-lg">
            <div className="text-center text-green-700">Emoji picker coming soon! 😊</div>
          </div>
        )}
      </div>

      {/* Congratulation Popup */}
      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-green-600 rounded-3xl shadow-2xl p-10 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">Congratulations!</h2>
            <p className="text-green-800 text-lg">The contract is now fully approved by both parties.</p>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      <Modal
        isOpen={showContractModal}
        onRequestClose={() => { 
          setShowContractModal(false); 
          setModalContractPdf(null); 
          setCurrentViewingContract(null);
        }}
        contentLabel="Contract Preview"
        style={{ 
          overlay: { 
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          content: {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            border: 'none',
            background: 'transparent',
            padding: '0',
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '800px'
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-xl font-bold">Contract Preview</h2>
                <p className="text-green-100 text-sm">
                  {currentViewingContract?.contractId ? `Contract #${currentViewingContract.contractId}` : 'Rental Agreement'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { 
                setShowContractModal(false); 
                setModalContractPdf(null); 
                setCurrentViewingContract(null);
              }}
              className="text-white hover:text-green-200 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* PDF Content */}
          <div className="p-6">
          {modalContractPdf ? (
              <div className="relative">
                <iframe 
                  src={modalContractPdf} 
                  title="Contract PDF" 
                  className="w-full h-[70vh] border border-gray-300 rounded-lg shadow-inner"
                  style={{ minHeight: '500px' }}
                />
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = modalContractPdf;
                      link.setAttribute('download', `Rental_Contract_${currentViewingContract?.contractId || 'preview'}.pdf`);
                      link.click();
                    }}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <span>📥</span>
                    <span>Download PDF</span>
                  </button>
          <button
                    onClick={() => window.open(modalContractPdf, '_blank')}
                    className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
                    <span>🔗</span>
                    <span>Open in New Tab</span>
          </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                <p className="text-gray-600 text-lg">Generating PDF preview...</p>
                <p className="text-gray-500 text-sm mt-2">Please wait while we prepare your contract</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Contract Creation Modal */}
      <Modal
        isOpen={showCreateContractModal}
        onRequestClose={() => setShowCreateContractModal(false)}
        contentLabel="Create Contract"
        style={{ overlay: { zIndex: 1000 } }}
      >
        <div className="flex flex-col items-center justify-center p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Create Legal Rental Contract</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCreatingContract(true);
              setFormErrors({});
              // Basic validation (add more as needed)
              if (!signatureData) {
                setFormErrors({ signature: 'Signature is required.' });
                setCreatingContract(false);
                return;
              }
              try {
                // You may want to prefill propertyId, participantId, etc. from chat context
                const contractPayload = {
                  propertyId: chat.property?._id || chat.property,
                  tenantId: otherParticipant?._id || otherParticipant,
                  landlordId: user._id,
                  ...contractFormData,
                  signatureImage: signatureData,
                };
                await axios.post('http://localhost:5000/api/contract', contractPayload, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setShowCreateContractModal(false);
                setSignatureData('');
                setContractFormData({});
                // Optionally, show a toast or confirmation
              } catch (err) {
                setFormErrors({ submit: 'Failed to create contract.' });
              } finally {
                setCreatingContract(false);
              }
            }}
            className="w-full max-w-lg space-y-4"
          >
            {/* Example: Add more fields as needed */}
            <input
              type="text"
              placeholder="Monthly Rent"
              className="w-full border p-2 rounded"
              value={contractFormData.monthlyRent || ''}
              onChange={e => setContractFormData(f => ({ ...f, monthlyRent: e.target.value }))}
              required
            />
            {/* Signature Pad */}
            <div className="my-4">
              <label className="block mb-2 font-semibold">E-Signature</label>
              <SignaturePadWrapper
                ref={setSignaturePadRef}
                options={{ minWidth: 2, maxWidth: 4, penColor: 'rgb(44, 102, 85)' }}
              />
              <button
                type="button"
                className="mt-2 px-3 py-1 bg-gray-200 rounded"
                onClick={() => { signaturePadRef && signaturePadRef.clear(); setSignatureData(''); }}
              >
                Clear
              </button>
              <button
                type="button"
                className="mt-2 ml-2 px-3 py-1 bg-green-600 text-white rounded"
                onClick={() => {
                  if (signaturePadRef && !signaturePadRef.isEmpty()) {
                    setSignatureData(signaturePadRef.toDataURL());
                    setFormErrors(e => ({ ...e, signature: undefined }));
                  } else {
                    setFormErrors(e => ({ ...e, signature: 'Signature is required.' }));
                  }
                }}
              >
                Save Signature
              </button>
              {formErrors.signature && <div className="text-red-500 text-sm mt-1">{formErrors.signature}</div>}
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
              disabled={creatingContract}
            >
              {creatingContract ? 'Creating...' : 'Create Contract'}
            </button>
            {formErrors.submit && <div className="text-red-500 text-sm mt-2">{formErrors.submit}</div>}
          </form>
          <button
            className="mt-4 px-4 py-2 bg-gray-300 rounded-lg font-semibold hover:bg-gray-400"
            onClick={() => setShowCreateContractModal(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage; 