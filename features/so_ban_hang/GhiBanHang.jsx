import { useNavigation } from "@react-navigation/native"; // <- thêm để điều hướng
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
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

function formatVNDShort(num) {
  if (!num) return "0";
  if (num >= 1_000_000) {
    const trieu = Math.floor(num / 1_000_000);
    const ngan = Math.floor((num % 1_000_000) / 1000);
    return ngan > 0 ? `${trieu}tr${ngan}` : `${trieu}tr`;
  }
  if (num >= 1000) {
    return `${Math.floor(num / 1000)}k`;
  }
  return num.toString();
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : timestamp; // hỗ trợ Date trực tiếp
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export default function GhiSoBanHang({ user }) {
  const [dsSanPham, setDsSanPham] = useState([]);
  const [expandedLoai, setExpandedLoai] = useState(null);
  const [cart, setCart] = useState({});
  const [draftOrders, setDraftOrders] = useState([]);
  const navigation = useNavigation(); // <- khởi tạo navigation

  useEffect(() => {
    if (!user) return;
    const q = collection(db, "soBanHang", user.uid, "sanPham");
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setDsSanPham(data);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, "soBanHang", user.uid, "draftOrders");
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), expanded: false }));
      setDraftOrders(data);
    });
    return () => unsub();
  }, [user]);

  const toggleExpand = (loaiItem) => {
    setExpandedLoai(expandedLoai === loaiItem ? null : loaiItem);
  };

  const increaseQuantity = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };
  const decreaseQuantity = (id) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) - 1;
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const handleTempCalc = async () => {
    const itemsInCart = dsSanPham.filter(sp => cart[sp.id]);
    if (!itemsInCart.length) return Alert.alert("Thông báo", "Chưa chọn sản phẩm!");

    let total = 0;
    const draftItems = itemsInCart.map(sp => {
      const qty = cart[sp.id];
      const subtotal = qty * sp.giaBan;
      total += subtotal;
      return {
        id: sp.id,
        loai: sp.loai,
        donVi: sp.donVi,
        giaBan: sp.giaBan,
        soLuong: qty,
        thanhTien: subtotal
      };
    });

    try {
      await addDoc(collection(db, "soBanHang", user.uid, "draftOrders"), {
        items: draftItems,
        total,
        createdAt: serverTimestamp() // giữ nguyên draft dùng serverTimestamp
      });
      setCart({});
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không lưu được draft tạm tính");
    }
  };

  const toggleDraftExpand = (id) => {
    setDraftOrders(prev => prev.map(o => o.id === id ? { ...o, expanded: !o.expanded } : o));
  };

  const handleEditDraft = (draft) => {
    const newCart = {};
    draft.items.forEach(sp => newCart[sp.id] = sp.soLuong);
    setCart(newCart);
  };

  const handleDeleteDraft = async (draft) => {
    try {
      await deleteDoc(doc(db, "soBanHang", user.uid, "draftOrders", draft.id));
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không xóa được draft tạm tính");
    }
  };

  // --- CHỈNH SỬA CHỐT ĐƠN ---
  const handleChotDonFinal = async (draft) => {
    if (!user) return;

    try {
      // Thêm hóa đơn với Date() để hiển thị ngay
      await addDoc(collection(db, "hoaDon", user.uid, "orders"), {
        items: draft.items,
        total: draft.total,
        createdAt: new Date(),
      });

      // Xóa draft sau khi chốt
      await deleteDoc(doc(db, "soBanHang", user.uid, "draftOrders", draft.id));

      setCart({});
      Alert.alert("✅ Thành công", "Đã chốt hóa đơn thành công!");
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không chốt được hóa đơn");
    }
  };
  // -----------------------------

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>🛒 Bán Hàng</Text>

      {LOAI_SAN_PHAM.map(loaiItem => {
        const listLoai = dsSanPham.filter(sp => sp.loai === loaiItem.value);
        if (!listLoai.length) return null;
        const isExpanded = expandedLoai === loaiItem.value;

        return (
          <View key={loaiItem.value} style={styles.group}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => toggleExpand(loaiItem.value)}>
              <Text style={styles.groupTitle}>{loaiItem.value}</Text>
              <Text style={styles.arrow}>{isExpanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {isExpanded && listLoai.map(sp => (
              <View key={sp.id} style={styles.itemRow}>
                <Text style={styles.itemText}>{sp.donVi} - {formatVNDShort(sp.giaBan)}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => increaseQuantity(sp.id)} style={styles.qtyButton}><Text style={styles.plusButtonText}>➕</Text></TouchableOpacity>
                  <Text style={styles.qtyText}>{cart[sp.id] || 0}</Text>
                  <TouchableOpacity onPress={() => decreaseQuantity(sp.id)} style={styles.qtyButton}><Text style={styles.minusButtonText}>➖</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        );
      })}

      <TouchableOpacity style={styles.chotDonButton} onPress={handleTempCalc}>
        <Text style={styles.chotDonText}>✅ Tạm Tính</Text>
      </TouchableOpacity>

      {draftOrders.map(draft => (
        <View key={draft.id} style={styles.draftCard}>
          <TouchableOpacity onPress={() => toggleDraftExpand(draft.id)}>
            <Text style={styles.dateText}>{formatDate(draft.createdAt)}</Text>
          </TouchableOpacity>

          {draft.expanded && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.detailHeaderCell}>STT</Text>
                <Text style={styles.detailHeaderCell}>Loại</Text>
                <Text style={styles.detailHeaderCell}>Đơn vị</Text>
                <Text style={styles.detailHeaderCell}>Giá</Text>
                <Text style={styles.detailHeaderCell}>SL</Text>
                <Text style={styles.detailHeaderCell}>Tổng</Text>
              </View>

              {draft.items.map((i, idx) => (
                <View key={i.id} style={styles.detailRow}>
                  <Text style={styles.detailCellCenter}>{idx + 1}</Text>
                  <Text style={styles.detailCellCenter}>{i.loai}</Text>
                  <Text style={styles.detailCellCenter}>{i.donVi}</Text>
                  <Text style={styles.detailCellRight}>{formatVNDShort(i.giaBan)}</Text>
                  <Text style={styles.detailCellCenter}>{i.soLuong}</Text>
                  <Text style={styles.detailCellRight}>{formatVNDShort(i.thanhTien)}</Text>
                </View>
              ))}

              <Text style={styles.draftText}>
                Tổng {draft.items.reduce((acc, i) => acc + i.soLuong, 0)} sản phẩm - {formatVNDShort(draft.total)} VND
              </Text>

              <View style={styles.detailActionsRow}>
                <TouchableOpacity onPress={() => handleEditDraft(draft)} style={styles.detailButton}><Text style={styles.detailButtonText}>✏️ Sửa</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteDraft(draft)} style={styles.detailButton}><Text style={styles.detailButtonText}>🗑️ Xóa</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleChotDonFinal(draft)} style={styles.detailButton}><Text style={styles.detailButtonText}>✅ Chốt</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#000" },
  group: { marginBottom: 12, borderBottomWidth: 1, borderColor: "#eee", paddingBottom: 6 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  groupTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  arrow: { fontSize: 16, color: "#666" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginLeft: 12, marginVertical: 4 },
  itemText: { fontSize: 15, color: "#000" },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyButton: { backgroundColor: "#28a745", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginHorizontal: 2 },
  plusButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  minusButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  qtyText: { fontSize: 15, marginHorizontal: 6 },
  chotDonButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 20 },
  chotDonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  draftCard: { padding: 12, borderWidth: 1, borderColor: "#999", borderRadius: 8, marginTop: 12, backgroundColor: "#f9f9f9" },
  dateText: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  draftText: { fontSize: 14, fontWeight: "bold", marginTop: 8, textAlign: "center" },

  detailHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#555", backgroundColor: "#eee", paddingVertical: 4 },
  detailHeaderCell: { flex: 1, fontWeight: "bold", fontSize: 13, textAlign: "center", borderRightWidth: 1, borderColor: "#555" },

  detailRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#555", paddingVertical: 4 },
  detailCellCenter: { flex: 1, fontSize: 12, color: "#000", textAlign: "center", borderRightWidth: 1, borderColor: "#999" },
  detailCellRight: { flex: 1, fontSize: 12, color: "#000", textAlign: "right", borderRightWidth: 1, borderColor: "#999" },

  detailActionsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10, paddingVertical: 4, borderTopWidth: 1, borderColor: "#555" },
  detailButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#007bff", borderRadius: 6 },
  detailButtonText: { color: "#fff", fontWeight: "bold" },
});
