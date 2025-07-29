import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_ROOM_ID } from './chatroomUtils';

// 기존 메시지들을 "전체" 채팅방으로 마이그레이션
export const migrateMessagesToDefaultRoom = async () => {
  try {
    console.log('메시지 마이그레이션 시작...');
    
    // 모든 메시지 가져오기
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    let migratedCount = 0;
    
    for (const messageDoc of messagesSnapshot.docs) {
      const messageData = messageDoc.data();
      
      // roomId가 없는 메시지만 마이그레이션
      if (!messageData.roomId) {
        await updateDoc(doc(db, 'messages', messageDoc.id), {
          roomId: DEFAULT_ROOM_ID
        });
        migratedCount++;
      }
    }
    
    console.log(`${migratedCount}개의 메시지가 "전체" 채팅방으로 마이그레이션되었습니다.`);
    return migratedCount;
  } catch (error) {
    console.error('메시지 마이그레이션 에러:', error);
    throw error;
  }
};

// 마이그레이션 상태 확인
export const checkMigrationStatus = async () => {
  try {
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    let totalMessages = 0;
    let migratedMessages = 0;
    
    messagesSnapshot.forEach((doc) => {
      totalMessages++;
      if (doc.data().roomId) {
        migratedMessages++;
      }
    });
    
    return {
      total: totalMessages,
      migrated: migratedMessages,
      pending: totalMessages - migratedMessages
    };
  } catch (error) {
    console.error('마이그레이션 상태 확인 에러:', error);
    throw error;
  }
}; 