import React from "react";
import { G, Rect, Text as SvgText } from "react-native-svg";

export default function MoHinhChung2D({ svgWidth, svgHeight, design, columnOrder }) {
  if (!design || !design.types || design.types.length === 0) return null;

  const totalWidth = parseFloat(design.totalWidth) || 5; // tổng chiều ngang khu vực
  const totalLength = parseFloat(design.totalLength) || 5; // tổng chiều dọc khu vực
  const laneVertical = parseFloat(design.laneVertical) || 0.6; // lối đi dọc

  // Tạo mảng tất cả các chuồng theo thứ tự form nhập hoặc theo columnOrder nếu có
  let allCages = design.types.map(t => ({
    type: t.type.toLowerCase().includes("cái")
      ? "cái"
      : t.type.toLowerCase().includes("đực")
      ? "đực"
      : "tập thể",
    fullType: t.type,
    width: t.width,
    length: t.length,
    rowType: t.rowType?.toLowerCase() || "đơn", // thêm để biết đơn/đôi
    key: `${t.type.toLowerCase()}-${t.rowType?.toLowerCase() || "đơn"}`,
  }));

  // Nếu columnOrder tồn tại, sắp xếp allCages theo columnOrder
  if (columnOrder && Array.isArray(columnOrder) && columnOrder.length > 0) {
    allCages.sort((a, b) => {
      const idxA = columnOrder.indexOf(a.key);
      const idxB = columnOrder.indexOf(b.key);
      return idxA - idxB;
    });
  }

  const scaleX = svgWidth / totalWidth;
  const scaleY = svgHeight / totalLength;

  const elements = [];
  let currentX = 0;
  let cageIndex = 0; // index trong allCages để xen kẽ

  // Bộ đếm riêng
  let counterCai = 1;
  let counterDuc = 1;

  while (currentX < totalWidth) {
    const cage = allCages[cageIndex % allCages.length]; // quay vòng
    if (currentX + cage.width > totalWidth) break;

    const numRows = Math.floor(totalLength / cage.length);

    for (let i = 0; i < numRows; i++) {
      // Xác định số đơn vị của chuồng (đơn = 1, đôi = 2)
      const unit = cage.rowType === "đôi" ? 2 : 1;

      let indexNumber = null;
      if (cage.type === "cái") {
        indexNumber = counterCai;
        counterCai += unit; // tăng theo đơn vị
      } else if (cage.type === "đực") {
        indexNumber = counterDuc;
        counterDuc += unit;
      }

      elements.push({
        type: cage.type,
        fullType: cage.fullType,
        x: currentX,
        y: i * cage.length,
        width: cage.width,
        height: cage.length,
        index: indexNumber,
        isColumnHead: i === 0,
      });
    }

    // Thêm lối đi nếu còn diện tích
    if (currentX + cage.width + laneVertical <= totalWidth) {
      elements.push({
        type: "lối đi",
        x: currentX + cage.width,
        y: 0,
        width: laneVertical,
        height: totalLength,
      });
    }

    currentX += cage.width + laneVertical;
    cageIndex++; // chuyển sang loại chuồng tiếp theo để xen kẽ
  }

  return (
    <G>
      <SvgText
        x={svgWidth / 2}
        y={20}
        fontSize="18"
        fontWeight="bold"
        textAnchor="middle"
        fill="#000"
      >
        MÔ HÌNH CHUNG
      </SvgText>

      {elements.map((el, idx) => (
        <G key={idx}>
          <Rect
            x={el.x * scaleX}
            y={el.y * scaleY + 40}
            width={el.width * scaleX}
            height={el.height * scaleY}
            fill={
              el.type === "cái"
                ? "#ffc107"
                : el.type === "đực"
                ? "#4caf50"
                : el.type === "tập thể"
                ? "#03a9f4"
                : "#ccc"
            }
            stroke="#333"
          />

          {el.type !== "lối đi" && (
            <G>
              {el.isColumnHead && (
                <SvgText
                  x={el.x * scaleX + (el.width * scaleX) / 2}
                  y={el.y * scaleY + 40 - 5}
                  fontSize="10"
                  fontWeight="bold"
                  fill="#000"
                  textAnchor="middle"
                  alignmentBaseline="baseline"
                >
                  {el.fullType}
                </SvgText>
              )}
              <SvgText
                x={el.x * scaleX + (el.width * scaleX) / 2}
                y={el.y * scaleY + 40 + (el.height * scaleY) / 2}
                fontSize="10"
                fontWeight="bold"
                fill="#000"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {el.index}
              </SvgText>
            </G>
          )}

          {el.type === "lối đi" && (
            <SvgText
              x={el.x * scaleX + (el.width * scaleX) / 2}
              y={el.y * scaleY + 40 + (el.height * scaleY) / 2}
              fontSize="10"
              fill="#000"
              opacity={0.5}
              textAnchor="middle"
              alignmentBaseline="middle"
              transform={`rotate(-90, ${el.x * scaleX + (el.width * scaleX) / 2}, ${
                el.y * scaleY + 40 + (el.height * scaleY) / 2
              })`}
            >
              Lối đi {el.width} m
            </SvgText>
          )}
        </G>
      ))}

      <SvgText
        x={svgWidth / 2}
        y={svgHeight - 10}
        fontSize="12"
        fill="#000"
        textAnchor="middle"
      >
      
      </SvgText>
    </G>
  );
}
