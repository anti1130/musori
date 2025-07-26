import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { doc, setDoc, deleteDoc, onSnapshot as onUserSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // 컴포넌트 마운트 확인
  console.log('Chat 컴포넌트 렌더링:', { user });

  // 실시간 메시지 수신
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [user]);

  // 온라인 유저 실시간 감지
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onUserSnapshot(collection(db, 'onlineUsers'), (snapshot) => {
      const userList = [];
      snapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setOnlineUsers(userList);
    });

    return () => unsubscribe();
  }, [user]);

  // 사용자 온라인 상태 설정
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'onlineUsers', user.uid);
    
    // 온라인 상태 설정
    setDoc(userRef, {
      nickname: user.nickname,
      email: user.email,
      lastSeen: serverTimestamp(),
      isOnline: true
    });

    // 컴포넌트 언마운트 시 오프라인 상태로 변경
    return () => {
      deleteDoc(userRef);
    };
  }, [user]);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: input,
        userId: user.uid,
        nickname: user.nickname,
        timestamp: serverTimestamp()
      });
      setInput('');
    } catch (error) {
      console.error('메시지 전송 에러:', error);
    }
  };

  // 사용자 정보가 있으면 바로 채팅 표시
  if (user?.nickname) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 16 }}>
        {/* 채팅창 */}
        <div style={{ flex: 1 }}>
          <div style={{ border: '1px solid #ccc', height: 300, overflowY: 'auto', padding: 8, marginBottom: 8 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ margin: '4px 0' }}>
                <strong>{msg.nickname}:</strong> {msg.text}
              </div>
            ))}
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
            {onlineUsers.map((onlineUser) => (
              <div key={onlineUser.id} style={{
                padding: '4px 8px',
                margin: '2px 0',
                backgroundColor: onlineUser.id === user.uid ? '#e3f2fd' : '#f5f5f5',
                borderRadius: 4,
                fontSize: 12
              }}>
                {onlineUser.id === user.uid ? '나' : onlineUser.nickname}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 로딩 표시
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', marginTop: 40, textAlign: 'center' }}>
      <div>로딩 중...</div>
    </div>
  );
}

export default Chat; 