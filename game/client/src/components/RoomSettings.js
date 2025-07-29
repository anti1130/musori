import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import InviteModal from './InviteModal';

const RoomSettings = ({ 
  roomId, 
  isOpen, 
  onClose, 
  darkMode, 
  customThemeColor,
  currentUser,
  onRoomDelete 
}) => {
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

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
    danger: '#dc3545'
  };

  // 채팅방 정보 로드
  useEffect(() => {
    if (isOpen && roomId) {
      loadRoomInfo();
    }
  }, [isOpen, roomId]);

  const loadRoomInfo = async () => {
    try {
      setLoading(true);
      const roomDoc = await getDoc(doc(db, 'chatrooms', roomId));
      
      if (roomDoc.exists()) {
        const data = roomDoc.data();
        setRoomInfo(data);
        setRoomName(data.name || '');
        setDescription(data.description || '');
        setIsPublic(data.isPublic !== false);
      }
    } catch (error) {
      console.error('채팅방 정보 로드 에러:', error);
      setError('채팅방 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!roomName.trim()) {
      setError('채팅방 이름을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateDoc(doc(db, 'chatrooms', roomId), {
        name: roomName.trim(),
        description: description.trim(),
        isPublic: isPublic
      });

      setEditing(false);
      loadRoomInfo(); // 정보 다시 로드
    } catch (error) {
      setError('채팅방 설정 저장에 실패했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 채팅방을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await deleteDoc(doc(db, 'chatrooms', roomId));
      onClose();
      if (onRoomDelete) {
        onRoomDelete(roomId);
      }
    } catch (error) {
      setError('채팅방 삭제에 실패했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const isOwner = roomInfo?.createdBy === currentUser?.uid;
  const isDefaultRoom = roomId === 'general';

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
            채팅방 설정
          </h2>
          <button
            onClick={onClose}
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

        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '40px',
            color: colors.text
          }}>
            로딩 중...
          </div>
        ) : (
          <div>
            {isDefaultRoom && (
              <div style={{
                padding: '12px',
                background: '#fff3cd',
                color: '#856404',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                기본 채팅방은 수정할 수 없습니다.
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.text
              }}>
                채팅방 이름
              </label>
              {editing ? (
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
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
                  disabled={isDefaultRoom}
                />
              ) : (
                <div style={{
                  padding: '12px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px'
                }}>
                  {roomInfo?.name}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.text
              }}>
                설명
              </label>
              {editing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  disabled={isDefaultRoom}
                />
              ) : (
                <div style={{
                  padding: '12px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px',
                  minHeight: '60px'
                }}>
                  {roomInfo?.description || '설명이 없습니다.'}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: editing ? 'pointer' : 'default',
                fontSize: '14px',
                color: colors.text
              }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={!editing || isDefaultRoom}
                  style={{
                    marginRight: '8px',
                    transform: 'scale(1.2)'
                  }}
                />
                공개 채팅방
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#aaa' : '#666',
                marginBottom: '4px'
              }}>
                멤버 수: {roomInfo?.members?.length || 0}명
              </div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#aaa' : '#666'
              }}>
                생성일: {roomInfo?.createdAt ? new Date(roomInfo.createdAt.toDate()).toLocaleDateString() : '알 수 없음'}
              </div>
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
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setRoomName(roomInfo?.name || '');
                      setDescription(roomInfo?.description || '');
                      setIsPublic(roomInfo?.isPublic !== false);
                      setError('');
                    }}
                    disabled={saving}
                    style={{
                      padding: '10px 20px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      background: 'transparent',
                      color: colors.text,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      background: colors.button,
                      color: colors.buttonText,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </>
              ) : (
                <>
                  {isOwner && !isDefaultRoom && (
                    <button
                      onClick={() => setEditing(true)}
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
                      수정
                    </button>
                  )}
                  <button
                    onClick={() => setShowInviteModal(true)}
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
                    사용자 초대
                  </button>
                  {isOwner && !isDefaultRoom && (
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        background: colors.danger,
                        color: 'white',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      {saving ? '삭제 중...' : '삭제'}
                    </button>
                  )}
                  <button
                    onClick={onClose}
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
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 사용자 초대 모달 */}
      <InviteModal
        roomId={roomId}
        roomName={roomInfo?.name || '채팅방'}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        darkMode={darkMode}
        customThemeColor={customThemeColor}
        currentUser={currentUser}
      />
    </div>
  );
};

export default RoomSettings; 