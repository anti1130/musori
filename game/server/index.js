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

io.on('connection', (socket) => {
  console.log('새 클라이언트 접속:', socket.id);

  // 채팅 메시지 수신 및 전체 클라이언트로 전송
  socket.on('chat message', (msg) => {
    console.log('메시지 수신:', msg); // 로그 추가
    io.emit('chat message', msg);
  });

  // 입장 알림 메시지 처리
  socket.on('notice', (msg) => {
    console.log('입장 알림:', msg);
    io.emit('notice', msg);
  });

  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('온라인 게임 서버 실행 중!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
}); 
