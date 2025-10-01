import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TabBar, TabView } from "react-native-tab-view";
import { auth, db } from "../../firebase";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ----------------------
// Component Tab Thống kê
// ----------------------
const ThongKeTab = ({ cages }) => {
  const totalCages = cages.length;
  const totalFemale = cages.filter((c) => c.type === "Cái").length;
  const totalMale = cages.filter((c) => c.type === "Đực").length;
  const totalFemaleHB = cages.filter((c) => c.type === "Hậu bị cái").length;
  const totalMaleHB = cages.filter((c) => c.type === "Hậu bị đực").length;
  const totalBabyAlive = cages.reduce((sum, c) => sum + (parseInt(c.numAlive || 0)), 0);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>📊 Thống kê tổng quan</Text>
        <Text style={styles.text}>Tổng số chuồng: {totalCages}</Text>
        <Text style={styles.text}>Dúi cái trưởng thành: {totalFemale}</Text>
        <Text style={styles.text}>Dúi đực trưởng thành: {totalMale}</Text>
        <Text style={styles.text}>Dúi cái hậu bị: {totalFemaleHB}</Text>
        <Text style={styles.text}>Dúi đực hậu bị: {totalMaleHB}</Text>
        <Text style={styles.text}>Dúi con sống: {totalBabyAlive}</Text>
      </View>
    </ScrollView>
  );
};

// ----------------------
// Component Tab Thông báo
// ----------------------
const ThongBaoTab = ({ cages }) => {
  const [notifications, setNotifications] = useState([]);
  const userId = auth.currentUser.uid;

  useEffect(() => {
    const notis = [];
    const parseDate = (d) => {
      if (!d) return null;
      if (d.toDate) return d.toDate();
      return new Date(d);
    };

    const warningKeywords = ["bệnh", "sức khỏe", "cắn nhau", "yếu", "sinh sản"];

    cages.forEach((c) => {
      const isFemale = c.type === "Cái" || c.type === "Hậu bị cái";
      const isMale = c.type === "Đực" || c.type === "Hậu bị đực";

      // 1. Ngày tách phối (cả cái và đực)
      if (c.matingDate) {
        const sep = parseDate(c.matingDate);
        sep.setDate(sep.getDate() + 10);
        if (!c.separateNotified) {
          notis.push({
            id: c.id + "_separate",
            cageId: c.id,
            type: "separate",
            title: `Chuồng ${c.name}`,
            message: `Sắp đến ngày tách phối: ${sep.toLocaleDateString()}`,
            targetDate: sep,
          });
        }
      }

      if (isFemale) {
        // 2. Ngày sinh (chỉ chuồng cái)
        if (c.matingDate && !c.birthNotified) {
          const start = parseDate(c.matingDate);
          start.setDate(start.getDate() + 30);
          const end = parseDate(c.matingDate);
          end.setDate(end.getDate() + 36);
          notis.push({
            id: c.id + "_birth",
            cageId: c.id,
            type: "birth",
            title: `Chuồng ${c.name}`,
            message: `Dự kiến sinh: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            targetDate: start,
          });
        }

        // 3. Ngày tách con (chỉ chuồng cái)
        if (c.birthDate && !c.weaningNotified) {
          const wean = parseDate(c.birthDate);
          wean.setDate(wean.getDate() + 25);
          notis.push({
            id: c.id + "_weaning",
            cageId: c.id,
            type: "weaning",
            title: `Chuồng ${c.name}`,
            message: `Sắp đến ngày tách con: ${wean.toLocaleDateString()}`,
            targetDate: wean,
          });
        }
      }

      // 4. Cảnh báo từ ghi chú
      if (c.note) {
        const noteLower = c.note.toLowerCase();
        const hasWarning = warningKeywords.some((kw) => noteLower.includes(kw));
        if (hasWarning) {
          notis.push({
            id: c.id + "_warning",
            cageId: c.id,
            type: "warning",
            title: `⚠️ Cảnh báo chuồng ${c.name}`,
            message: c.note,
            targetDate: new Date(),
          });
        }
      }
    });

    // Sắp xếp thông báo theo targetDate từ gần nhất → xa nhất
    notis.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));

    setNotifications(notis);
  }, [cages]);

  const confirmNotification = async (note) => {
    const cageRef = doc(db, "users", userId, "cages", note.cageId);

    if (note.type === "separate") {
      await updateDoc(cageRef, { separateNotified: true, separateDate: null });
    } else if (note.type === "birth") {
      await updateDoc(cageRef, { birthNotified: true, birthDate: null });
    } else if (note.type === "weaning") {
      await updateDoc(cageRef, { weaningNotified: true, birthDate: null, separationChildDate: null });
    }

    setNotifications((prev) => prev.filter((n) => n.id !== note.id));
  };

  const deleteNotification = (noteId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== noteId));
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>🔔 Thông báo</Text>
        {notifications.length === 0 ? (
          <Text style={[styles.text, { color: "#888" }]}>Không có thông báo mới</Text>
        ) : (
          notifications.map((noti) => (
            <View
              key={noti.id}
              style={[
                styles.notification,
                noti.type === "warning" ? styles.warningNotification : {},
              ]}
            >
              <Text style={styles.notiTitle}>{noti.title}</Text>
              <Text
                style={[
                  styles.notiMessage,
                  noti.type === "warning" ? { color: "#fff" } : {},
                ]}
              >
                {noti.message}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                {noti.type !== "warning" && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => confirmNotification(noti)}
                  >
                    <Text style={{ color: "#fff" }}>✅ Xác nhận</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => deleteNotification(noti.id)}
                >
                  <Text style={{ color: "#fff" }}>🗑 Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

// ----------------------
// Component chính
// ----------------------
export default function BangDieuKhien({ parentId = null }) {
  const [cages, setCages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const userId = auth.currentUser.uid;

  const [routes] = useState([
    { key: "thongke", title: "Thống kê" },
    { key: "thongbao", title: "Thông báo" },
  ]);

  useEffect(() => {
    let queryRef = parentId
      ? collection(db, "users", userId, "cages", parentId, "subCages")
      : collection(db, "users", userId, "cages");

    const unsub = onSnapshot(queryRef, (snapshot) => {
      const cageList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCages(cageList);
      setLoading(false);
    });
    return () => unsub();
  }, [parentId, userId]);

  if (loading)
    return <Text style={{ padding: 16, textAlign: "center" }}>⏳ Đang tải dữ liệu...</Text>;

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "thongke":
        return <ThongKeTab cages={cages} />;
      case "thongbao":
        return <ThongBaoTab cages={cages} />;
      default:
        return null;
    }
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: SCREEN_WIDTH }}
      renderTabBar={(props) => <TabBar {...props} />}
    />
  );
}

// ----------------------
// Styles
// ----------------------
const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  notification: {
    width: "100%",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  warningNotification: {
    backgroundColor: "#dc2626",
    borderLeftColor: "#b91c1c",
  },
  notiTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  notiMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  confirmBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
