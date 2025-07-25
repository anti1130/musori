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

// 유저 리스트 수신 로그
socket.on('user list', (users) => {
  console.log('유저 리스트 수신:', users);
});

// notice 메시지 수신 로그
socket.on('notice', (msg) => {
  console.log('notice 메시지 수신:', msg);
});

export default socket;
