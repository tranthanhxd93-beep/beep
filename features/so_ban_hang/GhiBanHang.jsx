// features/so_ban_hang/GhiSoBanHang.jsx
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

export default function GhiSoBanHang({ user }) {
  const [dsSanPham, setDsSanPham] = useState([]);
  const [expandedLoai, setExpandedLoai] = useState(null);
  const [cart, setCart] = useState({});
  const [draftOrders, setDraftOrders] = useState([]);

  // Lấy sản phẩm
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

  // Lấy draft tạm từ Firestore
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
      const docRef = await addDoc(collection(db, "soBanHang", user.uid, "draftOrders"), {
        items: draftItems,
        total,
        createdAt: serverTimestamp()
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

  const handleChotDonFinal = async (draft) => {
    try {
      // Lưu vào hóa đơn
      await addDoc(collection(db, "soBanHang", user.uid, "hoaDon"), {
        items: draft.items,
        total: draft.total,
        createdAt: serverTimestamp()
      });
      // Xóa draft
      await deleteDoc(doc(db, "soBanHang", user.uid, "draftOrders", draft.id));
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không lưu được hóa đơn");
    }
  };

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
                <Text style={styles.itemText}>{sp.donVi} - {sp.giaBan?.toLocaleString()} đ</Text>
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

      {/* Draft Orders */}
      {draftOrders.map(draft => (
        <View key={draft.id} style={styles.draftCard}>
          <TouchableOpacity onPress={() => toggleDraftExpand(draft.id)}>
            <Text style={styles.draftText}>Tổng {draft.items.reduce((acc, i) => acc + i.soLuong, 0)} sản phẩm - {draft.total.toLocaleString()} đ</Text>
          </TouchableOpacity>

          {draft.expanded && (
            <View style={{ marginTop: 8 }}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.detailHeaderCell}>#</Text>
                <Text style={styles.detailHeaderCell}>Loại</Text>
                <Text style={styles.detailHeaderCell}>Đơn vị</Text>
                <Text style={styles.detailHeaderCell}>Giá</Text>
                <Text style={styles.detailHeaderCell}>SL</Text>
                <Text style={styles.detailHeaderCell}>Thành tiền</Text>
              </View>

              {draft.items.map((i, idx) => (
                <View key={i.id} style={styles.detailRow}>
                  <Text style={styles.detailCell}>{idx + 1}</Text>
                  <Text style={styles.detailCell}>{i.loai}</Text>
                  <Text style={styles.detailCell}>{i.donVi}</Text>
                  <Text style={styles.detailCell}>{i.giaBan.toLocaleString()}</Text>
                  <Text style={styles.detailCell}>{i.soLuong}</Text>
                  <Text style={styles.detailCell}>{i.thanhTien.toLocaleString()}</Text>
                </View>
              ))}

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
  itemText: { fontSize: 16, color: "#000" },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyButton: { backgroundColor: "#28a745", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginHorizontal: 2 },
  plusButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  minusButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  qtyText: { fontSize: 16, marginHorizontal: 6 },
  chotDonButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 20 },
  chotDonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  draftCard: { padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginTop: 12, backgroundColor: "#f9f9f9" },
  draftText: { fontSize: 16, fontWeight: "bold" },
  detailHeaderRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#999", paddingVertical: 4 },
  detailHeaderCell: { flex: 1, fontWeight: "bold", fontSize: 13, textAlign: "center" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderColor: "#ccc" },
  detailCell: { flex: 1, fontSize: 14, color: "#000", textAlign: "center" },
  detailActionsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 6, paddingVertical: 4, borderTopWidth: 0.5, borderColor: "#ccc" },
  detailButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#007bff", borderRadius: 6 },
  detailButtonText: { color: "#fff", fontWeight: "bold" },
});
