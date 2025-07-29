import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 기본 "전체" 채팅방 ID
export const DEFAULT_ROOM_ID = 'general';

// 채팅방 생성
export const createChatRoom = async (roomData) => {
  try {
    const docRef = await addDoc(collection(db, 'chatrooms'), {
      name: roomData.name,
      description: roomData.description || '',
      createdAt: new Date(),
      createdBy: roomData.createdBy,
      members: roomData.members || [],
      isPublic: roomData.isPublic !== false // 기본값은 공개
    });
    return docRef.id;
  } catch (error) {
    console.error('채팅방 생성 에러:', error);
    throw error;
  }
};

// 모든 채팅방 가져오기
export const getChatRooms = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'chatrooms'));
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return rooms;
  } catch (error) {
    console.error('채팅방 목록 가져오기 에러:', error);
    throw error;
  }
};

// 기본 "전체" 채팅방 생성 (없는 경우)
export const ensureDefaultRoom = async () => {
  try {
    const rooms = await getChatRooms();
    const defaultRoom = rooms.find(room => room.id === DEFAULT_ROOM_ID);
    
    if (!defaultRoom) {
      await setDoc(doc(db, 'chatrooms', DEFAULT_ROOM_ID), {
        name: '전체',
        description: '모든 사용자용 채팅방',
        createdAt: new Date(),
        createdBy: 'system',
        members: [],
        isPublic: true
      });
      console.log('기본 채팅방 생성됨');
    }
  } catch (error) {
    console.error('기본 채팅방 생성 에러:', error);
  }
};

// 채팅방 삭제
export const deleteChatRoom = async (roomId) => {
  try {
    await deleteDoc(doc(db, 'chatrooms', roomId));
    return true;
  } catch (error) {
    console.error('채팅방 삭제 에러:', error);
    throw error;
  }
};

// 채팅방 멤버 추가
export const addMemberToRoom = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'chatrooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (roomDoc.exists()) {
      const currentMembers = roomDoc.data().members || [];
      if (!currentMembers.includes(userId)) {
        await setDoc(roomRef, {
          ...roomDoc.data(),
          members: [...currentMembers, userId]
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('멤버 추가 에러:', error);
    throw error;
  }
};

// 채팅방 멤버 제거
export const removeMemberFromRoom = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'chatrooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (roomDoc.exists()) {
      const currentMembers = roomDoc.data().members || [];
      const updatedMembers = currentMembers.filter(id => id !== userId);
      
      await setDoc(roomRef, {
        ...roomDoc.data(),
        members: updatedMembers
      }, { merge: true });
    }
  } catch (error) {
    console.error('멤버 제거 에러:', error);
    throw error;
  }
};

// 사용자 초대
export const inviteUserToRoom = async (roomId, userEmail) => {
  try {
    // 이메일로 사용자 찾기
    const usersQuery = query(collection(db, 'users'), where('email', '==', userEmail));
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.');
    }
    
    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    
    // 채팅방에 멤버 추가
    await addMemberToRoom(roomId, userId);
    
    return {
      success: true,
      userId: userId,
      nickname: userDoc.data().nickname
    };
  } catch (error) {
    console.error('사용자 초대 에러:', error);
    throw error;
  }
};

// 채팅방 멤버 목록 가져오기
export const getRoomMembers = async (roomId) => {
  try {
    const roomDoc = await getDoc(doc(db, 'chatrooms', roomId));
    
    if (!roomDoc.exists()) {
      throw new Error('채팅방을 찾을 수 없습니다.');
    }
    
    const roomData = roomDoc.data();
    const memberIds = roomData.members || [];
    
    // 멤버 정보 가져오기
    const members = [];
    for (const memberId of memberIds) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        members.push({
          uid: memberId,
          ...userDoc.data()
        });
      }
    }
    
    return members;
  } catch (error) {
    console.error('멤버 목록 가져오기 에러:', error);
    throw error;
  }
}; 