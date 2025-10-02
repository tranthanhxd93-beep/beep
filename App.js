import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import BoCucChinh from "./features/bo_cuc/BoCucChinh";
import ManHinhChao from "./features/man_hinh_chao/ManHinhChao";
// 👉 Thêm màn hình QuanLyHoaDon
import QuanLyHoaDon from "./features/so_ban_hang/QuanLyHoaDon";
import ManHinhTaiLieu from "./features/tai_lieu/ManHinhTaiLieu";
import BanVe2DScreenFull from "./features/thiet_ke/BanVe2DScreenFull";
import DangKy from "./features/xac_thuc/DangKy";
import DangNhap from "./features/xac_thuc/DangNhap";
import ThongBaoDangNhap from "./features/xac_thuc/ThongBaoDangNhap";
import { auth, db } from "./firebase";


const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsReady(true);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        const userData = snap.exists() ? snap.data() : null;

        if (!userData) {
          setAlertMessage("Tài khoản chưa được đăng ký!");
          setShowAlert(true);
          await signOut(auth);
          setUser(null);
        } else if (userData.role === "pending") {
          setAlertMessage("Tài khoản đang chờ admin duyệt!");
          setShowAlert(true);
          await signOut(auth);
          setUser(null);
        } else if (userData.blocked) {
          setAlertMessage("Tài khoản đã bị chặn. Liên hệ admin!");
          setShowAlert(true);
          await signOut(auth);
          setUser(null);
        } else {
          setUser(userData);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setIsReady(true);
      }
    });

    return unsubscribe;
  }, []);

  if (!isReady) return <ManHinhChao />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={user ? "BoCucChinh" : "DangNhap"}
              >
                <Stack.Screen name="DangNhap" component={DangNhap} />
                <Stack.Screen name="DangKy" component={DangKy} />

                <Stack.Screen name="BoCucChinh">
                  {(props) => <BoCucChinh {...props} user={user} />}
                </Stack.Screen>

                <Stack.Screen name="ThongBaoDangNhap">
                  {(props) => (
                    <ThongBaoDangNhap
                      {...props}
                      visible={showAlert}
                      message={alertMessage}
                      onOk={() => setShowAlert(false)}
                    />
                  )}
                </Stack.Screen>

                <Stack.Screen
                  name="BanVe2DScreenFull"
                  component={BanVe2DScreenFull}
                  options={{ headerShown: true, title: "Bản vẽ 2D" }}
                />

                <Stack.Screen
                  name="ManHinhTaiLieu"
                  component={ManHinhTaiLieu}
                  options={{ headerShown: true, title: "Tài liệu" }}
                />

                {/* 👉 Thêm màn hình QuanLyHoaDon */}
                <Stack.Screen
                  name="QuanLyHoaDon"
                  component={QuanLyHoaDon}
                  options={{ headerShown: true, title: "Quản lý Hóa Đơn" }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
