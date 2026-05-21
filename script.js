const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const canvas = document.querySelector("#particleCore");
const ctx = canvas.getContext("2d");
const listenBtn = document.querySelector("#listenBtn");
const simulateBtn = document.querySelector("#simulateBtn");
const terminal = document.querySelector("#terminal");
const transcript = document.querySelector("#transcript");
const wakeState = document.querySelector("#wakeState");
const clock = document.querySelector("#clock");
const coreState = document.querySelector("#coreState");
const confidenceText = document.querySelector("#confidenceText");
const signalText = document.querySelector("#signalText");
const modeText = document.querySelector("#modeText");
const networkText = document.querySelector("#networkText");
const threatText = document.querySelector("#threatText");
const voiceBar = document.querySelector("#voiceBar");
const voiceValue = document.querySelector("#voiceValue");
const reactorValue = document.querySelector("#reactorValue");
const uplinkValue = document.querySelector("#uplinkValue");

let recognition;
let listening = false;
let awake = false;
let audioContext;
let analyser;
let audioData;
let micLevel = 0;
let particles = [];
let pulse = 0;

const terminalLines = [
  ["Booting holographic kernel", "ok"],
  ["Scanning local voice bus", "ok"],
  ["Neural matrix handshake ready", "ok"],
  ["Encrypted uplink cloaked", "warn"],
  ["Awaiting phrase: HEY JARVIS", "ok"]
];

const hackerFeed = [
  "port.scan --silent 10.0.0.42",
  "decrypting telemetry shard 7A-19",
  "spoof route accepted",
  "packet trace masked",
  "countermeasure lattice armed",
  "thermal signature normalized",
  "voiceprint hash refreshed",
  "satellite ping triangulated",
  "subroutine FRIDAY isolated",
  "defense grid listening"
];

function resizeCanvas() {
  const size = Math.min(720, Math.max(360, canvas.clientWidth));
  const scale = window.devicePixelRatio || 1;
  canvas.width = size * scale;
  canvas.height = size * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  createParticles(size);
}

function createParticles(size) {
  const count = Math.floor(size * 0.36);
  particles = Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    const lane = index % 5;
    return {
      angle,
      lane,
      baseRadius: size * (0.16 + lane * 0.055),
      speed: 0.0024 + lane * 0.0007,
      size: 1.2 + (index % 4) * 0.35,
      jitter: Math.random() * Math.PI * 2
    };
  });
}

