import { AppRegistry } from "react-native";
import "react-native-gesture-handler"; // 👈 bắt buộc đặt ở đầu tiên
import App from "./App";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);
