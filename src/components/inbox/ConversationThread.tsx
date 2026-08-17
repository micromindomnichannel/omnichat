import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../state/store';
import { useVertical } from '../../state/verticalContext';
import { ChannelIcon } from '../../components/shared/ChannelIcon';
import { Send, User, Bot, Loader2 } from 'lucide-react';

interface Props {
  conversationId: string;
}

export function ConversationThread({ conversationId }: Props) {
  const { state, dispatch } = useStore();
  const { accentColor, accentBg } = useVertical();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = state.conversations.find(c => c.id === conversationId);
  const customer = state.customers.find(c => c.id === conversation?.customerId);
  const threadMessages = state.messages[conversationId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threadMessages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim() || !conversation) return;

    const newMessage: any = {
      id: `m-${Date.now()}`,
      conversationId,
      sender: 'human',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: 'You'
    };

    dispatch({ type: 'ADD_MESSAGE', conversationId, message: newMessage });
    setInputValue('');

    // Simulate AI reply after 1-2 seconds if still AI handling
    if (conversation.status === 'ai_handling') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiReply: any = {
          id: `m-${Date.now() + 1}`,
          conversationId,
          sender: 'ai',
          content: 'Thank you for your message. I'll help you with that right away.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        dispatch({ type: 'ADD_MESSAGE', conversationId, message: aiReply });
      }, 1200);
    }
  };

  const handleTakeover = () => {
    if (!conversation) return;
    const newStatus = conversation.status === 'ai_handling' ? 'human' : 'ai_handling';
    dispatch({ type: 'SET_CONVERSATION_STATUS', id: conversationId, status: newStatus });

    const systemMessage: any = {
      id: `m-${Date.now()}`,
      conversationId,
      sender: 'system',
      content: newStatus === 'human' ? 'You are now handling this conversation.' : 'AI is now handling this conversation.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    dispatch({ type: 'ADD_MESSAGE', conversationId, message: systemMessage });
  };

  if (!conversation || !customer) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-0)', color: 'var(--ink-400)'
      }}>
        Select a conversation to start
      </div>
    );
  }

  const isAIHandling = conversation.status === 'ai_handling';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 480, background: 'var(--surface-0)' }}>
      {/* Header */}
      <div style={{
        height: 56, padding: '0 20px',
        background: 'var(--surface-1)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={customer.avatar} alt={customer.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink-900)' }}>{customer.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChannelIcon channel={conversation.channel} size={12} />
              <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{conversation.channel}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            padding: '4px 10px', borderRadius: 4,
            background: isAIHandling ? accentBg : 'var(--ink-900)',
            color: isAIHandling ? accentColor : 'white',
            fontSize: 11, fontWeight: 600
          }}>
            {isAIHandling ? 'AI Handling' : 'Human'}
          </span>
          <button
            onClick={handleTakeover}
            className="btn btn-outline"
            style={{ height: 34, padding: '0 14px', fontSize: 12 }}
          >
            {isAIHandling ? 'Take over' : 'Return to AI'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {threadMessages.map(msg => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                <div style={{
                  padding: '6px 14px', borderRadius: 12, background: 'var(--surface-1)',
                  border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <Bot size={12} color="var(--ink-400)" />
                  <span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500 }}>
                    {msg.content}
                  </span>
                </div>
              </div>
            );
          }

          const isCustomer = msg.sender === 'customer';
          const isAI = msg.sender === 'ai';
          const isHuman = msg.sender === 'human';

          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: isCustomer ? 'flex-start' : 'flex-end',
              gap: 8
            }}>
              {isCustomer && (
                <img src={customer.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', marginTop: 4 }} />
              )}
              <div style={{ maxWidth: '70%' }}>
                {(isAI || isHuman) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2,
                    justifyContent: 'flex-end'
                  }}>
                    {isAI && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: accentColor,
                        background: accentBg, padding: '2px 6px', borderRadius: 4
                      }}>
                        AI
                      </span>
                    )}
                    {isHuman && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: 'var(--ink-400)'
                      }}>
                        {msg.agentName || 'You'}
                      </span>
                    )}
                  </div>
                )}
                <div style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: isCustomer ? 'var(--surface-1)' : isAI ? accentBg : 'var(--ink-900)',
                  color: isCustomer ? 'var(--ink-900)' : isAI ? 'var(--ink-900)' : 'white',
                  border: isCustomer ? '1px solid var(--border)' : 'none',
                  borderBottomLeftRadius: isCustomer ? 4 : 12,
                  borderBottomRightRadius: isCustomer ? 12 : 4,
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  direction: msg.isArabic ? 'rtl' : 'ltr',
                  textAlign: msg.isArabic ? 'right' : 'left'
                }}>
                  {msg.content}
                </div>
                <p style={{
                  fontSize: 10, color: 'var(--ink-400)', marginTop: 2,
                  textAlign: isCustomer ? 'left' : 'right',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {msg.timestamp}
                </p>
              </div>
              {isHuman && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--ink-900)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, marginTop: 4
                }}>
                  Y
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <div style={{
              padding: '10px 14px', borderRadius: 12, background: accentBg,
              borderBottomRightRadius: 4, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Loader2 size={14} color={accentColor} className="animate-spin" />
              <span style={{ fontSize: 12, color: accentColor }}>AI is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div style={{
        padding: '12px 20px', background: 'var(--surface-1)',
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--surface-0)', borderRadius: 8,
          padding: '0 12px', border: '1px solid var(--border)'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isAIHandling ? "AI is handling this conversation" : "Type a message..."}
            disabled={isAIHandling}
            style={{
              flex: 1, height: 44, border: 'none', background: 'transparent',
              fontSize: 13.5, outline: 'none', color: 'var(--ink-900)'
            }}
          />
          <button
            onClick={handleSend}
            disabled={isAIHandling || !inputValue.trim()}
            style={{
              width: 32, height: 32, borderRadius: 6,
              background: isAIHandling ? 'var(--surface-0)' : accentColor,
              border: 'none', cursor: isAIHandling ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isAIHandling ? 0.5 : 1
            }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
