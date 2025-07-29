import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Profile({ user, onBack, darkMode, onUserUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activityScore, setActivityScore] = useState(0);
  const [newNickname, setNewNickname] = useState(user.nickname || '');
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [statusMessage, setStatusMessage] = useState(user.statusMessage || '');
  const [bio, setBio] = useState(user.bio || '');

  // 다크모드 색상
  const colors = {
    bg: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    headerBg: darkMode ? '#2d2d2d' : '#f8f9fa',
    headerText: darkMode ? '#ffffff' : '#000000',
    border: darkMode ? '#444' : '#ddd',
    buttonBg: darkMode ? '#444' : '#007bff',
    buttonText: darkMode ? '#ffffff' : '#ffffff',
    inputBg: darkMode ? '#333' : '#ffffff',
    inputText: darkMode ? '#ffffff' : '#000000',
    inputBorder: darkMode ? '#555' : '#ddd',
    scoreBg: darkMode ? '#2d2d2d' : '#f8f9fa',
    scoreText: darkMode ? '#FFD700' : '#007bff'
  };

  // 활동 점수 계산 (임시)
  useEffect(() => {
    setActivityScore(8500);
  }, []);

  // 사진 변경 처리
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 프로필 업데이트
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      let photoURL = user.photoURL;

      // 사진 업로드
      if (newPhoto) {
        const storageRef = ref(storage, `profile-photos/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, newPhoto);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      // 프로필 업데이트
      await updateProfile(auth.currentUser, {
        displayName: newNickname,
        photoURL: photoURL
      });

      // Firestore 업데이트
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        nickname: newNickname,
        email: user.email,
        photoURL: photoURL,
        statusMessage: statusMessage,
        bio: bio,
        lastSeen: new Date()
      }, { merge: true });

      // 사용자 정보 업데이트
      const updatedUser = {
        ...user,
        nickname: newNickname,
        photoURL: photoURL,
        statusMessage: statusMessage,
        bio: bio
      };

      setIsEditing(false);
      setNewPhoto(null);
      setPhotoPreview(null);
      
      // 부모 컴포넌트에 업데이트된 사용자 정보 전달
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (error) {
      setEditError('프로필 업데이트 중 오류가 발생했습니다.');
      console.error('Profile update error:', error);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: colors.bg,
      zIndex: 2000,
      overflowY: 'auto'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: colors.headerBg,
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 2001
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: colors.headerText,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← 뒤로가기
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold',
          color: colors.headerText
        }}>
          프로필
        </h1>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            background: colors.buttonBg,
            color: colors.buttonText,
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          편집
        </button>
      </div>

      {/* 프로필 내용 */}
      <div style={{
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* 프로필 정보 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          {/* 프로필 사진 */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: darkMode ? '#222' : '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: darkMode ? '#ffe066' : '#1976d2',
            marginBottom: '16px',
            overflow: 'hidden',
            border: `3px solid ${colors.border}`
          }}>
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="프로필" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: '50%' 
                }} 
              />
            ) : (
              user.nickname?.[0]?.toUpperCase() || 'U'
            )}
          </div>

          {/* 닉네임 */}
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '8px'
          }}>
            {user.nickname}
          </div>

          {/* 상태 메시지 */}
          {statusMessage && (
            <div style={{
              fontSize: '14px',
              color: darkMode ? '#ccc' : '#666',
              marginBottom: '8px',
              fontStyle: 'italic'
            }}>
              {statusMessage}
            </div>
          )}

          {/* 이메일 */}
          <div style={{
            fontSize: '14px',
            color: darkMode ? '#aaa' : '#666',
            marginBottom: '4px'
          }}>
            {user.email}
          </div>

          {/* 가입일 (임시) */}
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#888' : '#999',
            marginBottom: '4px'
          }}>
            가입일: 2024.01.01
          </div>

          {/* 마지막 로그인 */}
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#888' : '#999'
          }}>
            마지막 로그인: 방금 전
          </div>
        </div>

        {/* 자기소개 */}
        {bio && (
          <div style={{
            background: colors.scoreBg,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              color: colors.text
            }}>
              자기소개
            </h3>
            <div style={{
              fontSize: '14px',
              color: colors.text,
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {bio}
            </div>
          </div>
        )}

        {/* 활동 점수 */}
        <div style={{
          background: colors.scoreBg,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
          textAlign: 'center',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            fontSize: '14px',
            color: colors.text,
            marginBottom: '8px'
          }}>
            활동 점수
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: colors.scoreText
          }}>
            {activityScore.toLocaleString()}점
          </div>
        </div>

        {/* 설정 섹션 */}
        <div style={{
          background: colors.scoreBg,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            color: colors.text
          }}>
            설정
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <button style={{
              background: 'none',
              border: 'none',
              color: colors.text,
              textAlign: 'left',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              테마 설정
              <span>→</span>
            </button>
            
            <button style={{
              background: 'none',
              border: 'none',
              color: colors.text,
              textAlign: 'left',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              알림 설정
              <span>→</span>
            </button>
            
            <button style={{
              background: 'none',
              border: 'none',
              color: colors.text,
              textAlign: 'left',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              개인정보 관리
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: colors.bg,
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
            margin: '20px'
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
                color: colors.text
              }}>
                프로필 편집
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewPhoto(null);
                  setPhotoPreview(null);
                  setStatusMessage(user.statusMessage || '');
                  setBio(user.bio || '');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleProfileUpdate}>
              {/* 프로필 사진 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: darkMode ? '#222' : '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  color: darkMode ? '#ffe066' : '#1976d2',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="미리보기" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        borderRadius: '50%' 
                      }} 
                    />
                  ) : user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="프로필" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        borderRadius: '50%' 
                      }} 
                    />
                  ) : (
                    user.nickname?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '14px',
                    color: colors.text
                  }}>
                    프로필 사진
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{
                      fontSize: '12px',
                      color: colors.text,
                      width: '100%'
                    }}
                    disabled={editLoading}
                  />
                </div>
              </div>

              {/* 닉네임 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: colors.text
                }}>
                  닉네임
                </label>
                <input
                  type="text"
                  value={newNickname}
                  onChange={e => setNewNickname(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.inputText,
                    fontSize: '14px'
                  }}
                  disabled={editLoading}
                />
              </div>

              {/* 상태 메시지 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: colors.text
                }}>
                  상태 메시지 ({statusMessage.length}/50)
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={e => setStatusMessage(e.target.value.slice(0, 50))}
                  placeholder="상태 메시지를 설정해보세요"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.inputText,
                    fontSize: '14px'
                  }}
                  disabled={editLoading}
                />
              </div>

              {/* 자기소개 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: colors.text
                }}>
                  자기소개 ({bio.length}/200)
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="자기소개를 작성해보세요"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.inputText,
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  disabled={editLoading}
                />
              </div>

              {editError && (
                <div style={{
                  color: '#dc3545',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  {editError}
                </div>
              )}

              {/* 버튼들 */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNewPhoto(null);
                    setPhotoPreview(null);
                    setStatusMessage(user.statusMessage || '');
                    setBio(user.bio || '');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'none',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  disabled={editLoading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: colors.buttonBg,
                    color: colors.buttonText,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  disabled={editLoading}
                >
                  {editLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile; 