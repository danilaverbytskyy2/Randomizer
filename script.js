// =============================================
// КОНФИГУРАЦИЯ
// =============================================

// Исходный массив всех песен
const allSongs = [
  { title: "WIFI", image: "img/wifi.jpg", color: "#020001" },
  { title: "Sympathy is a knife", image: "img/sympathy.jpg", color: "#9cf231" },
  { title: "IT GIRL(Fan Remix)", image: "img/itgirl.jpg", color: "#fc6202" },
  { title: "СЛАДКО", image: "img/sladko.jpg", color: "#ffffff" },
  { title: "Applause", image: "img/applause.jpg", color: "#c552e5" },
];

// Рабочий массив песен (который изменяется)
let songs = [...allSongs];
let numSectors = songs.length;
let arcSize = numSectors > 0 ? (2 * Math.PI) / numSectors : 0;

// =============================================
// ИНИЦИАЛИЗАЦИЯ КАНВАСА И ЭЛЕМЕНТОВ
// =============================================

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const spinButton = document.getElementById("spin-button");
let currentAngle = 0;
let isSpinning = false;
const loadedImages = [];
let imagesLoadedCount = 0;

// =============================================
// ЗАГРУЗКА ИЗОБРАЖЕНИЙ
// =============================================

function loadImages() {
  allSongs.forEach((song, idx) => {
    const img = new Image();
    img.src = song.image;
    img.onload = () => {
      imagesLoadedCount++;
      loadedImages[idx] = img;

      // Когда все изображения загружены
      if (imagesLoadedCount === allSongs.length) {
        document.getElementById('loader').style.display = 'none';
        spinButton.style.display = 'block';
        drawWheel();
        createSongControls();
      }
    };

    img.onerror = () => {
      console.error(`Не удалось загрузить изображение: ${song.image}`);
      // Заглушка для отсутствующего изображения
      loadedImages[idx] = createPlaceholderImage(song.color, song.title);
      imagesLoadedCount++;
    };
  });
}

function createPlaceholderImage(color, text) {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 200, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, 100, 100);

  return canvas;
}

// =============================================
// ОТРИСОВКА КОЛЕСА
// =============================================

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (songs.length === 0) {
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Нет активных песен', centerX, centerY);
    return;
  }

  const outerRadius = centerX - 8;
  const imgRadius = outerRadius * 0.6;
  const imgSize = outerRadius * 0.5;
  const border = 4;

  for (let i = 0; i < numSectors; i++) {
    const startAngle = i * arcSize;
    const endAngle = startAngle + arcSize;
    const midAngle = startAngle + arcSize / 2;

    // Рисуем сектор
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();

    // Заливка сектора
    ctx.fillStyle = songs[i].color;
    ctx.fill();

    // Обводка сектора
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Позиция для изображения
    const imgCenterX = centerX + imgRadius * Math.cos(midAngle);
    const imgCenterY = centerY + imgRadius * Math.sin(midAngle);
    const sqX = imgCenterX - imgSize / 2;
    const sqY = imgCenterY - imgSize / 2;

    // Рамка для изображения
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = border;
    ctx.beginPath();
    ctx.rect(sqX - border/2, sqY - border/2, imgSize + border, imgSize + border);
    ctx.fill();
    ctx.stroke();

    // Само изображение
    const originalIndex = allSongs.findIndex(s => s.title === songs[i].title);
    ctx.drawImage(loadedImages[originalIndex], sqX, sqY, imgSize, imgSize);
  }
}

// =============================================
// АНИМАЦИЯ ВРАЩЕНИЯ
// =============================================

