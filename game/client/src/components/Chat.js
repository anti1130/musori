import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('notice', (msg) => {
      setMessages((prev) => [...prev, { notice: true, text: msg }]);
    });
    return () => {
      socket.off('chat message');
      socket.off('notice');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === '' || !nickname) return;
    socket.emit('chat message', `${nickname}: ${input}`);
    setInput('');
  };

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nicknameInput.trim() === '') return;
    setNickname(nicknameInput);
    socket.emit('notice', `${nicknameInput}님이 입장하셨습니다.`);
  };

  if (!nickname) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', marginTop: 40 }}>
        <form onSubmit={handleNicknameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            placeholder="닉네임을 입력하세요"
            style={{ padding: 8 }}
          />
          <button type="submit">입장</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ border: '1px solid #ccc', height: 300, overflowY: 'auto', padding: 8, marginBottom: 8 }}>
        {messages.map((msg, idx) =>
          msg.notice ? (
            <div key={idx} style={{ color: '#888', fontStyle: 'italic', margin: '4px 0' }}>{msg.text}</div>
          ) : (
            <div key={idx} style={{ margin: '4px 0' }}>{msg}</div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, marginRight: 4 }}
          placeholder="메시지를 입력하세요"
        />
        <button type="submit">전송</button>
      </form>
    </div>
  );
}

export default Chat; 
