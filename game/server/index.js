const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// JWT 시크릿 키 (실제 서비스에서는 환경변수 사용)
const JWT_SECRET = 'your-secret-key';

// 메모리에 사용자 데이터 저장
const users = new Map(); // email -> userData
const onlineUsers = new Map(); // socket.id -> nickname

// 모든 클라이언트에게 유저 리스트 전송
const broadcastUserList = () => {
  const userList = Array.from(onlineUsers.values());
  console.log('현재 온라인 유저:', userList);
  io.emit('user list', userList);
};

// 회원가입 API
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // 입력 검증
    if (!email || !password || !nickname) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    if (users.has(email)) {
      return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 정보 저장
    users.set(email, {
      email,
      password: hashedPassword,
      nickname
    });

    // JWT 토큰 생성
    const token = jwt.sign({ email, nickname }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      success: true, 
      token, 
      user: { email, nickname } 
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // 사용자 확인
    const user = users.get(email);
    if (!user) {
      return res.status(400).json({ error: '존재하지 않는 이메일입니다.' });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign({ email, nickname: user.nickname }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      success: true, 
      token, 
      user: { email, nickname: user.nickname } 
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '토큰이 필요합니다.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

// 사용자 정보 조회 API (보호된 라우트)
app.get('/api/user', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

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
    console.log('입장 알림 수신:', msg);
    console.log('현재 소켓 ID:', socket.id);
    
    // 닉네임 추출 (예: "홍길동님이 입장하셨습니다." -> "홍길동")
    const nickname = msg.replace('님이 입장하셨습니다.', '');
    console.log('추출된 닉네임:', nickname);
    
    onlineUsers.set(socket.id, nickname);
    console.log('온라인 유저에 추가됨:', nickname);
    console.log('현재 온라인 유저 목록:', Array.from(onlineUsers.values()));
    
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
