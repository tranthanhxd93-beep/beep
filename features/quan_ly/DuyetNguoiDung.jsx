import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
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

export default function DuyetNguoiDung() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        // sort: đưa pending lên đầu
        data.sort((a, b) => {
          if (a.role === "pending" && b.role !== "pending") return -1;
          if (a.role !== "pending" && b.role === "pending") return 1;
          return 0;
        });
        setUsers(data || []);
      } catch (err) {
        console.error(err);
        Alert.alert("Lỗi", "Không thể tải danh sách người dùng.");
      }
    };
    fetchUsers();
  }, []);

  const approveUser = async (uid) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: "approved" });
      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, role: "approved" } : u))
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể cập nhật quyền.");
    }
  };

  const rejectUser = async (uid) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn từ chối người dùng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "users", uid), { role: "rejected" });
            setUsers((prev) =>
              prev.map((u) => (u.id === uid ? { ...u, role: "rejected" } : u))
            );
          } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể cập nhật quyền.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    if (!item) return null;
    return (
      <View style={styles.userItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.email}>
            {item.email || item.phoneNumber || "Không có thông tin"}
          </Text>
          <Text style={styles.role}>Quyền: {item.role}</Text>
        </View>
        {item.role === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.approve]}
              onPress={() => approveUser(item.id)}
            >
              <Text style={styles.btnText}>✔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.reject]}
              onPress={() => rejectUser(item.id)}
            >
              <Text style={styles.btnText}>✖</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Quản lý người dùng</Text>
      {users.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Không có người dùng nào
        </Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) =>
            item?.id ? String(item.id) : String(index)
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f0f0f0" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  email: { fontSize: 16, fontWeight: "500" },
  role: { fontSize: 12, color: "#666" },
  actions: { flexDirection: "row", marginLeft: 8 },
  btn: { padding: 8, borderRadius: 4, marginLeft: 4 },
  approve: { backgroundColor: "green" },
  reject: { backgroundColor: "red" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
