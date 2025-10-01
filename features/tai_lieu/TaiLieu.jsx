import * as ImagePicker from "expo-image-picker";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { db } from "../../firebase";
import NenLogo from "./NenLogo";

export default function TaiLieu() {
  const [docsList, setDocsList] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false); // quản lý menu ...

  // 🔹 Lắng nghe Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "docs"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setDocsList(data);
      },
      (err) => console.error("Lỗi load tài liệu:", err)
    );
    return () => unsubscribe();
  }, []);

  // 🔹 Pick ảnh
  const pickImage = async () => {
    // Yêu cầu quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập ảnh để chọn hình!");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // chuẩn mới
        quality: 0.5,
        allowsEditing: false,
        selectionLimit: 1,
      });

      // Kiểm tra cả 2 khả năng trả về: assets hay uri trực tiếp
      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          setImage(result.assets[0].uri);
        } else if (result.uri) {
          setImage(result.uri);
        }
      }
    } catch (err) {
      console.error("Lỗi chọn ảnh:", err);
      Alert.alert("Lỗi", "Không thể chọn ảnh!");
    }
  };

  // 🔹 Lưu hoặc update
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề!");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, "docs", editingId), {
          title,
          content,
          image,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "docs"), {
          title,
          content,
          image,
          createdAt: serverTimestamp(),
          order: docsList.length,
        });
      }
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("Lỗi lưu tài liệu:", err);
      Alert.alert("Lỗi", "Không thể lưu tài liệu!");
    }
  };

  // 🔹 Xóa
  const handleDelete = async (id) => {
    Alert.alert("Xác nhận", "Bạn có muốn xóa?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "docs", id));
            if (editingId === id) resetForm();
            if (selectedDoc?.id === id) setSelectedDoc(null);
          } catch (err) {
            console.error("Lỗi xóa tài liệu:", err);
            Alert.alert("Lỗi", "Không thể xóa tài liệu!");
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImage("");
    setEditingId(null);
    setMenuVisible(false);
  };

  // 🔹 Render item
  const renderItem = ({ item, drag, isActive }) => (
    <TouchableOpacity
      style={[styles.docItem, isActive && { backgroundColor: "#f0f0f0" }]}
      onLongPress={drag}
      onPress={() => setSelectedDoc(item)}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  // 🔹 Nếu đang xem chi tiết hoặc form
  if (selectedDoc || showAddForm) {
    return (
      <View style={styles.viewerContainer}>
        <NenLogo />

        {/* Header cố định */}
        {selectedDoc && (
          <View style={styles.fixedHeader}>
            <TouchableOpacity onPress={() => setMenuVisible((prev) => !prev)}>
              <Text style={styles.moreBtn}>+</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedDoc(null)}>
              <Text style={styles.closeBtn}>X</Text>
            </TouchableOpacity>

            {menuVisible && (
              <View style={styles.menuDropdown}>
                <Button
                  title="✏️ Sửa"
                  onPress={() => {
                    setEditingId(selectedDoc.id);
                    setTitle(selectedDoc.title);
                    setContent(selectedDoc.content);
                    setImage(selectedDoc.image || "");
                    setShowAddForm(true);
                    setSelectedDoc(null);
                    setMenuVisible(false);
                  }}
                />
                <Button
                  title="🗑️ Xóa"
                  color="red"
                  onPress={() => {
                    handleDelete(selectedDoc.id);
                    setMenuVisible(false);
                  }}
                />
              </View>
            )}
          </View>
        )}

        <ScrollView contentContainerStyle={styles.viewerContent}>
          {/* Form thêm/sửa */}
          {showAddForm && (
            <View style={[styles.addForm, { backgroundColor: "#fff" }]}>
              <TextInput
                placeholder="Tiêu đề"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <TextInput
                placeholder="Nội dung"
                value={content}
                onChangeText={setContent}
                style={[styles.input, { height: 200 }]}
                multiline
              />
              {image && <Image source={{ uri: image }} style={styles.image} />}
              <Button title="Chọn ảnh" onPress={pickImage} />
              {image && (
                <Button title="Xóa ảnh" color="orange" onPress={() => setImage("")} />
              )}
              <Button
                title={editingId ? "Lưu chỉnh sửa" : "Thêm mới"}
                onPress={handleSave}
              />
              <Button
                title="⬅️ Đóng"
                onPress={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              />
            </View>
          )}

          {/* Viewer chi tiết */}
          {selectedDoc && (
            <>
              {selectedDoc.image && (
                <Image source={{ uri: selectedDoc.image }} style={styles.viewerImage} />
              )}
              <Text style={styles.viewerTitle}>{selectedDoc.title}</Text>
              <Text style={styles.viewerText}>{selectedDoc.content}</Text>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // 🔹 Danh sách
  return (
    <View style={styles.container}>
      <NenLogo />
      <DraggableFlatList
        data={docsList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={async ({ data }) => {
          setDocsList(data);
          try {
            await Promise.all(
              data.map((item, i) => updateDoc(doc(db, "docs", item.id), { order: i }))
            );
          } catch (err) {
            console.error("Lỗi cập nhật thứ tự:", err);
          }
        }}
        contentContainerStyle={{ padding: 16, backgroundColor: "#fff", flexGrow: 1 }}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.header}>📄 Tài liệu</Text>
            <TouchableOpacity onPress={() => setShowAddForm(true)}>
              <Text style={styles.addButton}>＋</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  header: { fontSize: 20, fontWeight: "bold" },
  addButton: { fontSize: 28, fontWeight: "bold", color: "#007bff" },
  addForm: {
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  image: { width: "100%", height: 150, marginBottom: 8, borderRadius: 6 },

  // Item danh sách
  docItem: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: 60,
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  title: { fontSize: 18, fontWeight: "bold", flexShrink: 1 },

  // Viewer
  viewerContainer: { flex: 1, backgroundColor: "#fff" },
  viewerContent: { padding: 16, paddingBottom: 150, paddingTop: 70 }, // paddingTop để tránh che header
  viewerImage: { width: "100%", height: 200, marginBottom: 12, borderRadius: 6 },
  viewerTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  viewerText: { fontSize: 16, color: "#333", lineHeight: 22 },
  actions: { marginTop: 20, gap: 10 },

  // Header cố định
  fixedHeader: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  moreBtn: { fontSize: 24 },
  closeBtn: { fontSize: 18, fontWeight: "bold" },

  // Menu dropdown
  menuDropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 4,
    zIndex: 20,
  },
});
