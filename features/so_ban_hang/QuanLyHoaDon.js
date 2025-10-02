import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../firebase";

export default function QuanLyHoaDon({ user }) {
  const [hoaDonList, setHoaDonList] = useState([]);
  const [khachHangInputs, setKhachHangInputs] = useState({});
  const [expandedIds, setExpandedIds] = useState({});
  const [khachHangMap, setKhachHangMap] = useState({});

  // Lấy hóa đơn
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "hoaDon", user.uid, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHoaDonList(data);
    });
    return () => unsub();
  }, [user]);

  // Lấy danh sách khách hàng
  useEffect(() => {
    if (!user) return;
    const q = collection(db, "soBanHang", user.uid, "khachHang");
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const obj = {};
      data.forEach(kh => obj[kh.id] = kh);
      setKhachHangMap(obj);
    });
    return () => unsub();
  }, [user]);

  const formatVNDShort = (num) => {
    if (!num) return "0";
    if (num >= 1_000_000) {
      const trieu = Math.floor(num / 1_000_000);
      const ngan = Math.floor((num % 1_000_000) / 1000);
      return ngan > 0 ? `${trieu}tr${ngan}` : `${trieu}tr`;
    }
    if (num >= 1000) return `${Math.floor(num / 1000)}k`;
    return num.toString();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const toggleExpand = (hdId) => {
    setExpandedIds(prev => ({ ...prev, [hdId]: !prev[hdId] }));
  };

  const handleSaveKhachHang = async (hdId) => {
    const info = khachHangInputs[hdId];
    if (!info?.ten || !info?.soDienThoai) {
      return Alert.alert("Lỗi", "Vui lòng nhập tên và số điện thoại khách hàng");
    }

    try {
      const docRef = await addDoc(collection(db, "soBanHang", user.uid, "khachHang"), info);
      await updateDoc(doc(db, "hoaDon", user.uid, "orders", hdId), {
        khachHangId: docRef.id,
        khachHangInfo: info
      });
      Alert.alert("✅ Thành công", "Đã lưu thông tin khách hàng");
      setKhachHangInputs(prev => ({ ...prev, [hdId]: { ten: "", soDienThoai: "", diaChi: "" } }));
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không lưu được khách hàng");
    }
  };

  const handleDeleteHoaDon = (hdId) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa hóa đơn này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "hoaDon", user.uid, "orders", hdId));
              Alert.alert("✅ Đã xóa", "Hóa đơn đã được xóa thành công");
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể xóa hóa đơn");
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item: hd }) => {
    const khInput = khachHangInputs[hd.id] || { ten: "", soDienThoai: "", diaChi: "" };
    const khSaved = hd.khachHangId ? khachHangMap[hd.khachHangId] : hd.khachHangInfo;
    const isExpanded = expandedIds[hd.id];

    return (
      <TouchableOpacity key={hd.id} style={styles.card} onPress={() => toggleExpand(hd.id)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.dateText}>{formatDate(hd.createdAt)}</Text>
          {isExpanded && (
            <TouchableOpacity onPress={() => handleDeleteHoaDon(hd.id)} style={styles.deleteButton}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>X</Text>
            </TouchableOpacity>
          )}
        </View>

        {isExpanded && (
          <View style={{ marginTop: 8 }}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell]}>STT</Text>
              <Text style={[styles.cell, styles.headerCell]}>Loại</Text>
              <Text style={[styles.cell, styles.headerCell]}>Đơn vị</Text>
              <Text style={[styles.cellRight, styles.headerCell]}>Giá</Text>
              <Text style={[styles.cell, styles.headerCell]}>SL</Text>
              <Text style={[styles.cellRight, styles.headerCell]}>Tổng</Text>
            </View>

            {hd.items?.map((i, idx) => (
              <View key={i.id} style={styles.row}>
                <Text style={styles.cell}>{idx + 1}</Text>
                <Text style={styles.cell}>{i.loai}</Text>
                <Text style={styles.cell}>{i.donVi}</Text>
                <Text style={styles.cellRight}>{formatVNDShort(i.giaBan)}</Text>
                <Text style={styles.cell}>{i.soLuong}</Text>
                <Text style={styles.cellRight}>{formatVNDShort(i.thanhTien)}</Text>
              </View>
            ))}

            <Text style={styles.totalText}>Tổng: {formatVNDShort(hd.total)} VND</Text>

            {khSaved ? (
              <View style={{ marginTop: 10, padding: 6, backgroundColor: "#fff", borderRadius: 6 }}>
                <Text style={{ fontWeight: "bold" }}>Khách hàng: {khSaved.ten}</Text>
                <Text>SĐT: {khSaved.soDienThoai}</Text>
                {khSaved.diaChi ? <Text>Địa chỉ: {khSaved.diaChi}</Text> : null}

                <View style={{ flexDirection: "column", alignItems: "center", marginTop: 12 }}>
                  <Image source={require("../../assets/logo.png")} style={{ width: 90, height: 90, marginBottom: 6 }} />
                  <Text style={{ fontWeight: "bold", fontSize: 14, textAlign: "center" }}>
                    Trân trọng cảm ơn quý khách đã ủng hộ!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: "#ccc", paddingTop: 8 }}>
                <View style={{ flexDirection: "row", marginBottom: 4 }}>
                  <TextInput
                    placeholder="Tên khách"
                    placeholderTextColor="#888"
                    style={[styles.input, { flex: 1, marginRight: 6 }]}
                    value={khInput.ten}
                    onChangeText={(text) => setKhachHangInputs(prev => ({ ...prev, [hd.id]: { ...khInput, ten: text } }))}
                  />
                  <TextInput
                    placeholder="Số điện thoại"
                    placeholderTextColor="#888"
                    style={[styles.input, { flex: 1 }]}
                    value={khInput.soDienThoai}
                    onChangeText={(text) => setKhachHangInputs(prev => ({ ...prev, [hd.id]: { ...khInput, soDienThoai: text } }))}
                  />
                </View>
                <TextInput
                  placeholder="Địa chỉ"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={khInput.diaChi}
                  onChangeText={(text) => setKhachHangInputs(prev => ({ ...prev, [hd.id]: { ...khInput, diaChi: text } }))}
                />
                <TouchableOpacity style={styles.saveButton} onPress={() => handleSaveKhachHang(hd.id)}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>💾 Lưu khách hàng</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={hoaDonList}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={true}
    />
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderWidth: 1, borderColor: "#999", borderRadius: 8, marginBottom: 12, backgroundColor: "#f9f9f9" },
  dateText: { fontSize: 16, fontWeight: "bold" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 4 },
  headerRow: { backgroundColor: "#eee" },
  headerCell: { fontWeight: "bold" },
  cell: { 
    flex: 1, 
    textAlign: "center",
    borderRightWidth: 1, 
    borderRightColor: "#ccc",
    paddingVertical: 2
  },
  cellRight: { 
    flex: 1, 
    textAlign: "right", 
    borderRightWidth: 1, 
    borderRightColor: "#ccc",
    paddingVertical: 2,
    paddingRight: 8
  },
  totalText: { fontWeight: "bold", textAlign: "right", marginTop: 6 },
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 6, 
    padding: 6, 
    marginVertical: 4,
    backgroundColor: "#fff",
    color: "#000"
  },
  saveButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 6, alignItems: "center", marginTop: 6 },
  deleteButton: { 
    backgroundColor: "#ff3b30", 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
});
