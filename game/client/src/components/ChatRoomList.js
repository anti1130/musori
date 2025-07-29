import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_ROOM_ID } from '../utils/chatroomUtils';
import CreateRoomModal from './CreateRoomModal';
import RoomSettings from './RoomSettings';

const ChatRoomList = ({ 
  currentRoomId, 
  onRoomSelect, 
  darkMode, 
  customThemeColor,
  onClose,
  currentUser
}) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // 다크모드 색상
  const colors = {
    bg: darkMode ? '#23272a' : '#f8f9fa',
    text: darkMode ? '#ffffff' : '#333333',
    border: darkMode ? '#444' : '#ddd',
    hover: darkMode ? '#2d3748' : '#e9ecef',
    active: darkMode ? '#4a5568' : '#dee2e6',
    button: darkMode ? '#444' : customThemeColor,
    buttonText: darkMode ? '#ffffff' : '#ffffff'
  };

  // 채팅방 목록 실시간 감지
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'chatrooms'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = [];
      snapshot.forEach((doc) => {
        const roomData = { id: doc.id, ...doc.data() };
        
        // 비공개 채팅방은 멤버이거나 생성자인 경우만 표시
        if (roomData.isPublic === false) {
          const members = roomData.members || [];
          const isMember = members.includes(currentUser.uid);
          const isCreator = roomData.createdBy === currentUser.uid;
          
          if (isMember || isCreator) {
            roomList.push(roomData);
          }
        } else {
          // 공개 채팅방은 모두 표시
          roomList.push(roomData);
        }
      });
      setRooms(roomList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleRoomClick = (roomId) => {
    // 비공개 채팅방 접근 확인
    const room = rooms.find(r => r.id === roomId);
    if (room && room.isPublic === false) {
      const members = room.members || [];
      const isMember = members.includes(currentUser.uid);
      const isCreator = room.createdBy === currentUser.uid;
      
      if (!isMember && !isCreator) {
        alert('비공개 채팅방입니다. 초대를 받아야 입장할 수 있습니다.');
        return;
      }
    }
    
    onRoomSelect(roomId);
    if (onClose) onClose();
  };

  if (loading) {
    return (
      <div style={{
        width: 240,
        height: '100vh',
        background: colors.bg,
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{
      width: 240,
      height: '100vh',
      background: colors.bg,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: colors.text
        }}>
          채팅방
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: colors.button,
            color: colors.buttonText,
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          + 새방
        </button>
      </div>

      {/* 채팅방 목록 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleRoomClick(room.id)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              background: currentRoomId === room.id ? colors.active : 'transparent',
              borderBottom: `1px solid ${colors.border}`,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentRoomId !== room.id) {
                e.target.style.background = colors.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (currentRoomId !== room.id) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: colors.text
                }}>
                  {room.name}
                </div>
                {room.isPublic === false && (
                  <span style={{
                    fontSize: '10px',
                    color: '#666',
                    background: '#ffeb3b',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}>
                    🔒 비공개
                  </span>
                )}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {room.id === DEFAULT_ROOM_ID && (
                  <span style={{
                    fontSize: '10px',
                    color: '#666',
                    background: '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}>
                    기본
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRoomId(room.id);
                    setShowSettingsModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: colors.text,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    opacity: 0.7
                  }}
                  title="채팅방 설정"
                >
                  ⚙️
                </button>
              </div>
            </div>
            {room.description && (
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#aaa' : '#666',
                marginBottom: '4px'
              }}>
                {room.description}
              </div>
            )}
            <div style={{
              fontSize: '11px',
              color: darkMode ? '#888' : '#999'
            }}>
              멤버 {room.members?.length || 0}명
            </div>
          </div>
        ))}
      </div>
      
      {/* 채팅방 생성 모달 */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={(roomId) => {
          setShowCreateModal(false);
          // 새로 생성된 채팅방으로 이동
          if (onRoomSelect) {
            onRoomSelect(roomId);
          }
        }}
        darkMode={darkMode}
        customThemeColor={customThemeColor}
        currentUser={currentUser}
      />

      {/* 채팅방 설정 모달 */}
      <RoomSettings
        roomId={selectedRoomId}
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setSelectedRoomId(null);
        }}
        onRoomDelete={(deletedRoomId) => {
          // 삭제된 채팅방이 현재 선택된 채팅방이면 "전체" 채팅방으로 이동
          if (deletedRoomId === currentRoomId) {
            onRoomSelect(DEFAULT_ROOM_ID);
          }
        }}
        darkMode={darkMode}
        customThemeColor={customThemeColor}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ChatRoomList; 