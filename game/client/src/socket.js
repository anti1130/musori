import { io } from "socket.io-client";
const socket = io("https://musori.onrender.com/");

// 연결 상태 확인을 위한 로그
socket.on('connect', () => {
  console.log('서버에 연결되었습니다!', socket.id);
});

socket.on('disconnect', () => {
  console.log('서버와 연결이 끊어졌습니다.');
});

socket.on('connect_error', (error) => {
  console.error('연결 에러:', error);
});

export default socket;
