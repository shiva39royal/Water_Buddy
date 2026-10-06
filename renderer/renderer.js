const pet = document.getElementById('pet');
const spriteIdle = document.getElementById('sprite-idle');
const spriteDrinking = document.getElementById('sprite-drinking');
const spriteBroom = document.getElementById('sprite-broom');
const spriteBroomLeft = document.getElementById('sprite-broom-left');
const spriteCrying = document.getElementById('sprite-crying');
const spriteSad = document.getElementById('sprite-sad');
const avatarMenu = document.getElementById('avatar-menu');
const menuChangeAvatar = document.getElementById('menu-change-avatar');
const menuChangeName = document.getElementById('menu-change-name');
const menuChangeInterval = document.getElementById('menu-change-interval');

const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');
const buttons = document.getElementById('buttons');
const yesBtn = document.getElementById('yes-btn');
const snoozeBtn = document.getElementById('snooze-btn');
const confetti = document.getElementById('confetti');
const magicLayer = document.getElementById('magic-layer');

let busy = false; // ignore clicks while an animation is running
let currentName = ''; // set from the reminder payload each time avatar appears

const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// Personalised when a name is set, generic otherwise.
function promptFor(name) {
  if (name && name.trim()) {
    return `${name.trim()} 💧`;
  }
  return 'HYDRATE 💧';
}

function cheerFor() {
  return 'CHEERS! ✨';
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function showSprite(name) {
  spriteIdle.classList.toggle('hidden', name !== 'idle');
  spriteDrinking.classList.toggle('hidden', name !== 'drinking');
  spriteBroom.classList.toggle('hidden', name !== 'broom');
  spriteBroomLeft.classList.toggle('hidden', name !== 'broom-left');
  spriteCrying.classList.toggle('hidden', name !== 'crying');
  if (spriteSad) spriteSad.classList.toggle('hidden', name !== 'sad');
}

// ------------------------------------------------------------ walk in / out
async function walkIn() {
  showSprite('idle');
  pet.className = 'offstage';
  // force reflow so the transition runs from offstage position
  void pet.offsetWidth;
  pet.className = 'walking';
  await wait(1150);
  pet.className = '';
}

function showBubble(text, withButtons) {
  bubbleText.textContent = text;
  buttons.classList.toggle('hidden', !withButtons);
  bubble.classList.remove('hidden');
}

// -------------------------------------------------------------- celebration
function burstConfetti() {
  const glyphs = ['💧', '✨', '⚡', '🪄', '⭐', '🧹'];
  const colors = ['#ffd54f', '#4aa3df', '#ffb300', '#81d4fa', '#ffca28'];
  const count = 38;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const useGlyph = Math.random() < 0.6;
    if (useGlyph) {
      piece.textContent = glyphs[(Math.random() * glyphs.length) | 0];
    } else {
      piece.textContent = '■';
      piece.style.color = colors[(Math.random() * colors.length) | 0];
    }
    piece.style.left = Math.random() * 100 + '%';
    piece.style.setProperty('--dur', 0.9 + Math.random() * 0.9 + 's');
    piece.style.setProperty('--fall', 280 + Math.random() * 160 + 'px');
    piece.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
    piece.style.animationDelay = Math.random() * 0.25 + 's';
    confetti.appendChild(piece);
    setTimeout(() => piece.remove(), 2200);
  }
}

// Golden magic sparklers for broom summoning
function emitMagicSparks(x, y, count = 10) {
  if (!magicLayer) return;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('div');
    spark.className = 'magic-spark';
    spark.style.left = (x + (Math.random() - 0.5) * 24) + 'px';
    spark.style.top = (y + (Math.random() - 0.5) * 24) + 'px';
    const angle = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 45;
    spark.style.setProperty('--vx', Math.cos(angle) * dist + 'px');
    spark.style.setProperty('--vy', Math.sin(angle) * dist + 'px');
    spark.style.setProperty('--dur', (0.4 + Math.random() * 0.35) + 's');
    magicLayer.appendChild(spark);
    setTimeout(() => spark.remove(), 800);
  }
}

