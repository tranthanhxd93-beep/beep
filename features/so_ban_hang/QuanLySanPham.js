// features/so_ban_hang/QuanLySanPham.jsx
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList, KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { db } from "../../firebase";

const LOAI_SAN_PHAM = [
  { label: "Bố", value: "Bố" },
  { label: "Mẹ", value: "Mẹ" },
  { label: "Baby Cặp", value: "Baby Cặp" },
  { label: "Baby Cái", value: "Baby Cái" },
  { label: "Baby Đực", value: "Baby Đực" },
  { label: "Hậu Bị Đực", value: "Hậu Bị Đực" },
  { label: "Hậu Bị Cái", value: "Hậu Bị Cái" },
];

export default function QuanLySanPham({ user }) {
  const [dsSanPham, setDsSanPham] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [open, setOpen] = useState(false);
  const [loai, setLoai] = useState(LOAI_SAN_PHAM[0].value);
  const [items, setItems] = useState(LOAI_SAN_PHAM);

  const [donVi, setDonVi] = useState("");
  const [giaBan, setGiaBan] = useState("");
  const [expandedLoai, setExpandedLoai] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [menuVisibleId, setMenuVisibleId] = useState(null);
  const [menuTimer, setMenuTimer] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "soBanHang", user.uid, "sanPham"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDsSanPham(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!loai || !donVi || !giaBan) {
      alert("Vui lòng nhập đủ thông tin sản phẩm!");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "soBanHang", user.uid, "sanPham", editingId),
          { loai, donVi, giaBan: parseFloat(giaBan) }
        );
        alert("Đã cập nhật sản phẩm!");
      } else {
        await addDoc(collection(db, "soBanHang", user.uid, "sanPham"), {
          loai,
          donVi,
          giaBan: parseFloat(giaBan),
          createdAt: serverTimestamp(),
        });
        alert("Đã thêm sản phẩm!");
      }

      setLoai(LOAI_SAN_PHAM[0].value);
      setDonVi("");
      setGiaBan("");
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error("Lỗi khi lưu sản phẩm:", err);
      alert("Có lỗi khi lưu sản phẩm. Xem console.");
    }
  };

  const handleEdit = (sp) => {
    setLoai(sp.loai);
    setDonVi(sp.donVi);
    setGiaBan(sp.giaBan.toString());
    setEditingId(sp.id);
    setShowForm(true);
    setMenuVisibleId(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "soBanHang", user.uid, "sanPham", id));
      alert("Đã xóa sản phẩm!");
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      alert("Có lỗi khi xóa sản phẩm. Xem console.");
    }
    setMenuVisibleId(null);
  };

  const toggleExpand = (loaiItem) => {
    setExpandedLoai(expandedLoai === loaiItem ? null : loaiItem);
  };

  const toggleMenu = (id) => {
    if (menuVisibleId === id) {
      setMenuVisibleId(null);
      if (menuTimer) clearTimeout(menuTimer);
    } else {
      setMenuVisibleId(id);
      if (menuTimer) clearTimeout(menuTimer);
      const timer = setTimeout(() => setMenuVisibleId(null), 3000);
      setMenuTimer(timer);
    }
  };

  const renderGroup = ({ item }) => {
    const listLoai = dsSanPham.filter((sp) => sp.loai === item.value);
    const isExpanded = expandedLoai === item.value;

    return (
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleExpand(item.value)}
        >
          <Text style={styles.groupTitle}>{item.value}</Text>
          <Text style={styles.arrow}>{isExpanded ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {isExpanded &&
          (listLoai.length > 0 ? (
            listLoai.map((sp) => (
              <View key={sp.id} style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {sp.donVi} - {sp.giaBan?.toLocaleString?.() ?? sp.giaBan} đ
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => toggleMenu(sp.id)}>
                    <Text style={styles.menuButton}>⋮</Text>
                  </TouchableOpacity>
                  {menuVisibleId === sp.id && (
                    <View style={styles.menuContainer}>
                      <TouchableOpacity onPress={() => handleEdit(sp)}>
                        <Text style={styles.menuItem}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(sp.id)}>
                        <Text style={styles.menuItem}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Chưa có sản phẩm</Text>
          ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text style={styles.title}>📦 Danh mục sản phẩm</Text>

        {!showForm && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.addButtonText}>   Thêm sản phẩm</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingId ? "✏️ Sửa sản phẩm" : "        Thêm sản phẩm"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                <Text style={styles.closeButton}>❌</Text>
              </TouchableOpacity>
            </View>

            <DropDownPicker
              open={open}
              value={loai}
              items={items}
              setOpen={setOpen}
              setValue={setLoai}
              setItems={setItems}
              placeholder="Chọn loại sản phẩm"
              style={styles.dropdown}
              dropDownContainerStyle={{
                borderColor: "#ccc",
                maxHeight: 400, // đủ cao để hiện hết 7 loại
              }}
              listMode="SCROLLVIEW"
            />

            <TextInput
              style={styles.input}
              placeholder="Đơn vị (kg, con, cặp...)"
              placeholderTextColor="#999"
              value={donVi}
              onChangeText={setDonVi}
            />
            <TextInput
              style={styles.input}
              placeholder="Giá bán"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={giaBan}
              onChangeText={setGiaBan}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingId ? "💾 Cập nhật" : "💾 Lưu sản phẩm"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={items}
          renderItem={renderGroup}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#000" },
  group: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 6,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  groupTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  arrow: { fontSize: 16, color: "#666" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 12,
    marginVertical: 4,
  },
  itemText: { fontSize: 16, color: "#000" },
  actions: { position: "relative" },
  menuButton: { fontSize: 20, paddingHorizontal: 8, color: "#333" },
  menuContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 0,
    right: 60,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    zIndex: 2000,
  },
  menuItem: { marginHorizontal: 13, fontSize: 13 },
  empty: { fontSize: 14, color: "#999", marginLeft: 12, marginBottom: 4 },
  addButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  form: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    zIndex: 1000,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  formTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  closeButton: { fontSize: 18, color: "red" },
  dropdown: { borderColor: "#ccc", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: "#000",
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
