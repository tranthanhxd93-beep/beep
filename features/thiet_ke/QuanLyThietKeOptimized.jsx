// features/thiet_ke/QuanLyThietKeOptimized.jsx
import { useNavigation } from "@react-navigation/native";
import {
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../firebase";

export default function QuanLyThietKeOptimized() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    const q = query(collection(db, "thiet_ke"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDesigns(data);
        setLoading(false);
      },
      (err) => {
        console.error("Lỗi load thiết kế:", err);
        Alert.alert("Lỗi", "Không thể tải danh sách thiết kế!");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateDesignName = async (design) => {
    Alert.prompt(
      "Chỉnh sửa tên",
      "Nhập tên mới",
      async (text) => {
        if (!text) return;
        try {
          await updateDoc(doc(db, "thiet_ke", design.id), { name: text });
          Alert.alert("Thành công", "Đã cập nhật tên");
        } catch (err) {
          console.error(err);
          Alert.alert("Lỗi", "Không thể cập nhật tên thiết kế!");
        }
      },
      "plain-text",
      design.name
    );
  };

  const deleteDesign = async (design) => {
    Alert.alert("Xác nhận", `Bạn có chắc muốn xóa thiết kế "${design.name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "thiet_ke", design.id));
          } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể xóa thiết kế!");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>📏 Tổng dài: {item.totalLength} m</Text>
      <Text>Ô: {item.length}m × {item.width}m | Chuồng/dãy: {item.cols}</Text>
      <Text>Loại: {item.type} | Lối đi: {item.lane ?? 0.5}m</Text>

      <View style={{ flexDirection: "row", marginTop: 8, flexWrap: "wrap" }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4caf50" }]}
          onPress={() => navigation.navigate("BanVe2DScreenFull", { design: item })}
        >
          <Text style={styles.buttonText}>📐 Xem 2D</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#2196f3" }]}
          onPress={() => updateDesignName(item)}
        >
          <Text style={styles.buttonText}>✏️ Sửa tên</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#f44336" }]}
          onPress={() => deleteDesign(item)}
        >
          <Text style={styles.buttonText}>🗑️ Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={designs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: { padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 12, backgroundColor: "#fff" },
  name: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  button: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8, marginTop: 6 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
