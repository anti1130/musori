import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase';

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'musori-image');
  const res = await fetch('https://api.cloudinary.com/v1_1/dokzgwvob/image/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  return data.secure_url;
}

function Register({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 기본 유효성 검사
    if (!email || !password || !confirmPassword || !nickname) {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('올바른 이메일 형식을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // Firebase 회원가입
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      let photoURL = '';
      if (photo) {
        photoURL = await uploadToCloudinary(photo);
      }
      await updateProfile(user, {
        displayName: nickname,
        photoURL: photoURL || undefined,
      });
      
      console.log('Firebase 회원가입 성공:', user);
      
      // 회원가입 성공 시 사용자 정보 전달
      const userData = {
        email: user.email,
        nickname: nickname,
        uid: user.uid
      };
      
      onRegister(userData);
    } catch (error) {
      console.error('Firebase 회원가입 에러:', error);
      
      // Firebase 에러 메시지 한글화
      let errorMessage = '회원가입에 실패했습니다.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 존재하는 이메일입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식을 입력해주세요.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '100px auto', 
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>회원가입</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '90%',
              maxWidth: '1000px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="이메일을 입력하세요"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{
              width: '90%',
              maxWidth: '1000px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="닉네임을 입력하세요"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '90%',
              maxWidth: '1000px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="비밀번호를 입력하세요 (6자 이상)"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '90%',
              maxWidth: '1000px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="비밀번호를 다시 입력하세요"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '90%',
            maxWidth: '1000px',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? '회원가입 중...' : '회원가입'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#666' }}>이미 계정이 있으신가요? </span>
        <button
          onClick={onSwitchToLogin}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: loading ? 'not-allowed' : 'pointer',
            textDecoration: 'underline'
          }}
        >
          로그인
        </button>
      </div>
    </div>
  );
}

export default Register; 