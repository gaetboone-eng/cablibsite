import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { 
  MessageCircle, Send, ArrowLeft, User, Home, 
  Loader2, Search, Mail, CheckCircle, Circle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MessagesPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Get recipient from URL params (for direct contact)
  const recipientId = searchParams.get('to');
  const listingId = searchParams.get('listing');

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('cablib_token');
      const response = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchConversations();
  }, [user, navigate, fetchConversations]);

  // Handle direct contact from listing page
  useEffect(() => {
    if (recipientId && !loading) {
      const existingConv = conversations.find(
        c => c.other_user_id === recipientId && 
             (listingId ? c.listing_id === listingId : !c.listing_id)
      );
      
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        // Create a new conversation placeholder
        fetchRecipientInfo(recipientId, listingId);
      }
    }
  }, [recipientId, listingId, loading, conversations]);

  const fetchRecipientInfo = async (userId, lstId) => {
    try {
      const token = localStorage.getItem('cablib_token');
      const userResponse = await axios.get(`${API}/users/${userId}/public`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let listingTitle = null;
      if (lstId) {
        const listingResponse = await axios.get(`${API}/listings/${lstId}`);
        listingTitle = listingResponse.data.title;
      }

      setSelectedConversation({
        other_user_id: userId,
        other_user_name: `${userResponse.data.first_name} ${userResponse.data.last_name}`,
        other_user_email: '',
        listing_id: lstId || null,
        listing_title: listingTitle,
        last_message: '',
        last_message_date: new Date().toISOString(),
        unread_count: 0,
        isNew: true
      });
    } catch (error) {
      toast.error('Impossible de charger les informations du destinataire');
    }
  };

  const fetchMessages = useCallback(async (conv) => {
    if (!conv || conv.isNew) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('cablib_token');
      const url = conv.listing_id 
        ? `${API}/messages/conversation/${conv.other_user_id}?listing_id=${conv.listing_id}`
        : `${API}/messages/conversation/${conv.other_user_id}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      
      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!selectedConversation) return;
    
    const interval = setInterval(() => {
      fetchMessages(selectedConversation);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [selectedConversation, fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const token = localStorage.getItem('cablib_token');
      await axios.post(
        `${API}/messages`,
        {
          receiver_id: selectedConversation.other_user_id,
          listing_id: selectedConversation.listing_id || null,
          content: newMessage.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewMessage('');
      
      // If this was a new conversation, mark it as not new
      if (selectedConversation.isNew) {
        setSelectedConversation(prev => ({ ...prev, isNew: false }));
      }
      
      // Refresh messages and conversations
      await fetchMessages(selectedConversation);
      await fetchConversations();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.listing_title && conv.listing_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-20 h-screen flex">
        {/* Conversations List */}
        <div className={`w-full md:w-96 bg-white border-r border-border flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              Messages
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucune conversation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Contactez un propriétaire depuis une annonce
                </p>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left border-b border-border hover:bg-secondary/30 transition-colors ${
                    selectedConversation?.other_user_id === conv.other_user_id &&
                    selectedConversation?.listing_id === conv.listing_id
                      ? 'bg-primary/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground truncate">
                          {conv.other_user_name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conv.last_message_date)}
                        </span>
                      </div>
                      {conv.listing_title && (
                        <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                          <Home className="h-3 w-3" />
                          {conv.listing_title}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conv.last_message}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${
          selectedConversation ? 'flex' : 'hidden md:flex'
        }`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-border p-4 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="bg-primary/10 rounded-full p-2">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {selectedConversation.other_user_name}
                  </p>
                  {selectedConversation.listing_title && (
                    <p className="text-sm text-primary flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {selectedConversation.listing_title}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-100">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {selectedConversation.isNew 
                        ? 'Démarrez la conversation'
                        : 'Aucun message dans cette conversation'
                      }
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          msg.sender_id === user.id
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-white text-foreground rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.sender_id === user.id ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          <span>{formatDate(msg.created_at)}</span>
                          {msg.sender_id === user.id && (
                            msg.read 
                              ? <CheckCircle className="h-3 w-3" />
                              : <Circle className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="bg-white border-t border-border p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 border border-border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-primary text-white rounded-full p-3 shadow-lg shadow-primary/20"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-stone-100">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-xl font-semibold text-muted-foreground">
                  Sélectionnez une conversation
                </p>
                <p className="text-muted-foreground mt-1">
                  Ou contactez un propriétaire depuis une annonce
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
