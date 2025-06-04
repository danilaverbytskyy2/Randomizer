// Массив с песнями: название + путь к изображению (относительно index.html)
const songs = [
  { title: "WIFI", image: "img/wifi.jpg" },
  { title: "Sympathy", image: "img/sympathy.jpg" },
  { title: "Песня 3", image: "img/itgirl.jpg" },
  { title: "Песня 4", image: "img/sladko.jpg" },
  { title: "Песня 5", image: "img/applause.jpg" },
  { title: "Песня 6", image: "img/selfharm.jpg" }
];

// Названия CSS-классов с градиентами для секторов
const gradientClasses = [
  "sector-gradient-0",
  "sector-gradient-1",
  "sector-gradient-2",
  "sector-gradient-3",
  "sector-gradient-4",
  "sector-gradient-5"
];

// ---------------------------------------
// 2. Подготовка канваса и переменных для рисования
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const numSectors = songs.length;
const arcSize = (2 * Math.PI) / numSectors;

let currentAngle = 0; // текущий угол поворота (в радианах)

// Загрузим картинки всех песен в массив loadedImages
const loadedImages = [];
let imagesLoadedCount = 0;

songs.forEach((song, idx) => {
  const img = new Image();
  img.src = song.image;
  img.onload = () => {
    imagesLoadedCount++;
    if (imagesLoadedCount === songs.length) {
      drawWheel(); // рисуем, когда все картинки готовы
    }
  };
  loadedImages[idx] = img;
});

// ---------------------------------------
// 3. Функция отрисовки колеса
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSectors; i++) {
    const startAngle = i * arcSize;
    const endAngle = startAngle + arcSize;

    // 3.1 Рисуем цветной сектор (градиентный)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, centerX - 8, startAngle, endAngle);
    ctx.closePath();

    // Применяем градиент через временный canvas-слой
    // Делаем off-screen canvas для градиента
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // В tempCtx рисуем тот же сектор, но зальём его градиентом через паттерн
    tempCtx.beginPath();
    tempCtx.moveTo(centerX, centerY);
    tempCtx.arc(centerX, centerY, centerX - 8, startAngle, endAngle);
    tempCtx.closePath();

    // Берём CSS-градиент (то, что описано в style.css) и генерируем pattern
    // Для этого создадим временный элемент <div> с нужным классом,
    // сделаем из него SVG-изображение и используем как pattern.
    // Но для простоты здесь сделаем линейный canvas-градиент вручную:
    const grad = tempCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
    // Пример цвета: можно вручную подбирать пары из градиентов
    switch (i % gradientClasses.length) {
      case 0:
        grad.addColorStop(0, "#f6d365");
        grad.addColorStop(1, "#fda085");
        break;
      case 1:
        grad.addColorStop(0, "#84fab0");
        grad.addColorStop(1, "#8fd3f4");
        break;
      case 2:
        grad.addColorStop(0, "#a6c0fe");
        grad.addColorStop(1, "#f68084");
        break;
      case 3:
        grad.addColorStop(0, "#fccb90");
        grad.addColorStop(1, "#d57eeb");
        break;
      case 4:
        grad.addColorStop(0, "#c3cfe2");
        grad.addColorStop(1, "#c3cfe2");
        break;
      case 5:
        grad.addColorStop(0, "#89f7fe");
        grad.addColorStop(1, "#66a6ff");
        break;
    }
    tempCtx.fillStyle = grad;
    tempCtx.fill();
    tempCtx.strokeStyle = "#ffffff";
    tempCtx.lineWidth = 2;
    tempCtx.stroke();

    // Используем tempCanvas как паттерн для основного ctx
    const pattern = ctx.createPattern(tempCanvas, "no-repeat");
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 3.2 Рисуем изображение и название песни в середине сектора
    ctx.save();
    ctx.translate(centerX, centerY);
    // Поворот так, чтобы «оси» текста/изображения совпадали с серединой сектора
    const textAngle = startAngle + arcSize / 2;
    ctx.rotate(textAngle);

    // Уменьшаем изображение, чтобы названия не накладывались
    const imgRadius = centerX * 0.5;        // чуть ближе к центру
    const imgSize = centerX * 0.25;         // 25% радиуса
    ctx.drawImage(
      loadedImages[i],
      -imgSize / 2,
      -imgRadius - imgSize / 2, // немного сдвинули вверх, чтобы освободить место для текста
      imgSize,
      imgSize
    );

    // Нарисуем полупрозрачную подложку под текст
    const textY = -imgRadius + imgSize * 0.5 + 20;
    const textWidth = ctx.measureText(songs[i].title).width + 16;
    const textHeight = 24 + 8;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(-textWidth / 2, textY - textHeight / 2, textWidth, textHeight);

    // Отрисуем название самой пес­ни
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(songs[i].title, 0, textY);

    ctx.restore();
  }
}

// ---------------------------------------
// 4. Логика прокрутки и определения результата
const spinButton = document.getElementById("spin-button");
let isSpinning = false;

spinButton.addEventListener("click", () => {
  if (isSpinning) return;
  isSpinning = true;

  // Случайное число оборотов: от 3 до 6
  const extraTurns = Math.floor(Math.random() * 4) + 3; // 3,4,5,6
  // Дополнительный угол (0…2π) для случайной остановки внутри сектора
  const extraAngle = Math.random() * 2 * Math.PI;
  const totalRotate = extraTurns * 2 * Math.PI + extraAngle;

  const duration = 5000; // 5 секунд анимации
  const startTime = performance.now();
  const startAngleAnim = currentAngle;

  function animate(now) {
    const elapsed = now - startTime;
    if (elapsed < duration) {
      const t = elapsed / duration;
      const easeOut = 1 - Math.pow(1 - t, 2); // квадратичная ease-out
      currentAngle = startAngleAnim + easeOut * totalRotate;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle);
      ctx.translate(-centerX, -centerY);
      drawWheel();
      requestAnimationFrame(animate);
    } else {
      // Финальный кадр
      currentAngle = startAngleAnim + totalRotate;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle);
      ctx.translate(-centerX, -centerY);
      drawWheel();

      // Определяем, под какую часть сектора попала стрелка (стрелка смотрит ↑)
      const normalizedAngle = (currentAngle + Math.PI / 2) % (2 * Math.PI);
      const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
      let selectedIndex = Math.floor((2 * Math.PI - positiveAngle) / arcSize);
      selectedIndex = (selectedIndex + numSectors) % numSectors;

      showResult(selectedIndex);
      isSpinning = false;
    }
  }

  requestAnimationFrame(animate);
});

// ---------------------------------------
// 5. Функция показа результата
function showResult(index) {
  const titleEl = document.getElementById("song-title");
  const imgEl = document.getElementById("song-image");
  const resultContainer = document.getElementById("result");

  titleEl.textContent = songs[index].title;
  imgEl.src = songs[index].image;
  imgEl.alt = songs[index].title;

  // Показываем блок результата (убираем класс d-none)
  resultContainer.classList.remove("d-none");
}