function drawCore() {
  const size = canvas.width / (window.devicePixelRatio || 1);
  const center = size / 2;
  pulse += 0.025;

  ctx.clearRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(center, center, 0, center, center, size * 0.34);
  glow.addColorStop(0, `rgba(55, 231, 255, ${0.24 + micLevel * 0.35})`);
  glow.addColorStop(0.42, "rgba(55, 231, 255, 0.08)");
  glow.addColorStop(1, "rgba(55, 231, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(center, center, size * 0.34, 0, Math.PI * 2);
  ctx.fill();

  particles.forEach((particle) => {
    particle.angle += particle.speed * (awake ? 2.4 : 1);
    const wave = Math.sin(pulse * 2 + particle.jitter) * 8;
    const radius = particle.baseRadius + wave + micLevel * 90;
    const x = center + Math.cos(particle.angle) * radius;
    const y = center + Math.sin(particle.angle) * radius;
    const alpha = awake ? 0.62 + micLevel * 0.38 : 0.28;

    ctx.fillStyle = `rgba(55, 231, 255, ${alpha})`;
    ctx.shadowBlur = 14 + micLevel * 26;
    ctx.shadowColor = "#37e7ff";
    ctx.beginPath();
    ctx.arc(x, y, particle.size + micLevel * 2.8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.shadowBlur = 0;
  drawWaveRing(center, size * (0.24 + micLevel * 0.08), "#37e7ff", 0.8);
  drawWaveRing(center, size * (0.31 + micLevel * 0.05), "#ffbd5a", 0.38);
  requestAnimationFrame(drawCore);
}

function drawWaveRing(center, radius, color, alpha) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.4;
  ctx.beginPath();

  for (let i = 0; i <= 220; i += 1) {
    const angle = (Math.PI * 2 * i) / 220;
    const modulation = Math.sin(angle * 12 + pulse * 4) * (4 + micLevel * 18);
    const r = radius + modulation;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function logLine(text, type = "ok") {
  const line = document.createElement("p");
  line.className = type === "danger" ? "danger" : type === "warn" ? "warn" : "";
  line.textContent = `> ${text}`;
  terminal.appendChild(line);

  while (terminal.children.length > 18) {
    terminal.removeChild(terminal.firstChild);
  }
  terminal.scrollTop = terminal.scrollHeight;
}

function bootTerminal() {
  terminal.innerHTML = "";
  terminalLines.forEach(([text, type], index) => {
    window.setTimeout(() => logLine(text, type), index * 220);
  });
}

function setAwake(isAwake, reason = "Wake phrase detected") {
  awake = isAwake;
  document.body.classList.toggle("awake", awake);
  wakeState.lastChild.textContent = awake ? " JARVIS online" : " Awaiting wake phrase";
  coreState.textContent = awake ? "Online" : "Standby";
  confidenceText.textContent = awake ? "Command link active" : 'Say "Hey Jarvis"';
  modeText.textContent = awake ? "Tactical UI" : "Passive Scan";
  networkText.textContent = awake ? "Linked" : "Cloaked";
  signalText.textContent = awake ? "Signal locked" : "Signal idle";
  logLine(reason, awake ? "ok" : "warn");
}

function handleSpeech(text) {
  const normalized = text.toLowerCase();
  transcript.textContent = text;

  if (normalized.includes("hey jarvis") || normalized.includes("hi jarvis")) {
    setAwake(true, "Wake phrase accepted. Interface online.");
    speak("At your service.");
    return;
  }

  if (!awake) {
    logLine(`ignored passive input: ${text}`, "warn");
    return;
  }

  if (normalized.includes("status")) {
    logLine("status request received: reactor stable, uplink encrypted, threat low");
    speak("All systems are stable.");
  } else if (normalized.includes("hack") || normalized.includes("scan")) {
    threatText.textContent = "Elevated";
    logLine("intrusion simulation started", "danger");
    speak("Running a defensive scan.");
  } else if (normalized.includes("sleep") || normalized.includes("standby")) {
    setAwake(false, "Standby command accepted.");
    speak("Entering standby.");
  } else {
    logLine(`command parsed: ${text}`);
    speak("Command acknowledged.");
  }
}

function setupRecognition() {
  if (!SpeechRecognition) {
    listenBtn.textContent = "Speech unsupported";
    listenBtn.disabled = true;
    transcript.textContent = "This browser does not support Web Speech Recognition. Use Chrome or Edge, or press Simulate Wake.";
    logLine("speech recognition unavailable in this browser", "danger");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const phrase = event.results[i][0].transcript.trim();
      if (event.results[i].isFinal) {
        finalText += phrase;
      } else {
        interimText += phrase;
      }
    }

    if (interimText) {
      transcript.textContent = interimText;
    }

    if (finalText) {
      handleSpeech(finalText);
    }
  };

  recognition.onend = () => {
    if (listening) {
      recognition.start();
    }
  };

  recognition.onerror = (event) => {
    logLine(`speech error: ${event.error}`, "danger");
  };
}

async function setupAudio() {
  if (audioContext) {
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  audioData = new Uint8Array(analyser.frequencyBinCount);
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  readMicLevel();
}

function readMicLevel() {
  if (!analyser) {
    requestAnimationFrame(readMicLevel);
    return;
  }

  analyser.getByteFrequencyData(audioData);
  const average = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
  micLevel = Math.min(1, average / 96);
  const value = Math.round(micLevel * 100);
  voiceBar.style.setProperty("--level", `${value}%`);
  voiceValue.textContent = `${value}%`;
  requestAnimationFrame(readMicLevel);
}

async function startListening() {
  try {
    await setupAudio();
    listening = !listening;

    if (listening) {
      recognition?.start();
      listenBtn.textContent = "Stop Listening";
      logLine("microphone stream active");
      transcript.textContent = 'Listening. Say "Hey Jarvis" to activate.';
    } else {
      recognition?.stop();
      listenBtn.textContent = "Initiate Listening";
      logLine("microphone listener paused", "warn");
    }
  } catch (error) {
    logLine(`microphone blocked: ${error.message}`, "danger");
    transcript.textContent = "Microphone permission is needed for voice recognition and particle sync.";
  }
}

function speak(text) {
  if (!window.speechSynthesis) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 0.82;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function tickClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour12: false });

  const reactor = 64 + Math.round(Math.sin(Date.now() / 1400) * 5);
  const uplink = 43 + Math.round(Math.cos(Date.now() / 1700) * 7);
  reactorValue.textContent = `${reactor}%`;
  uplinkValue.textContent = `${uplink}%`;
}

function streamHackingLines() {
  const entry = hackerFeed[Math.floor(Math.random() * hackerFeed.length)];
  const type = awake && Math.random() > 0.72 ? "danger" : Math.random() > 0.72 ? "warn" : "ok";
  logLine(entry, type);
}

listenBtn.addEventListener("click", startListening);
simulateBtn.addEventListener("click", () => {
  transcript.textContent = "Hey Jarvis";
  setAwake(true, "Wake phrase simulated. Interface online.");
  speak("At your service.");
});

window.addEventListener("resize", resizeCanvas);

setupRecognition();
resizeCanvas();
drawCore();
bootTerminal();
tickClock();
window.setInterval(tickClock, 1000);
window.setInterval(streamHackingLines, 1800);
