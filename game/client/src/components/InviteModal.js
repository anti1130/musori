import React, { useState } from 'react';
import { inviteUserToRoom, getRoomMembers } from '../utils/chatroomUtils';

const InviteModal = ({ 
  roomId, 
  roomName,
  isOpen, 
  onClose, 
  darkMode, 
  customThemeColor,
  currentUser 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);

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
    overlay: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
    success: '#28a745',
    error: '#dc3545'
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await inviteUserToRoom(roomId, email.trim());
      setSuccess(`${result.nickname}님을 초대했습니다!`);
      setEmail('');
      
      // 멤버 목록 새로고침
      loadMembers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const memberList = await getRoomMembers(roomId);
      setMembers(memberList);
    } catch (error) {
      console.error('멤버 목록 로드 에러:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setError('');
      setSuccess('');
      setShowMembers(false);
      onClose();
    }
  };

  const handleShowMembers = async () => {
    if (!showMembers) {
      await loadMembers();
    }
    setShowMembers(!showMembers);
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
        maxWidth: '500px',
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
            {roomName} - 사용자 초대
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

        <form onSubmit={handleInvite}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              초대할 사용자 이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
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

          {error && (
            <div style={{
              padding: '12px',
              background: '#fee',
              color: colors.error,
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              background: '#d4edda',
              color: colors.success,
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {success}
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={handleShowMembers}
              style={{
                padding: '10px 20px',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                background: 'transparent',
                color: colors.text,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showMembers ? '멤버 목록 숨기기' : '멤버 목록 보기'}
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
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
                {loading ? '초대 중...' : '초대하기'}
              </button>
            </div>
          </div>
        </form>

        {/* 멤버 목록 */}
        {showMembers && (
          <div style={{
            borderTop: `1px solid ${colors.border}`,
            paddingTop: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              채팅방 멤버 ({members.length}명)
            </h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {members.map((member) => (
                <div
                  key={member.uid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: `1px solid ${colors.border}`
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: darkMode ? '#333' : '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: darkMode ? '#ffe066' : '#1976d2',
                    marginRight: 12
                  }}>
                    {member.photoURL ? (
                      <img 
                        src={member.photoURL} 
                        alt="프로필" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '50%' 
                        }} 
                      />
                    ) : (
                      member.nickname?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: colors.text
                    }}>
                      {member.nickname}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: darkMode ? '#aaa' : '#666'
                    }}>
                      {member.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteModal; 