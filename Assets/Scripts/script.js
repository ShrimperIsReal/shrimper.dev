const overlay = document.querySelector('.UIOverlay');
const volumeSlider = document.getElementById('volumeSlider');
const volIcon = document.getElementById('volIcon');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const selectSelected = document.getElementById('selectSelected');
const selectItems = document.getElementById('selectItems');

let audio, audioCtx, source, gainNode, convolver, dryGain, wetGain, animFrame;

const BAR_COUNT = 18;
const bars = Array.from({length: BAR_COUNT}, () => ({
  h: Math.random() * 0.3 + 0.05, target: Math.random() * 0.5 + 0.1, vel: 0
}));

function animateViz() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const speed = audio ? audio.playbackRate : 1;
  const bw = (canvas.width - (BAR_COUNT - 1) * 2) / BAR_COUNT;
  bars.forEach((b, i) => {
    if (Math.random() < 0.04 * speed) b.target = Math.random() * 0.9 + 0.05;
    b.vel += (b.target - b.h) * 0.18;
    b.vel *= 0.72;
    b.h = Math.max(0.04, Math.min(1, b.h + b.vel));
    const barH = b.h * canvas.height;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + b.h * 0.6})`;
    ctx.beginPath();
    ctx.roundRect(i * (bw + 2), canvas.height - barH, bw, barH, 1.5);
    ctx.fill();
  });
  animFrame = requestAnimationFrame(animateViz);
}

function makeReverb(actx, duration = 2.5, decay = 3.0) {
  const rate = actx.sampleRate;
  const length = rate * duration;
  const impulse = actx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const ch = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

overlay.addEventListener('click', async () => {
  overlay.style.display = 'none';

  audio = new Audio('Assets/music.wav');
  audio.loop = true;
  audio.crossOrigin = 'anonymous';

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  source = audioCtx.createMediaElementSource(audio);

  gainNode = audioCtx.createGain();
  gainNode.gain.value = 1;

  convolver = audioCtx.createConvolver();

  dryGain = audioCtx.createGain();
  dryGain.gain.value = 1;

  wetGain = audioCtx.createGain();
  wetGain.gain.value = 0;

  source.connect(gainNode);
  gainNode.connect(dryGain);
  gainNode.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(audioCtx.destination);
  wetGain.connect(audioCtx.destination);

  try {
    const resp = await fetch('https://cdn.jsdelivr.net/gh/nicholasgasior/audio-ir-library@main/ir/hall.wav');
    const arrayBuffer = await resp.arrayBuffer();
    convolver.buffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    convolver.buffer = makeReverb(audioCtx);
  }

  audio.play();
  animateViz();
});

volumeSlider.addEventListener('input', () => {
  const v = parseFloat(volumeSlider.value);
  if (gainNode) gainNode.gain.value = v;
  volIcon.textContent = v === 0 ? '🔇' : v < 0.4 ? '🔈' : v < 0.7 ? '🔉' : '🔊';

  if (wetGain && dryGain) {
    wetGain.gain.value = v;
    dryGain.gain.value = 1 - (v * 0.6);
  }
});

document.querySelectorAll('.select-item').forEach(item => {
  item.addEventListener('click', () => {
    selectSelected.textContent = item.textContent;
    document.querySelectorAll('.select-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    selectItems.classList.remove('open');
    if (audio) audio.playbackRate = parseFloat(item.dataset.val);
  });
});

selectSelected.addEventListener('click', e => {
  e.stopPropagation();
  selectItems.classList.toggle('open');
});

document.addEventListener('click', () => selectItems.classList.remove('open'));

const snowContainer = document.getElementById('snow');

function createSnowflake() {
  const flake = document.createElement('div');

  const size = Math.random() * 4 + 2;
  const startX = Math.random() * window.innerWidth;
  const driftX = (Math.random() - 0.5) * 160;
  const duration = Math.random() * 6 + 8;
  const peakOpacity = Math.random() * 0.5 + 0.35;

  flake.classList.add('snowflake');

  if (size < 3.2) {
    flake.classList.add('small');
  } else if (size < 4.8) {
    flake.classList.add('medium');
  } else {
    flake.classList.add('large');
  }

  flake.style.setProperty('--size', `${size}px`);
  flake.style.setProperty('--start-x', `${startX}px`);
  flake.style.setProperty('--drift-x', `${driftX}px`);
  flake.style.setProperty('--duration', `${duration}s`);
  flake.style.setProperty('--peak-opacity', peakOpacity);

  flake.style.top = `${-(Math.random() * 120 + 20)}px`;

  snowContainer.appendChild(flake);

  flake.addEventListener('animationend', () => {
    flake.remove();
  });
}

function startSnow() {
  for (let i = 0; i < 70; i++) {
    setTimeout(createSnowflake, Math.random() * 5000);
  }

  function scheduleNextFlake() {
    createSnowflake();

    const nextSpawn = Math.random() * 120 + 40; 

    setTimeout(scheduleNextFlake, nextSpawn);
  }

  scheduleNextFlake();
}

startSnow();
