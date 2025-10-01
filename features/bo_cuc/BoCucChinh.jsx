// File: features/bo_cuc/BoCucChinh.jsx
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { auth } from "../../firebase";
// Màn hình
import BangDieuKhien from "../quan_ly/BangDieuKhien";
import QuanLyNongTrai from "../quan_ly/QuanLyNongTrai_P1";
import QuanLyNguoiDung from "../quan_ly_nguoi_dung/QuanLyNguoiDung";
// 👉 Thêm mới: Màn hình Sổ Bán Hàng
import SoBanHang from "../so_ban_hang/SoBanHang";
import ManHinhTaiLieu from "../tai_lieu/ManHinhTaiLieu";
import TaiLieu from "../tai_lieu/TaiLieu";
import ThietKe from "../thiet_ke/ThietKe";
import TroChuyen from "../tro_chuyen/TroChuyen";
// Layout
import MenuChinh from "./MenuChinh";
import ThanhBen from "./ThanhBen";



export default function BoCucChinh({ user, navigation }) {
  const [activeScreen, setActiveScreen] = useState("BangDieuKhien");
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (!user) navigation.replace("DangNhap");
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace("DangNhap");
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
  };

  const renderContent = () => {
    let ScreenComponent;
    switch (activeScreen) {
      case "BangDieuKhien":
        ScreenComponent = <BangDieuKhien user={user} />;
        break;
      case "QuanLy":
        ScreenComponent = <QuanLyNongTrai user={user} />;
        break;
      case "ThietKe":
        ScreenComponent = <ThietKe user={user} />;
        break;
      case "TaiLieuKhach":
        ScreenComponent = <TaiLieu user={user} />;
        break;
      case "TaiLieuLogo":
        ScreenComponent = <ManHinhTaiLieu user={user} />;
        break;
      case "TroChuyen":
        ScreenComponent = <TroChuyen user={user} />;
        break;
      case "NguoiDung":
        ScreenComponent = <QuanLyNguoiDung user={user} />;
        break;
      // 👉 Thêm case cho Sổ Bán Hàng
      case "SoBanHang":
        ScreenComponent = <SoBanHang user={user} />;
        break;
      default:
        ScreenComponent = <BangDieuKhien user={user} />;
        break;
    }
    return ScreenComponent;
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <MenuChinh
        user={user}
        title="Quản Lý Trại Dúi"
        onPressMenu={() => setSidebarVisible(true)}
        onLogout={handleLogout}
      />

      <ThanhBen
        isOpen={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={setActiveScreen}
        activeScreen={activeScreen}
        user={user}
        onLogout={handleLogout}
        isAdmin={user?.role === "admin"}
      />

      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
