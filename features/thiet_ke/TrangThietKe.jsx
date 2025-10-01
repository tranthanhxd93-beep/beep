// features/thiet_ke/TrangThietKe.jsx
import {
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Button,
  Dimensions,
  FlatList, Platform,
  ScrollView,
  StyleSheet,
  Text, UIManager,
  View
} from "react-native";
import {
  PanGestureHandler,
  PinchGestureHandler,
  State
} from "react-native-gesture-handler";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { db } from "../../firebase";
import tinhOChuongTuDong from "./TinhOChuongTuDong";

// Kích hoạt LayoutAnimation cho Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TrangThietKe() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const { width: screenWidth } = Dimensions.get("window");

  // === Load danh sách thiết kế ===
  useEffect(() => {
    const q = query(collection(db, "thiet_ke"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDesigns(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        Alert.alert("Lỗi", "Không thể tải danh sách thiết kế!");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDelete = async (design) => {
    Alert.alert("Xác nhận", `Bạn có chắc muốn xóa thiết kế "${design.name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "thiet_ke", design.id));
          } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể xóa thiết kế!");
          }
        },
      },
    ]);
  };

  const handleEditName = async (design) => {
    Alert.prompt(
      "Chỉnh sửa tên",
      "Nhập tên mới cho thiết kế",
      async (text) => {
        try {
          await updateDoc(doc(db, "thiet_ke", design.id), { name: text });
        } catch (err) {
          console.error(err);
          Alert.alert("Lỗi", "Không thể cập nhật tên thiết kế!");
        }
      },
      "plain-text",
      design.name
    );
  };

  // === Animated Pan/Pinch ===
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: pan.x, translationY: pan.y } }],
    { useNativeDriver: true }
  );
  const onPanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) pan.extractOffset();
  };

  const onPinchEvent = Animated.event([{ nativeEvent: { scale } }], {
    useNativeDriver: true,
  });
  const onPinchStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      scale.setValue(1);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Danh sách thiết kế */}
      {loading ? (
        <Text>Đang tải...</Text>
      ) : designs.length === 0 ? (
        <Text>Chưa có thiết kế nào.</Text>
      ) : (
        <FlatList
          data={designs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text>
                Dài: {item.length}, Rộng: {item.width}, Dãy: {item.cols}, Loại:{" "}
                {item.type}
              </Text>
              <View style={{ flexDirection: "row", marginTop: 5 }}>
                <Button
                  title="✏️ Sửa tên"
                  onPress={() => handleEditName(item)}
                />
                <View style={{ width: 8 }} />
                <Button
                  title="🗑️ Xóa"
                  color="red"
                  onPress={() => handleDelete(item)}
                />
              </View>
            </View>
          )}
        />
      )}

      {/* Vùng vẽ Pan/Pinch */}
      <Text style={{ marginTop: 20, fontWeight: "bold" }}>
        🖼️ Xem trước thiết kế
      </Text>
      <PanGestureHandler
        onGestureEvent={onPanEvent}
        onHandlerStateChange={onPanStateChange}
      >
        <Animated.View
          style={{
            marginTop: 10,
            backgroundColor: "#eee",
            width: screenWidth - 32,
            height: 300,
          }}
        >
          <PinchGestureHandler
            onGestureEvent={onPinchEvent}
            onHandlerStateChange={onPinchStateChange}
          >
            <Animated.View
              style={{
                flex: 1,
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: Animated.multiply(scale, lastScale.current) },
                ],
              }}
            >
              {designs[0] ? (
                <Svg width={screenWidth - 32} height={300}>
                  {tinhOChuongTuDong(designs[0]).cells.map((cell) => (
                    <React.Fragment key={cell.id}>
                      <Rect
                        x={cell.x}
                        y={cell.y}
                        width={cell.width}
                        height={cell.height}
                        fill={cell.type === "cai" ? "#ffc107" : "#4caf50"}
                        stroke="#333"
                      />
                      <SvgText
                        x={cell.x + cell.width / 2}
                        y={cell.y + cell.height / 2}
                        fontSize="8"
                        fill="#000"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {cell.row + 1}-{cell.col + 1}
                      </SvgText>
                    </React.Fragment>
                  ))}
                </Svg>
              ) : (
                <Text>Chưa có thiết kế để xem trước</Text>
              )}
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  name: { fontWeight: "bold", marginBottom: 4 },
});
