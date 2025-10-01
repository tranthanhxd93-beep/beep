import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebase";
import { safeLog } from "../../utils/Logger";
import ThongBao from "./ThongBao"; // import ThongBao

const { width } = Dimensions.get("window");

export default function TroChuyen() {
  const [users, setUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("user");
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const translateX = useRef(new Animated.Value(width)).current;
  const flatListRef = useRef(null);

  // Lấy thông tin user hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) setCurrentUserRole(snap.data().role || "user");
    };
    fetchCurrentUser();
  }, []);

  // Lấy danh sách user (ẩn chính user)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs
        .filter((d) => d.id !== auth.currentUser.uid)
        .map((d) => {
          let name = d.data().displayName || d.data().email || "Người dùng mới";
          if (name.includes("@")) name = name.split("@")[0];
          return { id: d.id, name, online: d.data().online || false };
        });
      setUsers(list);
    });
    return unsubscribe;
  }, []);

  // Lấy danh sách phòng chat
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "chats"), (snap) => {
      const rooms = snap.docs
        .filter((d) => !d.data().private)
        .map((d) => ({ id: d.id, ...d.data() }));
      setChatRooms([{ id: "group", name: "💬 Phòng chung" }, ...rooms]);
    });
    return unsubscribe;
  }, []);

  // Lấy tin nhắn theo phòng chat
  useEffect(() => {
    if (!selectedChat) return;
    const chatRef = collection(db, "chats", selectedChat, "messages");
    const q = query(chatRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() })); 
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      // Đánh dấu đã đọc
      msgs.forEach(async (msg) => {
        if (!msg.readBy?.includes(auth.currentUser.uid)) {
          const msgRef = doc(db, "chats", selectedChat, "messages", msg.id);
          await updateDoc(msgRef, {
            readBy: [...(msg.readBy || []), auth.currentUser.uid],
          }).catch(() => {});
        }
      });
    });
    return unsubscribe;
  }, [selectedChat]);

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    const textToSend = input.trim();
    setInput("");
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().banned) {
        Alert.alert("Bạn đã bị admin cấm chat");
        return;
      }

      const chatRef = doc(collection(db, "chats", selectedChat, "messages"));
      let senderName = auth.currentUser.displayName || auth.currentUser.email || "Ẩn danh";
      if (senderName.includes("@")) senderName = senderName.split("@")[0];

      await setDoc(chatRef, {
        from: senderName,
        fromUid: auth.currentUser.uid,
        text: textToSend,
        createdAt: serverTimestamp(),
        readBy: [auth.currentUser.uid],
      });
    } catch (err) {
      safeLog("error", "Lỗi gửi tin nhắn:", err);
      Alert.alert("Lỗi", err.message);
    }
  };

  // Chỉnh sửa handleLongPress: superAdmin có quyền xóa bất kỳ tin nhắn nào trong phòng chat chung
  const handleLongPress = (msg) => {
    const canEditOrDelete = msg.fromUid === auth.currentUser.uid || currentUserRole === "superAdmin";
    if (!canEditOrDelete) return;
    Alert.alert(
      "Tùy chọn",
      "Bạn muốn làm gì?",
      [
        {
          text: "Thu hồi",
          onPress: async () =>
            await updateDoc(doc(db, "chats", selectedChat, "messages", msg.id), {
              text: "Tin nhắn đã được thu hồi",
            }),
        },
        {
          text: "Xóa",
          onPress: async () =>
            await deleteDoc(doc(db, "chats", selectedChat, "messages", msg.id)),
        },
        {
          text: "Sửa",
          onPress: async () => {
            const newText = prompt("Nhập nội dung mới:", msg.text);
            if (newText && newText.trim())
              await updateDoc(doc(db, "chats", selectedChat, "messages", msg.id), {
                text: newText.trim(),
              });
          },
        },
        { text: "Hủy", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleEmojiClick = (emoji) => {
    setInput((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  };

  const closeSidebar = () => {
    Animated.timing(translateX, { toValue: width, duration: 200, useNativeDriver: true }).start(() =>
      setSidebarOpen(false)
    );
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    const roomId = newRoomName.trim().replace(/\s+/g, "_");
    await setDoc(doc(db, "chats", roomId), {
      name: newRoomName.trim(),
      createdBy: auth.currentUser.uid,
      password: "",
    });
    setNewRoomName("");
    setModalVisible(false);
    Alert.alert("Tạo phòng thành công!");
  };

  const handleDeleteRoom = async (roomId) => {
    Alert.alert("Xác nhận", "Bạn có muốn xóa phòng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "chats", roomId));
          setSelectedChat(null);
        },
      },
    ]);
  };

  const handleSelectUser = async (user) => {
    const chatId = [auth.currentUser.uid, user.id].sort().join("_");
    const chatDoc = doc(db, "chats", chatId);
    const snap = await getDoc(chatDoc);
    if (!snap.exists()) {
      await setDoc(chatDoc, {
        name: user.name,
        private: true,
        users: [auth.currentUser.uid, user.id],
      });
    }
    setSelectedChat(chatId);
    closeSidebar();
  };

  const handleSelectRoom = (roomId) => {
    setSelectedChat(roomId);
    closeSidebar();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <TouchableOpacity style={styles.sidebarToggle} onPress={openSidebar}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>📂 Danh sách chat</Text>
      </TouchableOpacity>

      {sidebarOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSidebar} />}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
        {currentUserRole === "superAdmin" && (
          <TouchableOpacity style={styles.createRoomBtn} onPress={() => setModalVisible(true)}>
            <Text style={{ color: "white", fontWeight: "bold" }}>➕ Tạo phòng chat</Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: "white", fontWeight: "bold", marginBottom: 4 }}>👤 Người dùng</Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatButton, selectedChat?.includes(item.id) && styles.chatButtonActive]}
              onPress={() => handleSelectUser(item)}
            >
              <Text style={styles.chatText}>{item.name}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: item.online ? "#22c55e" : "#9ca3af" },
                ]}
              />
            </TouchableOpacity>
          )}
        />

        <Text style={{ color: "white", fontWeight: "bold", marginVertical: 4 }}>💬 Phòng chat</Text>
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatButton, selectedChat === item.id && styles.chatButtonActive]}
              onPress={() => handleSelectRoom(item.id)}
            >
              <Text style={styles.chatText}>{item.name}</Text>
              {currentUserRole === "superAdmin" && item.id !== "group" && (
                <TouchableOpacity onPress={() => handleDeleteRoom(item.id)}>
                  <Text style={{ color: "red" }}>🗑</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      <View style={styles.chatBox}>
        {!selectedChat ? (
          <View style={styles.emptyChat}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>👈 Chọn phòng chat hoặc người</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const timestamp = item.createdAt instanceof Timestamp ? item.createdAt.toDate() : null;
                const isRead = item.readBy?.includes(auth.currentUser.uid);
                return (
                  <TouchableOpacity
                    onLongPress={() => handleLongPress(item)}
                    style={[
                      styles.bubble,
                      item.fromUid === auth.currentUser.uid ? styles.myBubble : styles.otherBubble,
                    ]}
                  >
                    <Text style={styles.bubbleText}>{item.text}</Text>

                    {/* Hiển thị tên người gửi dưới tin nhắn trong phòng chung */}
                    {selectedChat === "group" && (
                      <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{item.from}</Text>
                    )}

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={styles.timeText}>{timestamp ? timestamp.toLocaleTimeString() : ""}</Text>
                      {isRead && <Text style={{ color: "#22c55e", fontSize: 12, marginLeft: 4 }}>✔</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              style={styles.messages}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputRow}>
              <TouchableOpacity onPress={() => setShowEmoji((prev) => !prev)}>
                <Text style={{ fontSize: 22 }}>😀</Text>
              </TouchableOpacity>
              {showEmoji && (
                <View style={styles.emojiPicker}>
                  {["😀", "😂", "😍", "😎", "👍", "💖"].map((e) => (
                    <TouchableOpacity key={e} onPress={() => handleEmojiClick(e)}>
                      <Text style={{ fontSize: 22, margin: 4 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Nhập tin nhắn..."
                style={styles.input}
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                <Text style={{ color: "#fff" }}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <ThongBao
        setSelectedChat={(chatId) => {
          setSelectedChat(chatId);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        }}
      />

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Tạo phòng chat</Text>
            <TextInput
              placeholder="Nhập tên phòng"
              value={newRoomName}
              onChangeText={setNewRoomName}
              style={styles.modalInput}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: "red" }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateRoom}>
                <Text style={{ color: "green" }}>Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sidebarToggle: { padding: 10, backgroundColor: "#f3f4f6", borderBottomWidth: 1, borderColor: "#ccc" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 15,
  },
  sidebar: { position: "absolute", top: 0, right: 0, width: width * 0.5, height: "100%", backgroundColor: "#1f2937", padding: 10, zIndex: 20 },
  createRoomBtn: { padding: 10, backgroundColor: "#2563eb", borderRadius: 6, marginBottom: 10 },
  chatButton: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderRadius: 6, marginBottom: 8, alignItems: "center" },
  chatButtonActive: { backgroundColor: "#374151" },
  chatText: { color: "white" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  chatBox: { flex: 1, backgroundColor: "#f3f4f6", padding: 8 },
  emptyChat: { flex: 1, justifyContent: "center", alignItems: "center" },
  messages: { flex: 1, paddingBottom: 10 },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 12, marginVertical: 4 },
  myBubble: { backgroundColor: "#3b82f6", alignSelf: "flex-end" },
  otherBubble: { backgroundColor: "#e5e7eb", alignSelf: "flex-start" },
  bubbleText: { color: "#000" },
  timeText: { fontSize: 10, color: "#555", marginTop: 2, alignSelf: "flex-end" },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 6, borderTopWidth: 1, borderColor: "#d1d5db", backgroundColor: "white", gap: 6 },
  input: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, paddingHorizontal: 8 },
  sendBtn: { backgroundColor: "#3b82f6", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  emojiPicker: { position: "absolute", bottom: 50, right: 10, zIndex: 10, flexDirection: "row" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: "white", padding: 20, borderRadius: 8, width: "80%" },
  modalInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8 },
});
