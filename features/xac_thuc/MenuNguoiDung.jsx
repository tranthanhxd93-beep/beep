// features/xac_thuc/MenuNguoiDung.jsx
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebase";

export default function MenuNguoiDung() {
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Lắng nghe user hiện tại
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Lấy tên rút gọn (ví dụ: Tran Thanh Xd -> Tran)
  const getShortName = () => {
    if (!user) return "Người dùng";
    if (user.displayName) return user.displayName.split(" ")[0];
    if (user.email) return user.email.split("@")[0];
    return "Người dùng";
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setMenuVisible(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Nút hiển thị tên rút gọn */}
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.button}>
        <Text style={styles.buttonText}>{getShortName()}</Text>
      </TouchableOpacity>

      {/* Modal menu */}
      <Modal
        animationType="fade"
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        {/* Lớp phủ (bấm ra ngoài đóng menu) */}
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)} />

        <View style={styles.menu}>
          <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
            <Text style={styles.menuText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 40,
    right: 16,
    zIndex: 100,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menu: {
    position: "absolute",
    top: 70,
    right: 16,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    elevation: 5,
    minWidth: 140,
  },
  menuItem: {
    paddingVertical: 8,
  },
  menuText: {
    fontSize: 16,
  },
});
