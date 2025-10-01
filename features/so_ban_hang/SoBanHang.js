// features/so_ban_hang/SoBanHang.jsx
import React, { useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import GhiBanHang from "./GhiBanHang";
// Import 2 màn hình con
import QuanLySanPham from "./QuanLySanPham";


export default function SoBanHang({ user }) {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "quanLy", title: "Quản lý sản phẩm" },
    { key: "banHang", title: "Sổ bán hàng" },
  ]);

  const renderScene = SceneMap({
    quanLy: () => <QuanLySanPham user={user} />,
    banHang: () => <GhiBanHang user={user} />,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get("window").width }}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: "#28a745" }}
          style={{ backgroundColor: "#fff" }}
          activeColor="#28a745"
          inactiveColor="#888"
          labelStyle={{ fontWeight: "bold" }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
