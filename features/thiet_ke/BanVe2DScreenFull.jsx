// features/management/BanVe2DScreenFull.jsx
import { useNavigation, useRoute } from "@react-navigation/native";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert, Button, Dimensions, Modal, ScrollView,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import Svg from "react-native-svg";
import { db } from "../../firebase";
import MoHinhChung2D from "./MoHinhChung2D";
import MoHinhTietKiem2D from "./MoHinhTietKiem2D";

export default function BanVe2DScreenFull() {
  const route = useRoute();
  const navigation = useNavigation();
  const { design } = route.params || {};
  
  const [type, setType] = useState("chung");

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const svgWidth = screenWidth * 0.95;
  const svgHeight = screenHeight * 0.7;

  // === Modal sửa ===
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(design?.name || "");
  const [editTotalLength, setEditTotalLength] = useState(design?.totalLength?.toString() || "");
  const [editTotalWidth, setEditTotalWidth] = useState(design?.totalWidth?.toString() || "");
  const [editLaneVertical, setEditLaneVertical] = useState(design?.laneVertical?.toString() || ""); 
  const [editLaneHorizontal, setEditLaneHorizontal] = useState(design?.laneHorizontal?.toString() || "0"); 

  // 🔹 Mảng loại chuồng chi tiết
  const [selectedTypes, setSelectedTypes] = useState(
    design?.types?.map(t => ({
      ...t,
      type: t.type.toLowerCase(),
      rowType: t.rowType.toLowerCase(),
      key: `${t.type.toLowerCase()}-${t.rowType.toLowerCase()}`
    })) || []
  ); 
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);

  // 🔹 Thứ tự các cột
  const [selectedOrder, setSelectedOrder] = useState(
    design?.types?.map(t => `${t.type.toLowerCase()}-${t.rowType.toLowerCase()}`) || []
  );

  const area = editTotalLength && editTotalWidth
    ? parseFloat(editTotalLength) * parseFloat(editTotalWidth)
    : null;

  // === Xóa thiết kế ===
  const handleDelete = () => {
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn xóa thiết kế "${design.name}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "thiet_ke", design.id));
              Alert.alert("Đã xóa", "Thiết kế đã bị xóa!");
              navigation.goBack();
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể xóa thiết kế!");
            }
          },
        },
      ]
    );
  };

  // === Mở modal sửa ===
  const handleEdit = () => {
    setEditName(design?.name || "");
    setEditTotalLength(design?.totalLength?.toString() || "");
    setEditTotalWidth(design?.totalWidth?.toString() || "");
    setEditLaneVertical(design?.laneVertical?.toString() || "");
    setEditLaneHorizontal(design?.laneHorizontal?.toString() || "0");
    setSelectedTypes(
      design?.types?.map(t => ({
        ...t,
        type: t.type.toLowerCase(),
        rowType: t.rowType.toLowerCase(),
        key: `${t.type.toLowerCase()}-${t.rowType.toLowerCase()}`
      })) || []
    );
    setSelectedOrder(design?.order || design?.types?.map(t => `${t.type.toLowerCase()}-${t.rowType.toLowerCase()}`) || []);
    setEditModalVisible(true);
  };

  // 🔹 Hàm lấy kích thước ô theo loại và dãy
  const getSizeByTypeRow = (type, rowType) => {
    switch (type) {
      case "cái":
        return rowType === "đơn"
          ? { length: 0.35, width: 0.6 }
          : { length: 0.35, width: 1.2 }; 
      case "đực":
        return rowType === "đơn"
          ? { length: 0.5, width: 0.6 }
          : { length: 0.5, width: 1.2 }; 
      case "tập thể":
        return rowType === "đơn"
          ? { length: 0.6, width: 1.2 }
          : { length: 1.2, width: 2.4 }; // ✅ cập nhật tập thể đôi
      default:
        return { length: 0, width: 0 };
    }
  };

  // 🔹 Toggle loại chuồng chi tiết
  const handleTypeToggle = (type, rowType) => {
    const key = `${type.toLowerCase()}-${rowType.toLowerCase()}`;
    const exists = selectedTypes.some(t => t.key === key);
    if (exists) {
      setSelectedTypes(selectedTypes.filter(t => t.key !== key));
      setSelectedOrder(selectedOrder.filter(k => k !== key));
    } else {
      const size = getSizeByTypeRow(type.toLowerCase(), rowType.toLowerCase());
      setSelectedTypes([...selectedTypes, { key, type: type.toLowerCase(), rowType: rowType.toLowerCase(), length: size.length, width: size.width }]);
      setSelectedOrder([...selectedOrder, key]);
    }
  };

  // 🔹 Di chuyển thứ tự
  const moveOrder = (key, direction) => {
    const index = selectedOrder.indexOf(key);
    if (index < 0) return;
    let newOrder = [...selectedOrder];
    if (direction === "up" && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === "down" && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setSelectedOrder(newOrder);
  };

  // === Lưu sửa ===
  const saveEdit = async () => {
    if (!editName.trim() || selectedTypes.length === 0) {
      Alert.alert("Thông báo", "Vui lòng nhập đủ tên và chọn ít nhất 1 loại chuồng!");
      return;
    }

    try {
      await updateDoc(doc(db, "thiet_ke", design.id), {
        name: editName,
        totalLength: parseFloat(editTotalLength) || 0,
        totalWidth: parseFloat(editTotalWidth) || 0,
        laneVertical: parseFloat(editLaneVertical) || 0,
        laneHorizontal: parseFloat(editLaneHorizontal) || 0,
        types: selectedTypes,
        order: selectedOrder,
      });
      Alert.alert("Thành công", "Thiết kế đã được cập nhật!");
      setEditModalVisible(false);

      // Đồng bộ trực tiếp vào design
      design.name = editName;
      design.totalLength = parseFloat(editTotalLength) || 0;
      design.totalWidth = parseFloat(editTotalWidth) || 0;
      design.laneVertical = parseFloat(editLaneVertical) || 0;
      design.laneHorizontal = parseFloat(editLaneHorizontal) || 0;
      design.types = selectedTypes;
      design.order = selectedOrder;
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể cập nhật thiết kế!");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Nút Sửa/Xóa cố định */}
      <View style={{ position: "absolute", top: 10, right: 10, flexDirection: "row", zIndex: 10 }}>
        <TouchableOpacity
          style={{ marginHorizontal: 5, padding: 5, backgroundColor: "#1976d2", borderRadius: 5 }}
          onPress={handleEdit}
        >
          <Text style={{ color: "#fff" }}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginHorizontal: 5, padding: 5, backgroundColor: "#d32f2f", borderRadius: 5 }}
          onPress={handleDelete}
        >
          <Text style={{ color: "#fff" }}>Xóa</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 50, backgroundColor: "#fff" }}>
        {design && (
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <Text style={{ textAlign: "center" }}>
              Thiết kế: {design.name} ({design.types ? design.types.map(t => `${t.type} (${t.rowType})`).join(", ") : design.type})
            </Text>
            {design.totalLength && design.totalWidth && (
              <Text style={{ textAlign: "center", marginTop: 4 }}>
                Diện tích: {design.totalLength * design.totalWidth} m²
              </Text>
            )}
          </View>
        )}

        {/* Chọn mô hình */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 10 }}>
          <TouchableOpacity
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginHorizontal: 5,
              backgroundColor: type === "chung" ? "#1976d2" : "#ccc"
            }}
            onPress={() => setType("chung")}
          >
            <Text style={{ color: type === "chung" ? "#fff" : "#000" }}>Mô Hình Chung</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              marginHorizontal: 5,
              backgroundColor: type === "tietkiem" ? "#1976d2" : "#ccc"
            }}
            onPress={() => setType("tietkiem")}
          >
            <Text style={{ color: type === "tietkiem" ? "#fff" : "#000" }}>Mô Hình Tiết Kiệm</Text>
          </TouchableOpacity>
        </View>

        {/* Bản vẽ 2D */}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Svg width={svgWidth} height={svgHeight}>
            {type === "chung" ? (
              <MoHinhChung2D svgWidth={svgWidth} svgHeight={svgHeight} design={design} columnOrder={design.order} />
            ) : (
              <MoHinhTietKiem2D svgWidth={svgWidth} svgHeight={svgHeight} design={design} />
            )}
          </Svg>
        </View>
      </ScrollView>

      {/* Modal sửa */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 16 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 8, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Chỉnh sửa thiết kế</Text>

            {/* TextInput các trường cơ bản */}
            {[
              { value: editName, setter: setEditName, placeholder: "Tên thiết kế" },
              { value: editTotalLength, setter: setEditTotalLength, placeholder: "Tổng chiều dài khu vực (m)", keyboard: "numeric" },
              { value: editTotalWidth, setter: setEditTotalWidth, placeholder: "Tổng chiều ngang khu vực (m)", keyboard: "numeric" },
              { value: editLaneVertical, setter: setEditLaneVertical, placeholder: "Lối đi dọc (m)", keyboard: "numeric" },
              { value: editLaneHorizontal, setter: setEditLaneHorizontal, placeholder: "Lối đi ngang (m)", keyboard: "numeric" },
            ].map((item, idx) => (
              <TextInput
                key={idx}
                placeholder={item.placeholder}
                placeholderTextColor="#888"
                value={item.value}
                onChangeText={item.setter}
                keyboardType={item.keyboard || "default"}
                style={{ borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 8, marginBottom: 10, color: "#000" }}
              />
            ))}

            {/* Dropdown Loại chuồng nhiều lựa chọn (fix cuộn) */}
            <View style={{ marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setTypeDropdownVisible(!typeDropdownVisible)}
                style={{
                  borderWidth: 1,
                  borderColor: "#000",
                  borderRadius: 6,
                  padding: 8,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ color: "#000" }}>
                  {selectedTypes.length > 0 ? selectedTypes.map(t => `${t.type} (${t.rowType})`).join(", ") : "Chọn loại chuồng"}
                </Text>
              </TouchableOpacity>

              {typeDropdownVisible && (
                <ScrollView
                  style={{
                    borderWidth: 1,
                    borderColor: "#000",
                    borderRadius: 6,
                    backgroundColor: "#fff",
                    marginTop: 5,
                    maxHeight: 150,
                  }}
                >
                  {["Cái", "Đực", "Tập thể"].map(type => (
                    ["đơn", "đôi"].map(row => {
                      const key = `${type.toLowerCase()}-${row}`;
                      const isSelected = selectedTypes.some(t => t.key === key);
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => handleTypeToggle(type, row)}
                          style={{
                            padding: 8,
                            backgroundColor: isSelected ? "#4caf50" : "#fff",
                          }}
                        >
                          <Text style={{ color: isSelected ? "#fff" : "#000" }}>
                            {type} ({row})
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Thứ tự các cột */}
            {selectedOrder.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ marginBottom: 5 }}>Thứ tự các cột:</Text>
                <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 5 }}>
                  {selectedOrder.map((key) => {
                    const t = selectedTypes.find(st => st.key === key);
                    if (!t) return null;
                    return (
                      <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <Text>{t.type} ({t.rowType})</Text>
                        <View style={{ flexDirection: "row" }}>
                          <TouchableOpacity onPress={() => moveOrder(key, "up")} style={{ marginHorizontal: 3 }}>
                            <Text>↑</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => moveOrder(key, "down")} style={{ marginHorizontal: 3 }}>
                            <Text>↓</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {area && (
              <Text style={{ textAlign: "center", marginBottom: 10 }}>Diện tích: {area} m²</Text>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <Button title="Lưu" onPress={saveEdit} />
              <Button title="Hủy" color="#f44336" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
