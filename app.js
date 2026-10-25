// Replace these sample entries with your actual locations and local image paths (e.g., "images/foto1.jpg")
const PLACES_DATA = {
  "loc-01": {
    name: "Lugar",
    summary: "Descripción",
    timeline: [
      {
        era: "1930",
        image: "/loc_01_a.jpg",
        caption: "Foto",
        description: "Informacion"
      },
      {
        era: "1980",
        image: "/loc_01_b.jpg",
        caption: "Foto",
        description: "Informacion"
      }
    ]
  }
};

let html5QrCode = null;
let liveCameraStream = null;

function startCamera() {
  document.getElementById("start-btn").style.display = "none";
  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    (decodedText) => handleScanResult(decodedText),
    () => {}
  ).catch(() => {
    alert("Cámara bloqueada. Abre el sitio mediante localhost (Live Server) o HTTPS.");
    document.getElementById("start-btn").style.display = "block";
  });
}

function handleScanResult(rawText) {
  const code = rawText.trim().toLowerCase();
  if (!PLACES_DATA[code]) {
    alert(`Código no reconocido: "${code}"`);
    return;
  }

  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      renderPlace(code);
      startLiveBackgroundCamera();
    });
  } else {
    renderPlace(code);
    startLiveBackgroundCamera();
  }
}

// Inicia la cámara trasera limpia detrás de la foto histórica
function startLiveBackgroundCamera() {
  const videoEl = document.getElementById("live-camera");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  })
  .then((stream) => {
    liveCameraStream = stream;
    videoEl.srcObject = stream;
  })
  .catch((err) => {
    console.warn("No se pudo iniciar la cámara de fondo:", err);
  });
}

// Apaga la cámara de fondo al volver al escáner QR
function stopLiveBackgroundCamera() {
  if (liveCameraStream) {
    liveCameraStream.getTracks().forEach((track) => track.stop());
    liveCameraStream = null;
  }
}

// Actualiza la posición de recorte del slider (0% a 100%)
function updateWipe(value) {
  const viewer = document.getElementById("comparison-viewer");
  viewer.style.setProperty("--split", `${value}%`);
}

function renderPlace(code) {
  const place = PLACES_DATA[code];
  document.getElementById("scanner-view").classList.remove("active");
  document.getElementById("archive-view").classList.add("active");

  document.getElementById("place-title").textContent = place.name;
  document.getElementById("place-summary").textContent = place.summary;

  const tabsContainer = document.getElementById("era-tabs");
  tabsContainer.innerHTML = "";

  place.timeline.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = `era-tab ${index === 0 ? "active" : ""}`;
    btn.textContent = item.era;
    btn.onclick = () => selectEra(place, index);
    tabsContainer.appendChild(btn);
  });

  // Carga la foto PRIMERO antes de tocar el slider
  selectEra(place, 0);

  const slider = document.getElementById("wipe-slider");
  if (slider) {
    slider.value = 50;
    updateWipe(50);
  }
}

function selectEra(place, index) {
  const eraData = place.timeline[index];
  const imgEl = document.getElementById("era-image");

  imgEl.onerror = () => alert("No se pudo cargar la imagen en la ruta: " + eraData.image);
  imgEl.src = eraData.image;

  const pastLabel = document.getElementById("past-label");
  if (pastLabel) pastLabel.textContent = eraData.era;

  document.getElementById("era-caption").textContent = eraData.caption;
  document.getElementById("era-description").textContent = eraData.description;

  document.querySelectorAll(".era-tab").forEach((tab, i) => {
    tab.classList.toggle("active", i === index);
  });
}

function returnToScanner() {
  stopLiveBackgroundCamera();
  document.getElementById("archive-view").classList.remove("active");
  document.getElementById("scanner-view").classList.add("active");
  document.getElementById("start-btn").style.display = "block";
}