import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = 250;

export default function ThanhBen({
  isOpen,
  onClose,
  onNavigate,
  activeScreen,
  user,
  onLogout,
  isAdmin,
}) {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOpen]);

  if (!visible) return null;

  // --- Sửa logic hiển thị tên người dùng ---
  const shortName = user?.displayName
    ? user.displayName
    : user?.email
      ? user.email.split("@")[0]
      : "Người dùng";

  // Build menu dựa trên quyền
  const menuItems = [
    { key: "BangDieuKhien", label: "Bảng điều khiển", icon: "home" },
    { key: "QuanLy", label: "Quản lý", icon: "albums" },
  ];

  if (isAdmin) {
    menuItems.push(
      { key: "TaiLieuKhach", label: "Tài liệu (Khách)", icon: "book" },
      { key: "TaiLieuAdmin", label: "Tài liệu (Admin)", icon: "document-text" }
    );
  } else {
    menuItems.push(
      { key: "TaiLieuKhach", label: "Tài liệu", icon: "book" }
    );
  }

  // Các menu còn lại giữ nguyên + thêm mục Sổ bán hàng
  menuItems.push(
    { key: "ThietKe", label: "Thiết kế", icon: "construct" },
    { key: "TroChuyen", label: "Trò chuyện", icon: "chatbubbles" },
    { key: "SoBanHang", label: "Sổ bán hàng", icon: "cart" }, // 👈 Thêm mục mới
    { key: "NguoiDung", label: "Người dùng", icon: "people" }
  );

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>

        <ScrollView contentContainerStyle={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                activeScreen === item.key && styles.activeItem,
              ]}
              onPress={() => {
                onNavigate(item.key);
                onClose();
              }}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={activeScreen === item.key ? "#00796b" : "#333"}
              />
              <Text
                style={[
                  styles.menuText,
                  activeScreen === item.key && styles.activeText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.username}>{shortName}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    elevation: 10,
    zIndex: 1001,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  menuContainer: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  activeItem: {
    backgroundColor: "#e0f2f1",
    borderRadius: 6,
  },
  activeText: {
    color: "#00796b",
    fontWeight: "bold",
  },
  footer: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 16,
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#444",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
  },
});
