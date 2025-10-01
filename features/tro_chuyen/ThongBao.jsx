import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebase";

export default function ThongBao({ setSelectedChat, scrollToEnd }) {
  const [notifications, setNotifications] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscriptions = [];

    const chatsRef = collection(db, "chats");
    const unsubChats = onSnapshot(chatsRef, (snap) => {
      snap.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;
        const messagesRef = collection(db, "chats", chatId, "messages");
        const qMsg = query(messagesRef, orderBy("createdAt", "desc"));
        const unsubMsg = onSnapshot(qMsg, (snapMsg) => {
          snapMsg.docChanges().forEach((change) => {
            if (change.type === "added") {
              const msg = change.doc.data();

              // Chỉ thông báo tin nhắn mới của người khác gửi và chưa đọc
              const isUnread = !(msg.readBy?.includes(auth.currentUser.uid));
              const isFromOther = msg.fromUid !== auth.currentUser.uid;
              const isForMe = msg.users?.includes(auth.currentUser.uid) || !msg.private; 

              if (isUnread && isFromOther && isForMe) {
                addNotification(`${msg.from}: ${msg.text}`, chatId);
              }
            }
          });
        });
        unsubscriptions.push(unsubMsg);
      });
    });
    unsubscriptions.push(unsubChats);

    return () => unsubscriptions.forEach((unsub) => unsub());
  }, []);

  const addNotification = (text, chatId = null) => {
    const id = `${Date.now()}_${Math.random()}`;
    setNotifications((prev) => [{ id, text, chatId }, ...prev]);

    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const handlePressNotification = (chatId) => {
    if (chatId) {
      setSelectedChat(chatId);

      // Scroll đến cuối tin nhắn nếu có hàm scrollToEnd từ TroChuyen
      if (scrollToEnd) scrollToEnd();
    }
  };

  return (
    <View style={{ position: "absolute", top: 50, right: 10, width: 250, maxHeight: 400 }}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              onPress={() => handlePressNotification(item.chatId)}
              style={{
                backgroundColor: "#1e293b",
                padding: 10,
                marginVertical: 4,
                borderRadius: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
              }}
            >
              <Text style={{ color: "white" }}>{item.text}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
  );
}
