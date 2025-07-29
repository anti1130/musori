import React, { useState } from 'react';
import { createChatRoom } from '../utils/chatroomUtils';

const CreateRoomModal = ({ 
  isOpen, 
  onClose, 
  onCreateRoom, 
  darkMode, 
  customThemeColor,
  currentUser 
}) => {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 다크모드 색상
  const colors = {
    bg: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    border: darkMode ? '#444' : '#ddd',
    inputBg: darkMode ? '#333' : '#ffffff',
    inputText: darkMode ? '#ffffff' : '#000000',
    inputBorder: darkMode ? '#555' : '#ddd',
    button: darkMode ? '#444' : customThemeColor,
    buttonText: darkMode ? '#ffffff' : '#ffffff',
    overlay: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      setError('채팅방 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const roomData = {
        name: roomName.trim(),
        description: description.trim(),
        createdBy: currentUser.uid,
        members: [currentUser.uid], // 생성자를 멤버로 추가
        isPublic: isPublic
      };

      const roomId = await createChatRoom(roomData);
      
      // 성공 시 폼 초기화
      setRoomName('');
      setDescription('');
      setIsPublic(true);
      
      // 부모 컴포넌트에 새 채팅방 알림
      if (onCreateRoom) {
        onCreateRoom(roomId);
      }
      
      onClose();
    } catch (error) {
      setError('채팅방 생성에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRoomName('');
      setDescription('');
      setIsPublic(true);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}>
      <div style={{
        background: colors.bg,
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: colors.text
          }}>
            새 채팅방 만들기
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: colors.text,
              cursor: 'pointer',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              채팅방 이름 *
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="채팅방 이름을 입력하세요"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '6px',
                background: colors.inputBg,
                color: colors.inputText,
                fontSize: '14px',
                outline: 'none'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              설명 (선택사항)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="채팅방에 대한 설명을 입력하세요"
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '6px',
                background: colors.inputBg,
                color: colors.inputText,
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              color: colors.text
            }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{
                  marginRight: '8px',
                  transform: 'scale(1.2)'
                }}
                disabled={loading}
              />
              공개 채팅방 (모든 사용자가 참여 가능)
            </label>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#fee',
              color: '#c33',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                background: 'transparent',
                color: colors.text,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: colors.button,
                color: colors.buttonText,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? '생성 중...' : '채팅방 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal; 