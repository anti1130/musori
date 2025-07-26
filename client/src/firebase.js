import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Console에서 받은 설정 정보를 여기에 입력하세요
const firebaseConfig = {
  apiKey: "AIzaSyBsW6O8w9EPDFqYwsUhEMFkkzohTcUwONU",
  authDomain: "musiru-chat.firebaseapp.com",
  projectId: "musiru-chat",
  storageBucket: "musiru-chat.firebasestorage.app",
  messagingSenderId: "418899248005",
  appId: "1:418899248005:web:1fedf445e7405298af3aec"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 및 Firestore 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 