function spinWheel() {
  if (isSpinning || songs.length === 0) return;
  isSpinning = true;
  spinButton.disabled = true;

  const extraTurns = Math.floor(Math.random() * 4) + 3;
  const extraAngle = Math.random() * 2 * Math.PI;
  const totalRotate = extraTurns * 2 * Math.PI + extraAngle;
  const duration = 7000 + Math.random() * 2000;
  const startTime = performance.now();
  const startAngle = currentAngle;

  function animate(now) {
    const elapsed = now - startTime;
    if (elapsed < duration) {
      const t = elapsed / duration;
      const easeOut = 1 - Math.pow(1 - t, 3); // Более плавное замедление
      currentAngle = startAngle + easeOut * totalRotate;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle);
      ctx.translate(-centerX, -centerY);
      drawWheel();

      requestAnimationFrame(animate);
    } else {
      finishSpin(startAngle + totalRotate);
    }
  }

  function finishSpin(finalAngle) {
    currentAngle = finalAngle % (2 * Math.PI);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);
    ctx.translate(-centerX, -centerY);
    drawWheel();

    const normalizedAngle = (currentAngle + Math.PI / 2) % (2 * Math.PI);
    const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
    let selectedIndex = Math.floor((2 * Math.PI - positiveAngle) / arcSize);
    selectedIndex = (selectedIndex + numSectors) % numSectors;

    setTimeout(() => {
      showResultOverlay(selectedIndex);
      isSpinning = false;
      spinButton.disabled = false;
    }, 500);
  }

  requestAnimationFrame(animate);
}

// =============================================
// ПАНЕЛЬ УПРАВЛЕНИЯ ПЕСНЯМИ
// =============================================

function createSongControls() {
  const container = document.getElementById('songs-list');
  container.innerHTML = '';

  // Кнопки "Включить все"/"Выключить все"
  const controlsHeader = document.createElement('div');
  controlsHeader.className = 'controls-header';
  container.appendChild(controlsHeader);

  // Список песен
  allSongs.forEach((song, index) => {
    const songItem = document.createElement('div');
    songItem.className = 'song-item';

    const isActive = songs.some(s => s.title === song.title);

    songItem.innerHTML = `
      <span>${song.title}</span>
      <button class="song-toggle ${isActive ? '' : 'disabled'}" 
              data-index="${index}">
        ${isActive ? 'Выключить' : 'Включить'}
      </button>
    `;

    container.appendChild(songItem);
  });

  // Обработчики событий
  document.querySelectorAll('.song-toggle').forEach(btn => {
    btn.addEventListener('click', toggleSong);
  });

  document.getElementById('enable-all').addEventListener('click', enableAllSongs);
  document.getElementById('disable-all').addEventListener('click', disableAllSongs);
}

function toggleSong(e) {
  const index = parseInt(e.target.dataset.index);
  const song = allSongs[index];

  const songIndex = songs.findIndex(s => s.title === song.title);

  if (songIndex >= 0) {
    songs.splice(songIndex, 1);
    e.target.textContent = 'Включить';
    e.target.classList.add('disabled');
  } else {
    songs.push(song);
    e.target.textContent = 'Выключить';
    e.target.classList.remove('disabled');
  }

  updateWheelParams();
  drawWheel();
}

function enableAllSongs() {
  songs = [...allSongs];
  updateWheelParams();
  drawWheel();
  createSongControls(); // Обновляем кнопки
}

function disableAllSongs() {
  songs = [];
  updateWheelParams();
  drawWheel();
  createSongControls(); // Обновляем кнопки
}

function updateWheelParams() {
  numSectors = songs.length;
  arcSize = numSectors > 0 ? (2 * Math.PI) / numSectors : 0;
  spinButton.disabled = numSectors === 0;
}

// =============================================
// ОТОБРАЖЕНИЕ РЕЗУЛЬТАТА
// =============================================

function showResultOverlay(index) {
  const titleEl = document.getElementById('overlay-song-title');
  const imgEl = document.getElementById('overlay-song-image');
  const overlay = document.getElementById('result-overlay');

  titleEl.textContent = songs[index].title;

  const originalIndex = allSongs.findIndex(s => s.title === songs[index].title);
  imgEl.src = allSongs[originalIndex].image;
  imgEl.alt = songs[index].title;

  overlay.style.display = "flex";
}

// =============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  // Добавляем лоадер в HTML (если его нет)
  if (!document.getElementById('loader')) {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.textContent = 'Загрузка обложек...';
    document.getElementById('main-content').prepend(loader);
  }

  spinButton.style.display = 'none';
  spinButton.addEventListener('click', spinWheel);

  document.getElementById('close-overlay').addEventListener('click', () => {
    document.getElementById('result-overlay').style.display = 'none';
  });

  loadImages();
});