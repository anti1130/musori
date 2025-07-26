const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// 온라인 유저 리스트 관리
const onlineUsers = new Map(); // socket.id -> nickname

// 모든 클라이언트에게 유저 리스트 전송
const broadcastUserList = () => {
  const userList = Array.from(onlineUsers.values());
  console.log('현재 온라인 유저:', userList);
  io.emit('user list', userList);
};

io.on('connection', (socket) => {
  console.log('새 클라이언트 접속:', socket.id);

  // 새 클라이언트 접속 시 현재 온라인 유저 리스트 전송
  const currentUserList = Array.from(onlineUsers.values());
  socket.emit('user list', currentUserList);

  // 채팅 메시지 수신 및 전체 클라이언트로 전송
  socket.on('chat message', (msg) => {
    console.log('메시지 수신:', msg);
    io.emit('chat message', msg);
  });

  // 입장 알림 메시지 처리
  socket.on('notice', (msg) => {
    console.log('입장 알림:', msg);
    
    // 닉네임 추출 (예: "홍길동님이 입장하셨습니다." -> "홍길동")
    const nickname = msg.replace('님이 입장하셨습니다.', '');
    onlineUsers.set(socket.id, nickname);
    
    // 입장 메시지 브로드캐스트
    io.emit('notice', msg);
    
    // 업데이트된 유저 리스트 브로드캐스트
    broadcastUserList();
  });

  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제:', socket.id);
    
    // 유저 리스트에서 제거
    const nickname = onlineUsers.get(socket.id);
    if (nickname) {
      onlineUsers.delete(socket.id);
      io.emit('notice', `${nickname}님이 퇴장하셨습니다.`);
      broadcastUserList();
    }
  });
});

app.get('/', (req, res) => {
  res.send('온라인 게임 서버 실행 중!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
}); 
