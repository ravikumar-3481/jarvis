const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const canvas = document.querySelector("#particleCore");
const ctx = canvas.getContext("2d");
const listenBtn = document.querySelector("#listenBtn");
const simulateBtn = document.querySelector("#simulateBtn");
const portfolioBtn = document.querySelector("#portfolioBtn");
const geminiBtn = document.querySelector("#geminiBtn");
const newsBtn = document.querySelector("#newsBtn");
const launchLastBtn = document.querySelector("#launchLastBtn");
const apiModal = document.querySelector("#apiModal");
const geminiKeyInput = document.querySelector("#geminiKeyInput");
const saveGeminiKeyBtn = document.querySelector("#saveGeminiKeyBtn");
const skipGeminiKeyBtn = document.querySelector("#skipGeminiKeyBtn");
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

const USER_NAME = "Ravi";
const PORTFOLIO_URL = "https://profileravi.netlify.app/";
const API_BASE_URL = "http://127.0.0.1:8000";
const GEMINI_KEY_STORAGE = "jarvis_gemini_api_key";
let lastResolvedUrl = PORTFOLIO_URL;

const terminalLines = [
  ["Booting holographic kernel", "ok"],
  ["Scanning local voice bus", "ok"],
  ["Neural matrix handshake ready", "ok"],
  ["Encrypted uplink cloaked", "warn"],
  ["Awaiting phrase: HEY JARVIS", "ok"],
  ["Command pack loaded: portfolio, diagnostics, scan, news, gemini, standby", "ok"]
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

function openApiModal() {
  apiModal.classList.add("is-open");
  geminiKeyInput.value = localStorage.getItem(GEMINI_KEY_STORAGE) || "";
  window.setTimeout(() => geminiKeyInput.focus(), 80);
}

function closeApiModal() {
  apiModal.classList.remove("is-open");
}

function saveGeminiKey() {
  const key = geminiKeyInput.value.trim();

  if (!key) {
    logLine("Gemini key not saved: empty input", "warn");
    return;
  }

  localStorage.setItem(GEMINI_KEY_STORAGE, key);
  closeApiModal();
  logLine("Gemini key secured in browser storage");
  speak("Gemini neural channel connected.");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.error || "Backend request failed");
  }

  return data;
}