// Dropping sparkles trailing from the broom feather/bristle side
function emitFeatherSparkle(x, y) {
  if (!magicLayer) return;
  const count = 3;
  const colors = [
    'radial-gradient(circle, #ffffff 15%, #ffd700 60%, rgba(255, 152, 0, 0) 100%)',
    'radial-gradient(circle, #ffffff 20%, #ffe082 60%, rgba(255, 213, 79, 0) 100%)',
    'radial-gradient(circle, #e0f7fa 20%, #80d8ff 60%, rgba(0, 176, 255, 0) 100%)',
  ];

  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'feather-sparkle';
    const size = 7 + Math.random() * 8;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = (x + (Math.random() - 0.5) * 16) + 'px';
    s.style.top = (y + (Math.random() - 0.5) * 16) + 'px';
    s.style.background = colors[(Math.random() * colors.length) | 0];

    // Dropping downwards with slight drift
    const vx = (Math.random() - 0.5) * 26 + 'px';
    const vy = (18 + Math.random() * 32) + 'px'; // gravity drop
    s.style.setProperty('--vx', vx);
    s.style.setProperty('--vy', vy);
    s.style.setProperty('--dur', (0.5 + Math.random() * 0.4) + 's');

    magicLayer.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

// Falling teardrops for crying animation
function emitFallingTear(petRect) {
  if (!magicLayer) return;

  // Tears stream from BOTH left eye (~41% width) and right eye (~59% width)
  const eyePositions = [
    petRect.left + petRect.width * (0.41 + (Math.random() - 0.5) * 0.04),
    petRect.left + petRect.width * (0.59 + (Math.random() - 0.5) * 0.04),
  ];

  const eyeY = petRect.top + petRect.height * 0.44;
  const floorY = petRect.bottom - 12;
  const dropDist = Math.max(65, floorY - eyeY);

  eyePositions.forEach((eyeX) => {
    const tear = document.createElement('div');
    tear.className = 'falling-tear';
    tear.style.left = eyeX + 'px';
    tear.style.top = eyeY + 'px';
    tear.style.setProperty('--dist', dropDist + 'px');
    tear.style.setProperty('--dur', (0.55 + Math.random() * 0.20) + 's');
    magicLayer.appendChild(tear);
    setTimeout(() => tear.remove(), 900);
  });
}

// ------------------------------------------------------------------- Fullscreen Rail Flight Engine
/**
 * Parametric Harry Potter flight rail covering the ENTIRE PC MONITOR SCREEN:
 * - 0.00 to 0.08: Fast liftoff from bottom-right into orbit
 * - 0.08 to 0.78: Exactly 2.32 fast, soaring rounds across the entire PC monitor screen
 * - 0.78 to 1.00: Accelerates cleanly along tangent vector directly out the top-left corner of the monitor
 */
function getScreenRailPoint(p, W, H, startX, startY) {
  const cx = W * 0.5;
  const cy = H * 0.5;
  const rx = W * 0.43;
  const ry = H * 0.39;
  const theta0 = 0.28 * Math.PI; // bottom-right orbit insertion angle

  if (p < 0.08) {
    // Phase 1: Fast liftoff from (startX, startY) into orbit
    const t = p / 0.08;
    const s = t * t * (3 - 2 * t);
    const orbitStartX = cx + rx * Math.cos(theta0);
    const orbitStartY = cy + ry * Math.sin(theta0);
    return {
      x: (1 - s) * startX + s * orbitStartX,
      y: (1 - s) * startY + s * orbitStartY,
    };
  } else if (p < 0.78) {
    // Phase 2: Fast soaring rounds across the entire PC monitor screen
    const t = (p - 0.08) / (0.78 - 0.08);
    // 2 full loops plus sweep to 0.92 * Math.PI so exit tangent points directly UP-LEFT
    const totalSweep = 2 * (2 * Math.PI) + (0.92 * Math.PI - theta0);
    const theta = theta0 + t * totalSweep;
    return {
      x: cx + rx * Math.cos(theta),
      y: cy + ry * Math.sin(theta),
    };
  } else {
    // Phase 3: Final rocket acceleration straight out the TOP-LEFT corner of the PC monitor
    const t = (p - 0.78) / (1.0 - 0.78);
    const thetaEnd = theta0 + (2 * (2 * Math.PI) + (0.92 * Math.PI - theta0));
    const exitStartX = cx + rx * Math.cos(thetaEnd);
    const exitStartY = cy + ry * Math.sin(thetaEnd);
    const targetX = -320;
    const targetY = -320;

    const accel = Math.pow(t, 1.25);
    return {
      x: exitStartX + (targetX - exitStartX) * accel,
      y: exitStartY + (targetY - exitStartY) * accel,
    };
  }
}

function runFullScreenRailFlight(screenInfo) {
  return new Promise((resolve) => {
    const W = (screenInfo && screenInfo.screenWidth) || window.innerWidth || 1920;
    const H = (screenInfo && screenInfo.screenHeight) || window.innerHeight || 1080;
    const edgeMargin = (screenInfo && screenInfo.edgeMargin) || 8;

    // Start position in screen coordinates (where pet was sitting)
    const startX = W - edgeMargin - 95;
    const startY = H - edgeMargin - 136;

    pet.className = 'in-flight';
    pet.style.position = 'fixed';
    pet.style.right = 'auto';
    pet.style.bottom = 'auto';
    pet.style.left = (startX - 78) + 'px';
    pet.style.top = (startY - 136) + 'px';
    pet.style.opacity = '1';

    const duration = 4800; // 4.8 seconds: reduced speed, smooth and cinematic Harry Potter flight
    const startTime = performance.now();
    let lastSparkleTime = 0;
    let currentFacing = 'left';

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const pt = getScreenRailPoint(progress, W, H, startX, startY);
      const nextPt = getScreenRailPoint(Math.min(1, progress + 0.006), W, H, startX, startY);
      const vx = nextPt.x - pt.x;
      const vy = nextPt.y - pt.y;
      const headingDeg = (Math.atan2(vy, vx) * 180) / Math.PI;

      // Hysteresis prevents sprite flickering at horizontal direction changes
      if (vx > 1.2) {
        currentFacing = 'right';
      } else if (vx < -1.2) {
        currentFacing = 'left';
      }

      let tilt = 0;
      if (currentFacing === 'right') {
        showSprite('broom');
        tilt = headingDeg + 40;
        tilt = Math.max(-45, Math.min(55, tilt));
      } else {
        showSprite('broom-left');
        let norm = headingDeg;
        if (norm > 0) norm -= 360;
        tilt = norm + 140;
        tilt = Math.max(-55, Math.min(45, tilt));
      }

      // Fading out as it leaves the top-left corner
      let opacity = 1;
      if (progress > 0.90) {
        opacity = Math.max(0, 1 - (progress - 0.90) / 0.10);
      }

      pet.style.left = (pt.x - 78) + 'px';
      pet.style.top = (pt.y - 136) + 'px';
      pet.style.transform = `rotate(${tilt}deg)`;
      pet.style.opacity = opacity;

      // Drop sparkles continuously from the broom feather/bristle side
      if (now - lastSparkleTime > 24) {
        lastSparkleTime = now;
        const rad = (tilt * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        // Unrotated offset of bristles relative to pet center (pt.x, pt.y)
        const ox = currentFacing === 'right' ? -45 : 45;
        const oy = 65;
        const bristleX = pt.x + (ox * cos - oy * sin);
        const bristleY = pt.y + (ox * sin + oy * cos);
        emitFeatherSparkle(bristleX, bristleY, 2);
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        pet.style.position = '';
        pet.style.left = '';
        pet.style.top = '';
        pet.style.right = '';
        pet.style.bottom = '';
        pet.style.transform = '';
        pet.style.opacity = '';
        pet.className = 'offstage';
        showSprite('idle');
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

// ------------------------------------------------------------------- flow
async function runReminder(name) {
  if (busy) return;
  busy = true;
  currentName = name || '';
  await loadSprites();
  await walkIn();
  showBubble(promptFor(currentName), true);
  busy = false;
}

// YES: Celebrates, mounts Harry Potter broomstick, zooms across the ENTIRE PC SCREEN for 2+ rounds, then exits top-left!
async function onYes() {
  if (busy) return;
  busy = true;

  window.hydrate.yes(); // schedule the next nudge (+45 min)
  showBubble(cheerFor(currentName), false);
  showSprite('drinking'); // quick celebratory sip
  await wait(750);

  // Mount magical broomstick facing left
  showSprite('broom-left');
  burstConfetti();

  const rect = pet.getBoundingClientRect();
  emitMagicSparks(rect.left + rect.width / 2, rect.top + rect.height * 0.6, 18);
  await wait(450);

  bubble.classList.add('hidden');

  // Expand window to the ENTIRE PC SCREEN (no boundary restriction!)
  const screenInfo = await window.hydrate.startFlight();
  // Brief tick for Chromium window layout reflow
  await wait(60);

  // Fast movie rail flight across the whole monitor!
  await runFullScreenRailFlight(screenInfo);

  window.hydrate.hide();
  busy = false;
}

// SNOOZE: Sits down and cries for 5 seconds with dropping tears, then stands up and exits left
async function onSnooze() {
  if (busy) return;
  busy = true;

  window.hydrate.snooze(); // reschedule in 5 minutes!
  showBubble('5 MINS... 💧', false);

  // Transition to seated cry
  showSprite('crying');
  pet.classList.add('crying');

  // Emit realistic falling tears continuously during the 5 seconds
  const tearInterval = setInterval(() => {
    const r = pet.getBoundingClientRect();
    emitFallingTear(r);
  }, 190);

  // Precisely 5.0 seconds of sitting and crying
  await wait(5000);
  clearInterval(tearInterval);

  pet.classList.remove('crying');

  // Stand back up bent forward in dull sadness (no cup!)
  showSprite('sad');
  showBubble('5 MINS... 💧', false);
  await wait(800);
  bubble.classList.add('hidden');

  // Walk back slowly with sad, bent, dull mode to where it came from (right side)
  pet.className = 'dull-exit';

  await wait(2150);

  pet.className = 'offstage';
  pet.style.filter = '';
  showSprite('idle');
  window.hydrate.hide();
  busy = false;
}

yesBtn.addEventListener('click', onYes);
snoozeBtn.addEventListener('click', onSnooze);

// Triggered by the main process
window.hydrate.onShow((payload) => runReminder(payload && payload.name));

// Load sprites for the active character (Business Woman or Business Man)
async function loadSprites() {
  try {
    const s = await window.hydrate.getSprites();
    if (s && s.idle && s.drinking) {
      spriteIdle.src = s.idle;
      spriteDrinking.src = s.drinking;
      spriteBroom.src = s.broom || '../assets/broom.png';
      spriteBroomLeft.src = s.broomLeft || '../assets/broom_left.png';
      spriteCrying.src = s.crying || '../assets/crying.png';
      if (spriteSad) spriteSad.src = s.sad || '../assets/sad.png';
      return;
    }
  } catch (e) {
    /* fall back to defaults */
  }
  spriteIdle.src = '../assets/idle.png';
  spriteDrinking.src = '../assets/drinking.png';
  spriteBroom.src = '../assets/broom.png';
  spriteBroomLeft.src = '../assets/broom_left.png';
  spriteCrying.src = '../assets/crying.png';
  if (spriteSad) spriteSad.src = '../assets/sad.png';
}

loadSprites();
if (window.hydrate.onSpritesChanged) {
  window.hydrate.onSpritesChanged(loadSprites);
}

// Right-click on avatar opens context menu for changing avatar & name
pet.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (avatarMenu) avatarMenu.classList.remove('hidden');
});

if (menuChangeAvatar) {
  menuChangeAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    if (avatarMenu) avatarMenu.classList.add('hidden');
    if (window.hydrate && window.hydrate.openCharacterWindow) {
      window.hydrate.openCharacterWindow();
    }
  });
}

if (menuChangeName) {
  menuChangeName.addEventListener('click', (e) => {
    e.stopPropagation();
    if (avatarMenu) avatarMenu.classList.add('hidden');
    if (window.hydrate && window.hydrate.openNameWindow) {
      window.hydrate.openNameWindow();
    }
  });
}


if (menuChangeInterval) {
  menuChangeInterval.addEventListener('click', (e) => {
    e.stopPropagation();
    if (avatarMenu) avatarMenu.classList.add('hidden');
    if (window.hydrate && window.hydrate.openIntervalWindow) {
      window.hydrate.openIntervalWindow();
    }
  });
}

document.addEventListener('click', (e) => {
  if (avatarMenu && !avatarMenu.contains(e.target)) {
    avatarMenu.classList.add('hidden');
  }
});
