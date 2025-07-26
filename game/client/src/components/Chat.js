import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [hasJoined, setHasJoined] = useState(false);
  const messagesEndRef = useRef(null);

  // 사용자 정보가 있으면 닉네임 자동 설정
  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname);
    }
  }, [user]);

  // 사용자 정보가 있고 아직 입장하지 않았다면 자동 입장
  useEffect(() => {
    if (user?.nickname && !hasJoined && isConnected) {
      console.log('자동 입장 시도:', user.nickname);
      setTimeout(() => {
        const joinMessage = `${user.nickname}님이 입장하셨습니다.`;
        console.log('입장 메시지 전송:', joinMessage);
        socket.emit('notice', joinMessage);
        setHasJoined(true);
      }, 500);
    }
  }, [user, hasJoined, isConnected]);

  useEffect(() => {
    // 소켓 이벤트 리스너 설정
    socket.on('chat message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    
    socket.on('notice', (msg) => {
      setMessages((prev) => [...prev, { notice: true, text: msg }]);
    });

    // 온라인 유저 리스트 업데이트
    socket.on('user list', (users) => {
      setOnlineUsers(users);
    });

    // 연결 상태 확인
    socket.on('connect', () => {
      setIsConnected(true);
    });

    return () => {
      socket.off('chat message');
      socket.off('notice');
      socket.off('user list');
      socket.off('connect');
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
    // 닉네임 설정 후 입장 메시지 전송
    setTimeout(() => {
      socket.emit('notice', `${nicknameInput}님이 입장하셨습니다.`);
      setHasJoined(true);
    }, 100);
  };

  // 사용자 정보가 있으면 바로 채팅 표시
  if (user?.nickname) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 16 }}>
        {/* 채팅창 */}
        <div style={{ flex: 1 }}>
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

        {/* 온라인 유저 리스트 */}
        <div style={{ width: 200, border: '1px solid #ccc', padding: 8 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}>온라인 유저 ({onlineUsers.length})</h3>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {onlineUsers.map((user, idx) => (
              <div key={idx} style={{ 
                padding: '4px 8px', 
                margin: '2px 0', 
                backgroundColor: user === nickname ? '#e3f2fd' : '#f5f5f5',
                borderRadius: 4,
                fontSize: 12
              }}>
                {user === nickname ? '나' : user}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 닉네임 입력 (기존 로직 유지)
  if (!nickname) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', marginTop: 40 }}>
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          {isConnected ? '서버에 연결되었습니다' : '서버에 연결 중...'}
        </div>
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
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 16 }}>
      {/* 채팅창 */}
      <div style={{ flex: 1 }}>
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

      {/* 온라인 유저 리스트 */}
      <div style={{ width: 200, border: '1px solid #ccc', padding: 8 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}>온라인 유저 ({onlineUsers.length})</h3>
        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
          {onlineUsers.map((user, idx) => (
            <div key={idx} style={{ 
              padding: '4px 8px', 
              margin: '2px 0', 
              backgroundColor: user === nickname ? '#e3f2fd' : '#f5f5f5',
              borderRadius: 4,
              fontSize: 12
            }}>
              {user === nickname ? '나' : user}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Chat; 
