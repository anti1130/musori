import React from 'react';

function ThemeSettings({ customThemeColor, onColorChange, onSave, onCancel, darkMode }) {
  const colors = {
    bg: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    border: darkMode ? '#444' : '#ddd',
    buttonBg: darkMode ? '#444' : '#007bff',
    buttonText: darkMode ? '#ffffff' : '#ffffff'
  };

  const themeColors = [
    { name: '파란색', value: '#007bff', label: '기본' },
    { name: '초록색', value: '#28a745', label: '' },
    { name: '보라색', value: '#6f42c1', label: '' },
    { name: '주황색', value: '#fd7e14', label: '' },
    { name: '분홍색', value: '#e83e8c', label: '' }
  ];

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
            테마 설정
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
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            color: colors.text
          }}>
            색상 선택
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {themeColors.map((color) => (
              <div
                key={color.value}
                onClick={() => onColorChange(color.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `2px solid ${customThemeColor === color.value ? color.value : colors.border}`,
                  background: customThemeColor === color.value ? `${color.value}20` : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: color.value,
                  border: `2px solid ${colors.bg}`,
                  boxShadow: `0 0 0 2px ${customThemeColor === color.value ? color.value : 'transparent'}`
                }} />
                <div style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: colors.text,
                    fontWeight: customThemeColor === color.value ? 'bold' : 'normal'
                  }}>
                    {color.name}
                  </span>
                  {color.label && (
                    <span style={{
                      fontSize: '12px',
                      color: customThemeColor === color.value ? color.value : colors.text,
                      opacity: 0.7
                    }}>
                      {color.label}
                    </span>
                  )}
                </div>
                {customThemeColor === color.value && (
                  <span style={{
                    color: color.value,
                    fontSize: '16px'
                  }}>
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
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
              background: customThemeColor,
              color: '#ffffff',
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

export default ThemeSettings; 