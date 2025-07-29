import React from 'react';

function NotificationSettings({ notificationSettings, onSettingChange, onSave, onCancel, darkMode }) {
  const colors = {
    bg: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    border: darkMode ? '#444' : '#ddd',
    buttonBg: darkMode ? '#444' : '#007bff',
    buttonText: darkMode ? '#ffffff' : '#ffffff',
    toggleBg: darkMode ? '#333' : '#f5f5f5',
    toggleActive: '#28a745'
  };

  const notificationTypes = [
    {
      key: 'messageNotifications',
      title: '메시지 알림',
      description: '새 메시지 수신 시 알림을 받습니다',
      default: true
    },
    {
      key: 'mentionNotifications',
      title: '멘션 알림',
      description: '@사용자명 언급 시 알림을 받습니다',
      default: true
    },
    {
      key: 'summaryNotifications',
      title: '활동 요약 알림',
      description: '일일 활동 요약을 받습니다',
      default: false
    }
  ];

  const ToggleSwitch = ({ isOn, onChange }) => (
    <div
      onClick={onChange}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: isOn ? colors.toggleActive : colors.toggleBg,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#ffffff',
        position: 'absolute',
        top: '2px',
        left: isOn ? '22px' : '2px',
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  );

  return (
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
            알림 설정
          </h2>
          <button
            onClick={onCancel}
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

        <div style={{ marginBottom: '24px' }}>
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: `1px solid ${colors.border}`,
                cursor: 'pointer'
              }}
              onClick={() => onSettingChange(type.key, !notificationSettings[type.key])}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: colors.text,
                  marginBottom: '4px'
                }}>
                  {type.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: colors.text,
                  opacity: 0.7
                }}>
                  {type.description}
                </div>
              </div>
              <ToggleSwitch
                isOn={notificationSettings[type.key]}
                onChange={() => onSettingChange(type.key, !notificationSettings[type.key])}
              />
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            취소
          </button>
          <button
            onClick={onSave}
            style={{
              padding: '8px 16px',
              background: colors.buttonBg,
              color: colors.buttonText,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings; 