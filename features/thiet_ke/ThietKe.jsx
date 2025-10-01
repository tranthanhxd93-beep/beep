// features/management/thietke.jsx
import { useNavigation } from "@react-navigation/native";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../firebase";

export default function ThietKe() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 State cho form
  const [name, setName] = useState("");
  const [totalLength, setTotalLength] = useState("");
  const [totalWidth, setTotalWidth] = useState("");
  const [laneVertical, setLaneVertical] = useState("");
  const [laneHorizontal, setLaneHorizontal] = useState("");

  const [selectedTypes, setSelectedTypes] = useState([]); // mảng các loại chuồng đã chọn
  const [showForm, setShowForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // dropdown loại chuồng

  const navigation = useNavigation();

  useEffect(() => {
    const q = query(collection(db, "thiet_ke"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
          ? { length: 0.6, width: 1.2 }   // giữ nguyên tập thể đơn
          : { length: 1.2, width: 2.4 };  // cập nhật tập thể đôi
      default:
        return { length: 0, width: 0 };
    }
  };

  // 🔹 Thêm hoặc xóa loại chuồng trong mảng selectedTypes
  const handleTypeToggle = (type, rowType) => {
    const key = `${type}-${rowType}`;
    const exists = selectedTypes.some(t => t.key === key);
    if (exists) {
      setSelectedTypes(selectedTypes.filter(t => t.key !== key));
    } else {
      const size = getSizeByTypeRow(type, rowType);
      setSelectedTypes([...selectedTypes, { key, type, rowType, length: size.length, width: size.width }]);
    }
  };

  // 🔹 Tạo thiết kế mới
  const createDesign = async () => {
    if (!name || !totalLength || !totalWidth || !laneVertical || !laneHorizontal || selectedTypes.length === 0) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin và chọn ít nhất một loại chuồng!");
      return;
    }
    try {
      await addDoc(collection(db, "thiet_ke"), {
        name,
        totalLength: parseFloat(totalLength),
        totalWidth: parseFloat(totalWidth),
        laneVertical: parseFloat(laneVertical),
        laneHorizontal: parseFloat(laneHorizontal),
        types: selectedTypes,
        createdAt: serverTimestamp(),
      });
      Alert.alert("Thành công", "Thiết kế mới đã được tạo!");
      setName(""); setTotalLength(""); setTotalWidth(""); setLaneVertical(""); setLaneHorizontal("");
      setSelectedTypes([]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tạo thiết kế!");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>
        Khu vực: {item.totalLength}m x {item.totalWidth}m (= {item.totalLength * item.totalWidth} m²)
      </Text>
      <Text>Lối đi dọc: {item.laneVertical}m, ngang: {item.laneHorizontal}m</Text>
      <Text>
        Loại:
        {item.types
          ? item.types.map(t => `${t.type} (${t.rowType}) ${t.length}x${t.width}m`).join(", ")
          : ""}
      </Text>
      <View style={{ flexDirection: "row", marginTop: 5 }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4caf50" }]}
          onPress={() => navigation.navigate("BanVe2DScreenFull", { design: item })}
        >
          <Text style={styles.buttonText}>📐 Xem 2D</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <Text style={styles.header}>📋 Quản lý thiết kế</Text>
      {!showForm && <Button title="➕ Tạo thiết kế mới" onPress={() => setShowForm(true)} />}
      {showForm && (
        <View style={styles.form}>
          <TextInput placeholder="Tên thiết kế" value={name} onChangeText={setName} style={styles.input} placeholderTextColor="#000" />
          <TextInput placeholder="Tổng chiều dài khu vực (m)" value={totalLength} onChangeText={setTotalLength} keyboardType="numeric" style={styles.input} placeholderTextColor="#000" />
          <TextInput placeholder="Tổng chiều ngang khu vực (m)" value={totalWidth} onChangeText={setTotalWidth} keyboardType="numeric" style={styles.input} placeholderTextColor="#000" />
          <TextInput placeholder="Lối đi dọc (m)" value={laneVertical} onChangeText={setLaneVertical} keyboardType="numeric" style={styles.input} placeholderTextColor="#000" />
          <TextInput placeholder="Lối đi ngang (m)" value={laneHorizontal} onChangeText={setLaneHorizontal} keyboardType="numeric" style={styles.input} placeholderTextColor="#000" />

          {/* Dropdown chọn loại chuồng (kèm đơn/đôi) */}
          <View style={{ marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => setShowDropdown(!showDropdown)}
              style={{
                borderWidth: 1,
                borderColor: "#000",
                borderRadius: 6,
                padding: 8,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ color: "#000" }}>
                {selectedTypes.length > 0
                  ? selectedTypes.map(t => `${t.type} (${t.rowType})`).join(", ")
                  : "Chọn loại chuồng"}
              </Text>
            </TouchableOpacity>

            {showDropdown && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#000",
                  borderRadius: 6,
                  backgroundColor: "#fff",
                  marginTop: 5,
                }}
              >
                {["Cái", "Đực", "Tập thể"].map(type => (
                  ["đơn", "đôi"].map(row => (
                    <TouchableOpacity
                      key={`${type}-${row}`}
                      onPress={() => handleTypeToggle(type.toLowerCase(), row)}
                      style={{
                        padding: 8,
                        backgroundColor: selectedTypes.some(t => t.key === `${type.toLowerCase()}-${row}`) ? "#4caf50" : "#fff",
                      }}
                    >
                      <Text>{type} ({row})</Text>
                    </TouchableOpacity>
                  ))
                ))}
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Button title="💾 Lưu thiết kế" onPress={createDesign} />
            <Button title="❌ Hủy" color="#f44336" onPress={() => setShowForm(false)} />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={designs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        !loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Chưa có thiết kế nào.</Text>
        ) : null
      }
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  form: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  itemContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
