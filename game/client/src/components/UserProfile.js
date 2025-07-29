import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function UserProfile({ userData, onBack, darkMode, customThemeColor }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 다크모드 색상 (테마 색상 적용)
  const colors = {
    bg: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    headerBg: darkMode ? '#2d2d2d' : '#f8f9fa',
    headerText: darkMode ? '#ffffff' : '#000000',
    border: darkMode ? '#444' : '#ddd',
    buttonBg: darkMode ? '#444' : customThemeColor,
    buttonText: darkMode ? '#ffffff' : '#ffffff',
    scoreBg: darkMode ? '#2d2d2d' : '#f8f9fa',
    scoreText: darkMode ? '#FFD700' : customThemeColor
  };

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true);
        console.log('Loading user data:', userData); // 디버깅용
        
        if (!userData || !userData.uid) {
          setError('사용자 정보가 올바르지 않습니다.');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', userData.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('User data from Firestore:', data); // 디버깅용
          setUserInfo({
            ...userData,
            ...data,
            // 개인정보는 제외
            email: undefined
          });
        } else {
          console.log('User document does not exist, using basic data'); // 디버깅용
          // onlineUsers에서 가져온 기본 정보로 프로필 표시
          setUserInfo({
            ...userData,
            activityScore: 0, // 기본 활동 점수
            createdAt: userData.lastSeen, // 마지막 활동을 가입일로 사용
            bio: '', // 빈 자기소개
            statusMessage: '' // 빈 상태메시지
          });
        }
      } catch (err) {
        console.error('User info load error:', err);
        console.error('UserData:', userData); // 디버깅용
        setError('사용자 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      loadUserInfo();
    }
  }, [userData]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: colors.bg,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: colors.text }}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: colors.bg,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#dc3545', marginBottom: '20px' }}>{error}</div>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: colors.buttonBg,
            color: colors.buttonText,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          뒤로가기
        </button>
      </div>
    );
  }

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
          color: colors.headerText
        }}>
          {userInfo?.nickname || '사용자'}의 프로필
        </h1>
        <div style={{ width: '80px' }}></div> {/* 균형을 위한 빈 공간 */}
      </div>

      {/* 프로필 내용 */}
      <div style={{
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* 프로필 사진 및 기본 정보 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '32px',
          padding: '20px',
          background: darkMode ? '#2d2d2d' : '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: darkMode ? '#222' : '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: darkMode ? '#ffe066' : '#1976d2',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {userInfo?.photoURL ? (
              <img 
                src={userInfo.photoURL} 
                alt="프로필" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: '50%' 
                }} 
              />
            ) : (
              userInfo?.nickname?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              color: colors.text
            }}>
              {userInfo?.nickname || '사용자'}
            </h2>
            
            {userInfo?.statusMessage && (
              <div style={{
                fontSize: '14px',
                color: colors.text,
                opacity: 0.8,
                marginBottom: '8px'
              }}>
                "{userInfo.statusMessage}"
              </div>
            )}
            
            <div style={{
              fontSize: '12px',
              color: colors.text,
              opacity: 0.6
            }}>
              가입일: {userInfo?.createdAt ? new Date(userInfo.createdAt.toDate()).toLocaleDateString() : '알 수 없음'}
            </div>
          </div>
        </div>

        {/* 자기소개 */}
        {userInfo?.bio && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              color: colors.text
            }}>
              자기소개
            </h3>
            <div style={{
              padding: '16px',
              background: darkMode ? '#2d2d2d' : '#f8f9fa',
              borderRadius: '8px',
              color: colors.text,
              lineHeight: '1.6'
            }}>
              {userInfo.bio}
            </div>
          </div>
        )}

        {/* 활동 정보 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            color: colors.text
          }}>
            활동 정보
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              background: colors.scoreBg,
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.scoreText,
                marginBottom: '4px'
              }}>
                {userInfo?.activityScore || 0}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.text,
                opacity: 0.7
              }}>
                활동 점수
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              background: colors.scoreBg,
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: colors.text,
                marginBottom: '4px'
              }}>
                {userInfo?.lastSeen ? new Date(userInfo.lastSeen.toDate()).toLocaleString() : '알 수 없음'}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.text,
                opacity: 0.7
              }}>
                마지막 활동
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile; 