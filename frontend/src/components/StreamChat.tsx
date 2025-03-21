import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  createdAt: string;
}

export default function StreamChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id } = useParams();
  const socket = useRef<any>(null);

  useEffect(() => {
    socket.current = io('http://localhost:3001');
    socket.current.emit('joinStream', id);
    socket.current.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      if (socket.current) {
        socket.current.emit('leaveStream', id);
        socket.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.current.emit('sendMessage', {
        streamId: id,
        content: newMessage,
        userId: 'current-user-id' // Sollte aus dem Auth-Context kommen
      });
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary-800 rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <img
                src={`/avatars/${message.userId}.jpg`}
                alt={message.username}
                className="w-8 h-8 rounded-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-secondary-400">{message.username}</span>
                <span className="text-sm text-primary-400">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-primary-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nachricht schreiben..."
            className="flex-1 bg-primary-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
          />
          <button
            type="submit"
            className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
          >
            Senden
          </button>
        </div>
      </form>
    </div>
  );
} 