import React from "react";
import { G, Rect, Text as SvgText } from "react-native-svg";

export default function MoHinhTietKiem2D({ svgWidth, svgHeight, design, columnOrder }) {
  if (!design || !design.types || design.types.length === 0) return null;

  const totalWidth = parseFloat(design.totalWidth) || 5;
  const totalLength = parseFloat(design.totalLength) || 5;
  const laneWidth = 0.5; // lối đi ngang
  const singleCageWidth = 0.6; // chuồng đơn ngang
  const doubleCageWidth = 1.2; // chuồng đôi ngang

  let allCages = design.types.map(t => ({
    type: t.type.toLowerCase().includes("cái")
      ? "cái"
      : t.type.toLowerCase().includes("đực")
      ? "đực"
      : "tập thể",
    fullType: t.type,
    width: t.width,
    length: t.length,
    rowType: t.rowType?.toLowerCase() || "đơn",
    key: `${t.type.toLowerCase()}-${t.rowType?.toLowerCase() || "đơn"}`,
  }));

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
  let cageIndex = 0;

  // --- Khởi tạo counter cho từng loại chuồng ---
  let counterCai = 1;
  let counterDuc = 1;
  let counterTapThe = 1;

  const getNextCage = () => allCages[cageIndex++ % allCages.length];

  // --- Hàm chia chuồng theo ô dọc, số thứ tự tăng liên tục từng ô ---
  const pushCageCellsVertical = (cage, startX) => {
    const cells = [];
    const cellHeight = cage.type === "cái" ? 0.35 : cage.type === "đực" ? 0.6 : cage.length;
    const unit = cage.rowType === "đôi" ? 2 : 1; // số cột ngang

    for (let u = 0; u < unit; u++) {
      let yPos = 0;
      while (yPos < totalLength - 0.001) {
        const thisHeight = Math.min(cellHeight, totalLength - yPos);

        // --- Số thứ tự tăng dần cho từng ô ---
        let indexNumber = null;
        if (cage.type === "cái") {
          indexNumber = counterCai++;
        } else if (cage.type === "đực") {
          indexNumber = counterDuc++;
        } else if (cage.type === "tập thể") {
          indexNumber = counterTapThe++;
        }

        cells.push({
          type: cage.type,
          fullType: cage.fullType,
          rowType: cage.rowType,
          x: startX + u * singleCageWidth,
          y: yPos,
          width: singleCageWidth,
          height: thisHeight,
          index: indexNumber,
        });

        yPos += thisHeight;
      }
    }

    return cells;
  };

  // --- 1. Chuồng đơn đầu ---
  const firstCage = getNextCage();
  pushCageCellsVertical({ ...firstCage, rowType: "đơn" }, currentX).forEach(c => elements.push(c));
  currentX += singleCageWidth;

  // --- 2. Các dãy giữa: lối đi + chuồng đôi ---
  while (currentX + laneWidth + doubleCageWidth <= totalWidth) {
    elements.push({ type: "lối đi", x: currentX, y: 0, width: laneWidth, height: totalLength });
    currentX += laneWidth;

    const cage = getNextCage();
    pushCageCellsVertical({ ...cage, rowType: "đôi" }, currentX).forEach(c => elements.push(c));
    currentX += doubleCageWidth;
  }

  // --- 3. Phần dư ---
  const remaining = totalWidth - currentX;
  if (remaining >= laneWidth + doubleCageWidth) {
    elements.push({ type: "lối đi", x: currentX, y: 0, width: laneWidth, height: totalLength });
    currentX += laneWidth;
    const cage = getNextCage();
    pushCageCellsVertical({ ...cage, rowType: "đôi" }, currentX).forEach(c => elements.push(c));
    currentX += doubleCageWidth;
  } else if (remaining >= laneWidth + singleCageWidth) {
    elements.push({ type: "lối đi", x: currentX, y: 0, width: laneWidth, height: totalLength });
    currentX += laneWidth;
    const cage = getNextCage();
    pushCageCellsVertical({ ...cage, rowType: "đơn" }, currentX).forEach(c => elements.push(c));
    currentX += singleCageWidth;
  } else if (remaining >= laneWidth) {
    elements.push({ type: "lối đi", x: currentX, y: 0, width: remaining, height: totalLength });
    currentX += remaining;
  }

  // --- 4. Chuồng đơn cuối ---
  if (Math.abs(totalWidth - currentX) > 0.001) {
    const lastCage = getNextCage();
    pushCageCellsVertical({ ...lastCage, rowType: "đơn" }, currentX).forEach(c => elements.push(c));
  }

  // --- Render SVG ---
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
        MÔ HÌNH TIẾT KIỆM
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
    </G>
  );
}
