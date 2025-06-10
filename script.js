// ---------------------------------------
// 1. Массив с песнями: название + путь к изображению (относительно index.html)
const songs = [
  { title: "WIFI", image: "img/wifi.jpg", color: "#020001" },
  { title: "Sympathy is a knife", image: "img/sympathy.jpg", color: "#9cf231" },
  { title: "IT GIRL(Fan Remix)", image: "img/itgirl.jpg", color: "#fc6202" },
  { title: "СЛАДКО", image: "img/sladko.jpg", color: "#ffffff" },
  { title: "Applause", image: "img/applause.jpg", color: "#c552e5" },
  //{ title: "Селфхарм", image: "img/selfharm.jpg", color: "#ff0000" }
];

// Количество секторов и угол (в радианах) каждого
const numSectors = songs.length;
const arcSize    = (2 * Math.PI) / numSectors; // 2π/5 ≈ 1.2566 рад (~72°)

// Ссылки на <canvas> и его контекст
const canvas  = document.getElementById("wheel");
const ctx     = canvas.getContext("2d");
const centerX = canvas.width  / 2;  // 250
const centerY = canvas.height / 2; // 250

// Текущий угол поворота колеса (в радианах)
let currentAngle = 0;

// Предварительно загружаем все изображения
const loadedImages = [];
let imagesLoadedCount = 0;

songs.forEach((song, idx) => {
  const img = new Image();
  img.src = song.image;
  img.onload = () => {
    imagesLoadedCount++;
    if (imagesLoadedCount === songs.length) {
      drawWheel();
    }
  };
  loadedImages[idx] = img;
});

// ---------------------------------------
// 2. Функция рисования колеса
//    Каждый сектор: фон (градиент + обводка), затем квадраты с рамкой и изображением.
// ---------------------------------------
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Радиус сектора (чуть меньше, чтобы не обрезать рамки)
  const outerRadius = centerX - 8; // 242px

  // Параметры квадрата для фото:
  // imgRadius = 0.5 * outerRadius   → расстояние от центра до центра квадрата
  // imgSize   = 0.5 * outerRadius   → сторона квадрата (~121px)
  const imgRadius = outerRadius * 0.6; // ≈121px
  const imgSize   = outerRadius * 0.5; // ≈121px
  const border    = 4;                 // толщина рамки

  for (let i = 0; i < numSectors; i++) {
    const startAngle = i * arcSize;
    const endAngle   = startAngle + arcSize;
    const midAngle   = startAngle + arcSize / 2;

    // -----------------------------------
    // 2.1. Рисуем фон сектора (градиент) и обводку
    // -----------------------------------
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();

    // Off-screen canvas для градиента
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width  = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Рисуем этот же сектор во временном контексте
    tempCtx.beginPath();
    tempCtx.moveTo(centerX, centerY);
    tempCtx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    tempCtx.closePath();

    // Линейный градиент для фона - используем цвет из массива songs
    const baseColor = songs[i].color;
    const grad = tempCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, baseColor);
    //grad.addColorStop(1, lightenColor(baseColor, 40)); // Светлый вариант цвета

    tempCtx.fillStyle = grad;
    tempCtx.fill();
    tempCtx.strokeStyle = "#ffffff";
    tempCtx.lineWidth = 2;
    tempCtx.stroke();

    const pattern = ctx.createPattern(tempCanvas, "no-repeat");
    ctx.fillStyle = pattern;
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // -----------------------------------
    // 2.2. Рисуем квадратную рамку и изображение внутри сектора
    // -----------------------------------
    // Вычисляем центр квадрата в координатах канваса:
    const imgCenterX = centerX + imgRadius * Math.cos(midAngle);
    const imgCenterY = centerY + imgRadius * Math.sin(midAngle);

    // Верхний левый угол квадрата:
    const sqX = imgCenterX - imgSize / 2;
    const sqY = imgCenterY - imgSize / 2;

    // Рисуем рамку (белый фон) квадрата с обводкой
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = border;
    ctx.beginPath();
    ctx.rect(sqX - border/2, sqY - border/2, imgSize + border, imgSize + border);
    ctx.fill();
    ctx.stroke();

    // Рисуем само изображение внутри рамки
    ctx.drawImage(loadedImages[i], sqX, sqY, imgSize, imgSize);

    // -----------------------------------
    // 2.3. Обводим границы сектора поверх всего, чтобы контур был видимым
    // -----------------------------------
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Функция для осветления цвета
function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return "#" + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}


// ---------------------------------------
// 3. Логика анимации прокрутки колеса
// ---------------------------------------
const spinButton = document.getElementById("spin-button");
let isSpinning = false;

spinButton.addEventListener("click", () => {
  if (isSpinning) return;
  isSpinning = true;

  // Случайные полные обороты (3–6) и дополнительный угол (0…2π)
  const extraTurns = Math.floor(Math.random() * 4) + 3; // 3,4,5,6
  const extraAngle = Math.random() * 2 * Math.PI;     // 0…2π
  const totalRotate = extraTurns * 2 * Math.PI + extraAngle;

  const duration   = 8000;
  const startTime  = performance.now();
  const startAngle = currentAngle;

  function animate(now) {
    const elapsed = now - startTime;
    if (elapsed < duration) {
      const t       = elapsed / duration;
      const easeOut = 1 - Math.pow(1 - t, 2);
      currentAngle  = startAngle + easeOut * totalRotate;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle);
      ctx.translate(-centerX, -centerY);

      drawWheel();
      requestAnimationFrame(animate);
    } else {
      currentAngle = startAngle + totalRotate;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle);
      ctx.translate(-centerX, -centerY);
      drawWheel();

      const normalizedAngle = (currentAngle + Math.PI / 2) % (2 * Math.PI);
      const positiveAngle   = normalizedAngle < 0
        ? normalizedAngle + 2 * Math.PI
        : normalizedAngle;
      let selectedIndex = Math.floor((2 * Math.PI - positiveAngle) / arcSize);
      selectedIndex     = (selectedIndex + numSectors) % numSectors;

      showResultOverlay(selectedIndex);
      isSpinning = false;
    }
  }

  requestAnimationFrame(animate);
});

// ---------------------------------------
// 4. Показ результата в полноэкранном оверлее
// ---------------------------------------
function showResultOverlay(index) {
  const titleEl = document.getElementById("overlay-song-title");
  const imgEl   = document.getElementById("overlay-song-image");
  const overlay = document.getElementById("result-overlay");

  titleEl.textContent = songs[index].title;
  imgEl.src = songs[index].image;
  imgEl.alt = songs[index].title;
  overlay.style.display = "flex";
}

// ---------------------------------------
// 5. Закрытие оверлея (возврат к колесу)
// ---------------------------------------
const closeButton = document.getElementById("close-overlay");
closeButton.addEventListener("click", () => {
  const overlay = document.getElementById("result-overlay");
  overlay.style.display = "none";
});
