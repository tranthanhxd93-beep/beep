// features/xac_thuc/QuanLyNguoiDung.jsx
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList, Modal, Pressable,
  StyleSheet,
  Text, TouchableOpacity, View
} from "react-native";
import { db } from "../../firebase";

export default function QuanLyNguoiDung() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null); // role lấy từ Firestore
  const [menuVisible, setMenuVisible] = useState(null); // uid menu đang mở

  const auth = getAuth();

  const normalizeRoleKey = (r) => {
    const s = (r || "pending").toString().toLowerCase();
    if (s === "super admin" || s === "super_admin" || s === "superadmin") return "Super Admin";
    if (s === "manager") return "manager";
    if (s === "user") return "user";
    if (s === "pending") return "pending";
    return r;
  };

  const fetchCurrentUserRole = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const r = snap.data().role;
        setCurrentRole(r ? r : "user");
      } else {
        setCurrentRole("user");
      }
    } catch (err) {
      console.error("Lỗi khi lấy role user:", err);
      setCurrentRole("user");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Chuẩn hóa role và sắp xếp: Super Admin → Manager → User → Pending
      const order = { "Super Admin": 0, manager: 1, user: 2, pending: 3 };
      data.sort((a, b) => {
        const ra = normalizeRoleKey(a.role);
        const rb = normalizeRoleKey(b.role);
        return (order[ra] ?? 99) - (order[rb] ?? 99);
      });

      setUsers(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải danh sách người dùng!");
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) fetchCurrentUserRole(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (id, role) => {
    try {
      await updateDoc(doc(db, "users", id), { role });
      setMenuVisible(null);
      fetchUsers();
      Alert.alert("✅ Thành công", `Cập nhật quyền thành ${role}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể cập nhật quyền!");
    }
  };

  if (!currentUser) return <Text>Đang tải...</Text>;

  const isSuperAdmin = (currentRole || "").toString().toLowerCase() === "super admin";
  const isManager = (currentRole || "").toString().toLowerCase() === "manager";

  const renderItem = ({ item }) => {
    const isCurrentUserItem = item.id === currentUser.uid;
    const itemRole = item.role ? item.role : "pending"; 
    const itemRoleKey = normalizeRoleKey(itemRole);

    const canApprove = (itemRole === "pending") && (isSuperAdmin || isManager) && !isCurrentUserItem;
    const canShowMenu = (itemRole !== "pending") && !isCurrentUserItem &&
                        ((isSuperAdmin) || (isManager && itemRoleKey === "user"));

    const isTargetSuperAdmin = itemRoleKey === "Super Admin";

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cell}>{item.email}</Text>
          <Text style={styles.cell}>{item.phone || "-"}</Text>
          {itemRole === "pending" && <Text style={{ color: "orange" }}>⏳ Chờ duyệt</Text>}
          {item.blocked && <Text style={{ color: "red" }}>🚫 Bị chặn</Text>}
        </View>

        <View style={{ width: 110, alignItems: "flex-end" }}>
          <Text style={styles.cell}>{itemRole}</Text>

          {canApprove ? (
            <Pressable
              style={[styles.button, { backgroundColor: "green", alignSelf: "flex-end" }]}
              onPress={() => updateRole(item.id, "user")}
            >
              <Text style={styles.buttonText}>✅ Duyệt</Text>
            </Pressable>
          ) : canShowMenu && !isTargetSuperAdmin ? (
            <TouchableOpacity onPress={() => setMenuVisible(item.id)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>⋮</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: "#00796b", fontWeight: "bold", marginTop: 6 }}>
              {itemRoleKey}
            </Text>
          )}
        </View>

        <Modal
          transparent
          visible={menuVisible === item.id}
          animationType="fade"
          onRequestClose={() => setMenuVisible(null)}
        >
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(null)} />
          <View style={styles.menuContainer}>
            <View style={styles.menu}>
              <Pressable
                style={styles.menuItem}
                onPress={() => updateRole(item.id, "user")}
              >
                <Text style={styles.menuText}>👤 Thành viên (user)</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => updateRole(item.id, "manager")}
              >
                <Text style={styles.menuText}>⭐ Quản lý (manager)</Text>
              </Pressable>

              {isSuperAdmin && !isTargetSuperAdmin && (
                <Pressable
                  style={styles.menuItem}
                  onPress={async () => {
                    try {
                      const blocked = !item.blocked; // toggle trạng thái
                      await updateDoc(doc(db, "users", item.id), { blocked });
                      setMenuVisible(null);
                      fetchUsers();
                      Alert.alert(
                        "✅ Thành công",
                        `Người dùng đã ${blocked ? "bị chặn" : "bỏ chặn"}`
                      );
                    } catch (err) {
                      console.error(err);
                      Alert.alert("Lỗi", "Không thể cập nhật trạng thái chặn!");
                    }
                  }}
                >
                  <Text style={[styles.menuText, { color: item.blocked ? "#00796b" : "red" }]}>
                    {item.blocked ? "🔓 Bỏ chặn" : "🚫 Chặn tài khoản"}
                  </Text>
                </Pressable>
              )}

              <Pressable style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setMenuVisible(null)}>
                <Text style={[styles.menuText, { textAlign: "center", color: "#555" }]}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Quản lý người dùng</Text>
      <Button title="🔄 Tải lại" onPress={fetchUsers} disabled={loading} />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  row: { borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  cell: { fontSize: 14, marginBottom: 4 },
  actions: { flexDirection: "row", marginTop: 8, flexWrap: "wrap" },
  button: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginRight: 8, marginTop: 4 },
  buttonText: { color: "white", fontWeight: "bold" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  menuContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  menu: { width: 260, backgroundColor: "#fff", borderRadius: 8, elevation: 6, paddingVertical: 6, overflow: "hidden" },
  menuItem: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  menuText: { fontSize: 16 },
});
