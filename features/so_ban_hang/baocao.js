// src/screens/baocao.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from "react";
import { Button, Dimensions, FlatList, Picker, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Page, PDFDocument } from 'react-native-pdf-lib';
import XLSX from 'xlsx';
import { layDanhSach } from "../firebase/db";

export default function BaoCao() {
  const [danhSachHoaDon, setDanhSachHoaDon] = useState([]);
  const [danhSachSanPham, setDanhSachSanPham] = useState([]);
  const [thoiGian, setThoiGian] = useState("daily"); // daily, weekly, monthly, yearly

  // Load dữ liệu từ Firestore
  const loadData = async () => {
    const hd = await layDanhSach("invoices");
    const sp = await layDanhSach("products");
    setDanhSachHoaDon(hd);
    setDanhSachSanPham(sp);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tổng hợp doanh thu theo thời gian
  const tongHopDoanhThu = () => {
    const data = {};
    danhSachHoaDon.forEach((hd) => {
      const ngay = new Date(hd.createdAt.seconds * 1000);
      let key = "";
      switch (thoiGian) {
        case "daily": key = ngay.toLocaleDateString(); break;
        case "weekly": key = `Tuan ${getWeekNumber(ngay)}-${ngay.getFullYear()}`; break;
        case "monthly": key = `${ngay.getMonth()+1}-${ngay.getFullYear()}`; break;
        case "yearly": key = `${ngay.getFullYear()}`; break;
      }
      if (!data[key]) data[key] = 0;
      data[key] += hd.total || 0;
    });
    const labels = Object.keys(data);
    const values = Object.values(data);
    return { labels, values };
  };

  // Lấy tuần trong năm
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  };

  // Tồn kho hiện tại
  const tonKho = danhSachSanPham.map((sp) => ({ name: sp.name, stock: sp.stock || 0 }));

  // Sản phẩm bán chạy
  const spBanChay = () => {
    const soLuong = {};
    danhSachHoaDon.forEach((hd) => {
      hd.products.forEach((p) => {
        if (!soLuong[p.name]) soLuong[p.name] = 0;
        soLuong[p.name] += p.quantity;
      });
    });
    return Object.entries(soLuong)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a,b) => b.quantity - a.quantity);
  };

  // Xuất Excel
  const xuatExcel = async () => {
    const wsData = [
      ["San pham", "Ton kho", "So luong ban", "Doanh thu"]
    ];

    spBanChay().forEach((item) => {
      const tongTien = danhSachHoaDon
        .flatMap(hd => hd.products)
        .filter(p => p.name === item.name)
        .reduce((sum, p) => sum + p.price * p.quantity, 0);
      const spInfo = danhSachSanPham.find(sp => sp.name === item.name);
      wsData.push([item.name, spInfo?.stock || 0, item.quantity, tongTien]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCao");

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const fileUri = FileSystem.cacheDirectory + 'BaoCao.xlsx';

    await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(fileUri);
  };

  // Xuất PDF nhiều trang
  const xuatPDF = async () => {
    const pageHeight = 750;
    const marginTop = 50;
    const lineHeight = 20;
    const maxLinesPerPage = Math.floor((pageHeight - marginTop) / lineHeight);

    const spList = spBanChay().map(item => {
      const spInfo = danhSachSanPham.find(sp => sp.name === item.name);
      const tongTien = danhSachHoaDon
        .flatMap(hd => hd.products)
        .filter(p => p.name === item.name)
        .reduce((sum, p) => sum + p.price * p.quantity, 0);
      return `${item.name} - Ton kho: ${spInfo?.stock || 0} - Ban: ${item.quantity} - Doanh thu: ${tongTien} VND`;
    });

    const pages = [];
    for (let i = 0; i < spList.length; i += maxLinesPerPage) {
      const page = Page.create();
      page.drawText("Bao Cao San Pham", { x: 50, y: pageHeight - 30, size: 20 });
      let y = pageHeight - 60;
      spList.slice(i, i + maxLinesPerPage).forEach(line => {
        page.drawText(line, { x: 50, y });
        y -= lineHeight;
      });
      pages.push(page);
    }

    const filePath = FileSystem.cacheDirectory + 'BaoCao.pdf';
    const pdfDoc = await PDFDocument.create(filePath);
    pages.forEach(p => pdfDoc.addPages(p));

    await pdfDoc.write();
    await Sharing.shareAsync(filePath);
  };

  const chartData = tongHopDoanhThu();

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={styles.title}>Doanh thu theo {thoiGian}</Text>
      <Picker selectedValue={thoiGian} onValueChange={(itemValue) => setThoiGian(itemValue)}>
        <Picker.Item label="Ngày" value="daily" />
        <Picker.Item label="Tuần" value="weekly" />
        <Picker.Item label="Tháng" value="monthly" />
        <Picker.Item label="Năm" value="yearly" />
      </Picker>

      {chartData.labels.length > 0 && (
        <BarChart
          data={{
            labels: chartData.labels,
            datasets: [{ data: chartData.values }]
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          }}
          style={{ marginVertical: 10, borderRadius: 8 }}
        />
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
        <Button title="Xuất Excel" onPress={xuatExcel} />
        <Button title="Xuất PDF" onPress={xuatPDF} />
      </View>

      <Text style={styles.title}>Tồn kho sản phẩm</Text>
      <FlatList
        data={tonKho}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <Text>{item.name}: {item.stock}</Text>}
      />

      <Text style={styles.title}>Sản phẩm bán chạy</Text>
      <FlatList
        data={spBanChay()}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <Text>{item.name}: {item.quantity} sp</Text>}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "bold", marginTop: 15, marginBottom: 5, fontSize: 16 }
});