function getFormalGreeting() {
  const hour = new Date().getHours();
  const dayPart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${dayPart}, ${USER_NAME}. JARVIS interface online. Voice authentication accepted. Reactor core stable, network link protected, and all primary systems are ready for your command.`;
}

function runGreetingProtocol() {
  const greetingSteps = [
    ["voiceprint matched: Ravi", "ok"],
    ["formal greeting protocol active", "ok"],
    ["checking reactor output", "ok"],
    ["verifying portfolio launch channel", "ok"],
    ["all command modules standing by", "ok"]
  ];

  greetingSteps.forEach(([text, type], index) => {
    window.setTimeout(() => logLine(text, type), index * 330);
  });

  const greeting = getFormalGreeting();
  confidenceText.textContent = "Good to see you, sir";
  transcript.textContent = greeting;
  speak(greeting);
}

function openPortfolio() {
  logLine(`opening portfolio: ${PORTFOLIO_URL}`);
  confidenceText.textContent = "Portfolio channel";
  openUrl(PORTFOLIO_URL, "Opening your portfolio now.");
}

function openUrl(url, spokenText = "Opening website now.") {
  lastResolvedUrl = url;
  const opened = window.open(url, "_blank");
  if (!opened) {
    logLine("browser blocked the new tab. press Launch Last Site to continue.", "warn");
    speak("The browser blocked the new tab. Press Launch Last Site to continue.");
    return;
  }

  opened.opener = null;
  speak(spokenText);
}

function extractOpenTarget(normalized) {
  return normalized
    .replace(/^.*?\b(open|launch|go to|visit)\b/, "")
    .replace(/\b(website|web site|site|url|please|jarvis)\b/g, "")
    .trim();
}

async function openWebsiteBySearch(commandText) {
  const target = extractOpenTarget(commandText);

  if (!target) {
    speak("Which website should I open?");
    logLine("website command missing target", "warn");
    return;
  }

  if (target.includes("portfolio") || target.includes("ravi")) {
    openPortfolio();
    return;
  }

  confidenceText.textContent = "Resolving site";
  logLine(`searching web target: ${target}`);

  try {
    const result = await apiRequest("/api/resolve-site", {
      method: "POST",
      body: JSON.stringify({ query: target })
    });

    logLine(`resolved ${result.title || target}: ${result.url}`);
    openUrl(result.url, `Opening ${result.title || target}.`);
  } catch (error) {
    logLine(`site resolution failed: ${error.message}`, "danger");
    speak("I could not resolve that website from the backend.");
  }
}

function speakStatusReport() {
  const report = "Status report. Reactor core is stable. Neural uplink is encrypted. Voice matrix is active. Threat level remains low.";
  logLine("status report delivered: reactor stable, uplink encrypted, threat low");
  confidenceText.textContent = "Systems nominal";
  speak(report);
}

function runDefensiveScan() {
  threatText.textContent = "Elevated";
  modeText.textContent = "Defense Scan";
  confidenceText.textContent = "Scanning";
  logLine("defensive scan initialized", "danger");
  logLine("checking exposed endpoints", "warn");
  logLine("masking local telemetry", "ok");
  speak("Running a defensive scan. I will notify you if anything looks suspicious.");
}

function speakTime() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  logLine(`time request answered: ${date}, ${time}`);
  speak(`It is ${time} on ${date}.`);
}

function introduceJarvis() {
  logLine("identity module requested");
  speak("I am JARVIS, your voice activated interface for system status, portfolio launch, diagnostics, and tactical visual feedback.");
}

function clearTerminal() {
  terminal.innerHTML = "";
  logLine("command stream cleared");
  speak("Command stream cleared.");
}

async function searchNews(commandText = "latest technology news") {
  const query = commandText
    .replace(/\b(latest|news|search|about|for|jarvis|show|get|me|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "technology";

  confidenceText.textContent = "News uplink";
  logLine(`requesting real-time news: ${query}`);

  try {
    const result = await apiRequest(`/api/news?q=${encodeURIComponent(query)}`);
    const headlines = result.items.slice(0, 3);

    if (!headlines.length) {
      logLine("news uplink returned no headlines", "warn");
      speak("I could not find live headlines for that topic.");
      return;
    }

    headlines.forEach((item, index) => {
      logLine(`news ${index + 1}: ${item.title}`);
    });

    const summary = headlines.map((item, index) => `Headline ${index + 1}: ${item.title}`).join(". ");
    transcript.textContent = summary;
    speak(summary);
  } catch (error) {
    logLine(`news search failed: ${error.message}`, "danger");
    speak("The real-time news uplink is offline. Start the Python backend and try again.");
  }
}

async function askGemini(prompt) {
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE);

  if (!apiKey) {
    openApiModal();
    logLine("Gemini key required for AI generation", "warn");
    speak("Please paste your Gemini API key first.");
    return;
  }

  const cleanPrompt = prompt
    .replace(/\b(ask gemini|gemini|jarvis|answer|tell me)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanPrompt) {
    speak("What should I ask Gemini?");
    return;
  }

  confidenceText.textContent = "Gemini thinking";
  logLine(`Gemini request: ${cleanPrompt}`);

  try {
    const result = await apiRequest("/api/gemini/generate", {
      method: "POST",
      headers: {
        "X-Gemini-API-Key": apiKey
      },
      body: JSON.stringify({ prompt: cleanPrompt })
    });

    transcript.textContent = result.text;
    logLine(`Gemini: ${result.text.slice(0, 140)}${result.text.length > 140 ? "..." : ""}`);
    speak(result.text.slice(0, 240));
  } catch (error) {
    logLine(`Gemini request failed: ${error.message}`, "danger");
    speak("Gemini did not respond. Please check your API key and backend server.");
  }
}

async function handleSpeech(text) {
  const normalized = text.toLowerCase();
  transcript.textContent = text;

  if (normalized.includes("hey jarvis") || normalized.includes("hi jarvis")) {
    setAwake(true, "Wake phrase accepted. Interface online.");
    runGreetingProtocol();
    return;
  }

  if (!awake) {
    logLine(`ignored passive input: ${text}`, "warn");
    return;
  }

  if (normalized.includes("portfolio")) {
    openPortfolio();
  } else if (normalized.includes("open") || normalized.includes("launch") || normalized.includes("go to") || normalized.includes("visit")) {
    await openWebsiteBySearch(normalized);
  } else if (normalized.includes("news") || normalized.includes("headline")) {
    await searchNews(normalized);
  } else if (normalized.includes("gemini") || normalized.includes("answer") || normalized.includes("tell me")) {
    await askGemini(normalized);
  } else if (normalized.includes("status") || normalized.includes("diagnostic") || normalized.includes("report")) {
    speakStatusReport();
  } else if (normalized.includes("hack") || normalized.includes("scan")) {
    runDefensiveScan();
  } else if (normalized.includes("time") || normalized.includes("date")) {
    speakTime();
  } else if (normalized.includes("introduce") || normalized.includes("who are you")) {
    introduceJarvis();
  } else if (normalized.includes("clear")) {
    clearTerminal();
  } else if (normalized.includes("sleep") || normalized.includes("standby")) {
    setAwake(false, "Standby command accepted.");
    speak("Entering standby.");
  } else {
    logLine(`command parsed: ${text}`);
    await askGemini(normalized);
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
      void handleSpeech(finalText);
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
  runGreetingProtocol();
});
portfolioBtn.addEventListener("click", openPortfolio);
geminiBtn.addEventListener("click", openApiModal);
newsBtn.addEventListener("click", () => {
  void searchNews("latest technology news");
});
launchLastBtn.addEventListener("click", () => {
  openUrl(lastResolvedUrl, "Launching the resolved site.");
});
saveGeminiKeyBtn.addEventListener("click", saveGeminiKey);
skipGeminiKeyBtn.addEventListener("click", () => {
  closeApiModal();
  logLine("Gemini channel skipped. Local commands remain active.", "warn");
});
geminiKeyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveGeminiKey();
  }
});

window.addEventListener("resize", resizeCanvas);

setupRecognition();
resizeCanvas();
drawCore();
bootTerminal();
tickClock();
if (!localStorage.getItem(GEMINI_KEY_STORAGE)) {
  window.setTimeout(openApiModal, 650);
}
window.setInterval(tickClock, 1000);
window.setInterval(streamHackingLines, 1800);
