
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const coinElement = document.getElementById('coinCount');
    let totalCoins = parseInt(localStorage.getItem('doodle_coins')) || 0;
    const playButton = document.getElementById('playButton');
    const playAgainButton = document.getElementById('playAgainButton');
    const mainMenu = document.getElementById('mainMenu');
    const gameOverMenu = document.getElementById('gameOverMenu');
    const finalScoreEl = document.getElementById('finalScore');
    const finalBestScoreEl = document.getElementById('finalBestScore');
    const bestScoreLabel = document.getElementById('bestScoreLabel');
    const connectButton = document.getElementById('connectButton');
    const loadingCover = document.getElementById('loadingCover');

    let state = 'MENU';
    let score = 0;
    let bestScore = parseInt(localStorage.getItem('doodle_best_score')) || 0;

    const gravity = 0.4;
    const bounceVelocity = -11;
    const playerSpeed = 0.8;
    const friction = 0.85;

    let player = { x: 0, y: 0, w: 40, h: 40, vx: 0, vy: 0, squashTimer: 0, isFlying: false, flightTimer: 0 };
    let platforms = [];
    let monsters = [];
    let currentTheme = "normal";
    let quests = { jumps: 0, coins: 0 };
    let hasShield = false;

    let keys = { left: false, right: false };
    let touchX = null;
    let tiltX = 0;

    let dpr = window.devicePixelRatio || 1;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;
    let animationFrameId;

    bestScoreLabel.textContent = `best: ${bestScore.toLocaleString()}`;
    scoreElement.textContent = score;
    if (coinElement) coinElement.textContent = totalCoins;

    function initGame() {
      score = 0;
      scoreElement.textContent = score;
      if (coinElement) coinElement.textContent = totalCoins;
      document.getElementById('questStatus').textContent = 'Jumps: 0/100';
      canvasWidth = canvas.clientWidth;
      canvasHeight = canvas.clientHeight;

      player = {
        x: canvasWidth / 2 - 20,
        y: canvasHeight / 2,
        w: 40,
        h: 40,
        vx: 0,
        vy: 0,
        squashTimer: 0,
        isFlying: false,
        flightTimer: 0
      };

      platforms = [];
      monsters = [];
      currentTheme = "normal";
      quests = { jumps: 0, coins: 0 };
      hasShield = false;
      const platformCount = 10;
      const platformSpacing = canvasHeight / platformCount;

      for (let i = 0; i < platformCount; i++) {
        const py = canvasHeight - i * platformSpacing;
        const px = (i === 1) ? player.x - 12.5 : Math.random() * (canvasWidth - 65);
        let rType = Math.random();
        let type = 'static';
        if (rType < 0.2) type = 'moving';
        else if (rType < 0.3) type = 'breaking';
        else if (rType < 0.4) type = 'disappearing';
        
        let powerup = null;
        if (i !== 1) { // No powerup on spawn
          const r = Math.random();
          if (r < 0.03) powerup = 'helicopter';
          else if (r < 0.05) powerup = 'jetpack';
          else if (r < 0.07) powerup = 'shield';
          else if (r < 0.17) powerup = 'spring';
          
          if (Math.random() < 0.05) {
             monsters.push({ x: px + 12, y: py - 40, w: 40, h: 40, vx: Math.random() < 0.5 ? 1 : -1, type: 'monster' });
          }
        }
        platforms.push({ x: px, y: py, w: 65, h: 15, type: type, vx: type === 'moving' ? (Math.random() < 0.5 ? 2 : -2) : 0, powerup: powerup });
      }
    }

    function handleOrientation(e) {
      if (e.gamma !== null) {
        // Gamma is the left-to-right tilt in degrees
        let gamma = e.gamma;
        // Clamp gamma between -45 and 45 degrees
        if (gamma > 45) gamma = 45;
        if (gamma < -45) gamma = -45;
        // Normalize to [-1, 1]
        tiltX = gamma / 45;
      }
    }

    function startGame() {
      // Request device orientation permissions if necessary (iOS 13+)
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }

      state = 'PLAYING';
      mainMenu.classList.add('hidden');
      gameOverMenu.classList.add('hidden');
      initGame();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      gameLoop();
    }

    function gameOver() {
      state = 'GAMEOVER';
      if (score > bestScore) {
        bestScore = Math.floor(score);
        localStorage.setItem('doodle_best_score', bestScore);
        bestScoreLabel.textContent = `best: ${bestScore.toLocaleString()}`;
      }

      const activeWallet = localStorage.getItem('doodle_active_wallet');
      if (activeWallet) {
        const payload = {
          finalScore: Math.floor(score),
          bestScore: bestScore,
          walletAddress: activeWallet
        };
        localStorage.setItem('pending_airdrop_payload', JSON.stringify(payload));
      }

      finalScoreEl.textContent = Math.floor(score).toLocaleString();
      finalBestScoreEl.textContent = bestScore.toLocaleString();
      gameOverMenu.classList.remove('hidden');
    }

    function updatePhysics() {
      if (state !== 'PLAYING') return;

      if (keys.left) player.vx -= playerSpeed;
      if (keys.right) player.vx += playerSpeed;

      if (touchX !== null) {
        if (touchX < window.innerWidth / 2) player.vx -= playerSpeed;
        else player.vx += playerSpeed;
      }

      if (tiltX !== 0) {
        player.vx += tiltX * playerSpeed * 1.5;
      }

      player.vx *= friction;
      player.x += player.vx;

      if (player.x + player.w < 0) player.x = canvasWidth;
      else if (player.x > canvasWidth) player.x = -player.w;

      if (player.isFlying) {
        player.vy = -14;
        if (performance.now() - player.flightTimer > 3500) {
          player.isFlying = false;
        }
      } else {
        player.vy += gravity;
      }
      player.y += player.vy;

      if (player.vy > 0 && !player.isFlying) {
        for (let p of platforms) {
          if (p.disappeared) continue;
          if (
            player.x + player.w > p.x &&
            player.x < p.x + p.w &&
            player.y + player.h > p.y &&
            player.y + player.h < p.y + p.h + player.vy
          ) {
            if (p.type === 'breaking') {
              p.isBreaking = true;
              p.vy = 4;
              continue; // Fall through
            }
            if (p.type === 'disappearing') {
              p.disappeared = true;
            }

            if (p.powerup === 'spring') {
              player.vy = -22;
              p.powerup = null;
              player.squashTimer = performance.now();
            } else if (p.powerup === 'helicopter') {
              player.isFlying = true;
              player.flightTimer = performance.now();
              p.powerup = null;
            } else if (p.powerup === 'jetpack') {
              player.isFlying = true;
              player.vy = -20; // Faster
              player.flightTimer = performance.now() + 1000; // longer
              p.powerup = null;
            } else if (p.powerup === 'shield') {
              hasShield = true;
              player.vy = bounceVelocity;
              player.squashTimer = performance.now();
              p.powerup = null;
            } else {
              player.vy = bounceVelocity;
              player.squashTimer = performance.now();
            }
            quests.jumps++;
            break;
          }
        }
      }

      const midpoint = canvasHeight * 0.45;
      if (player.y < midpoint) {
        const scrollOffset = midpoint - player.y;
        player.y = midpoint;
        score += scrollOffset;
        scoreElement.textContent = Math.floor(score).toLocaleString();

        for (let p of platforms) {
          p.y += scrollOffset;
        }
        for (let m of monsters) {
          m.y += scrollOffset;
        }
      }

      let highestY = canvasHeight;
      for (let i = platforms.length - 1; i >= 0; i--) {
        let p = platforms[i];
        if (p.type === 'moving') {
          p.x += p.vx;
          if (p.x < 0 || p.x + p.w > canvasWidth) p.vx *= -1;
        }
        if (p.isBreaking) {
          p.y += p.vy;
          p.vy += gravity;
        }

        if (p.y > canvasHeight) {
          platforms.splice(i, 1);
        } else {
          if (p.y < highestY) highestY = p.y;
        }
      }

      while (highestY > -50) {
        const py = highestY - (Math.random() * 40 + 50);
        const px = Math.random() * (canvasWidth - 65);
        let rType = Math.random();
        let type = 'static';
        if (rType < 0.2) type = 'moving';
        else if (rType < 0.3) type = 'breaking';
        else if (rType < 0.4) type = 'disappearing';
        
        let powerup = null;
        const r = Math.random();
        if (r < 0.03) powerup = 'helicopter';
        else if (r < 0.05) powerup = 'jetpack';
        else if (r < 0.07) powerup = 'shield';
        else if (r < 0.17) powerup = 'spring';
        
        if (Math.random() < 0.05) {
           monsters.push({ x: px + 12, y: py - 40, w: 40, h: 40, vx: Math.random() < 0.5 ? 1 : -1, type: 'monster' });
        }
        platforms.push({ x: px, y: py, w: 65, h: 15, type: type, vx: type === 'moving' ? (Math.random() < 0.5 ? 2 : -2) : 0, powerup: powerup });
        highestY = py;
      }

      if (player.y > canvasHeight) {
        gameOver();
      }
      
      for (let i = monsters.length - 1; i >= 0; i--) {
        let m = monsters[i];
        m.x += m.vx;
        if (m.x < 0 || m.x + m.w > canvasWidth) m.vx *= -1;
        
        if (m.y > canvasHeight) {
          monsters.splice(i, 1);
          continue;
        }

        if (
          player.x + player.w > m.x &&
          player.x < m.x + m.w &&
          player.y + player.h > m.y &&
          player.y < m.y + m.h
        ) {
          if (player.vy > 0 && player.y + player.h < m.y + m.h / 2) {
             monsters.splice(i, 1);
             player.vy = bounceVelocity;
          } else {
             if (hasShield || player.isFlying) {
                monsters.splice(i, 1);
                hasShield = false;
             } else {
                gameOver();
             }
          }
        }
      }
    }

    function drawMenuBackground() {
      if (currentTheme === 'space') {
         context.fillStyle = '#112233';
         context.fillRect(0, 0, canvasWidth, canvasHeight);
         context.fillStyle = 'white';
         for(let i=0; i<50; i++) {
             context.fillRect(Math.random()*canvasWidth, Math.random()*canvasHeight, 2, 2);
         }
      }
      if (state !== 'MENU') return;
      context.strokeStyle = '#496f98';
      context.lineWidth = 2;
      context.globalAlpha = .2;
      context.beginPath();
      context.moveTo(canvasWidth * .18, canvasHeight * .69);
      context.lineTo(canvasWidth * .34, canvasHeight * .65);
      context.lineTo(canvasWidth * .5, canvasHeight * .68);
      context.stroke();
      context.globalAlpha = 1;

      context.fillStyle = '#789cce';
      context.beginPath();
      context.arc(canvasWidth * .22, canvasHeight * .22, 34, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#2f537d';
      context.stroke();

      context.fillStyle = '#f7eee0';
      context.beginPath();
      context.arc(canvasWidth * .21, canvasHeight * .215, 27, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#2f537d';
      context.font = "700 11px 'Patrick Hand'";
      context.fillText('SKY', canvasWidth * .18, canvasHeight * .22);
    }

    function drawPlatform(p) {
      if (p.disappeared) return;
      context.fillStyle = p.type === 'moving' ? '#6296b5' : (p.type === 'breaking' ? '#b58562' : (p.type === 'disappearing' ? '#ffffff' : '#78ab46'));
      context.strokeStyle = p.type === 'moving' ? '#4a7692' : (p.type === 'breaking' ? '#8a5c3d' : (p.type === 'disappearing' ? '#cccccc' : '#5c8734'));
      context.lineWidth = 2.5;

      context.beginPath();
      if (context.roundRect) {
        context.roundRect(p.x, p.y, p.w, p.h, 5);
      } else {
        context.rect(p.x, p.y, p.w, p.h);
      }
      context.fill();
      context.stroke();

      context.strokeStyle = p.type === 'moving' ? '#4a7692' : (p.type === 'breaking' ? '#8a5c3d' : (p.type === 'disappearing' ? '#cccccc' : '#5c8734'));
      context.lineWidth = 1;
      context.beginPath();
      for (let i = 8; i < p.w - 5; i += 12) {
        context.moveTo(p.x + i, p.y + 3);
        context.lineTo(p.x + i + 2, p.y + p.h - 3);
      }
      context.stroke();
      
      if (p.powerup === 'spring') {
        context.strokeStyle = '#8291a1';
        context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(p.x + 25, p.y);
        context.lineTo(p.x + 35, p.y - 4);
        context.lineTo(p.x + 25, p.y - 8);
        context.lineTo(p.x + 35, p.y - 12);
        context.stroke();
      } else if (p.powerup === 'jetpack') {
        context.fillStyle = '#888';
        context.fillRect(p.x + 25, p.y - 15, 15, 20);
        context.fillStyle = '#f00';
        context.fillRect(p.x + 28, p.y + 5, 9, 5);
      } else if (p.powerup === 'shield') {
        context.strokeStyle = '#0ff';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(p.x + p.w/2, p.y - 10, 10, 0, Math.PI * 2);
        context.stroke();
      } else if (p.powerup === 'helicopter') {
        context.fillStyle = '#db6e59';
        context.strokeStyle = '#2f537d';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(p.x + 32, p.y, 8, Math.PI, 0);
        context.fill();
        context.stroke();
        context.beginPath();
        context.moveTo(p.x + 22, p.y);
        context.lineTo(p.x + 42, p.y);
        context.stroke();
        context.beginPath();
        context.moveTo(p.x + 32, p.y - 8);
        context.lineTo(p.x + 32, p.y - 12);
        context.moveTo(p.x + 24, p.y - 12);
        context.lineTo(p.x + 40, p.y - 12);
        context.stroke();
      }
    }

    function drawPlayer() {
      const now = performance.now();
      let scaleX = 1;
      let scaleY = 1;

      if (now - player.squashTimer < 80) {
        scaleX = 1.15;
        scaleY = 0.85;
      }

      context.save();
      context.translate(player.x + player.w / 2, player.y + player.h / 2);
      context.scale(scaleX, scaleY);

      context.fillStyle = '#8cc63f';
      context.strokeStyle = '#2f537d';
      context.lineWidth = 2.5;

      context.beginPath();
      if (context.roundRect) {
        context.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 15);
      } else {
        context.rect(-player.w / 2, -player.h / 2, player.w, player.h);
      }
      context.fill();
      context.stroke();

      const snoutDir = player.vx < 0 ? -1 : 1;
      context.beginPath();
      context.arc(snoutDir * 18, -2, 8, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = '#2f537d';
      context.beginPath();
      context.arc(snoutDir * 12, -7, 3, 0, Math.PI * 2);
      context.fill();

      if (hasShield) {
        context.strokeStyle = '#0ff';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(player.w/2, player.h/2, 35, 0, Math.PI * 2);
        context.stroke();
      }
      if (player.isFlying) {
        context.fillStyle = '#db6e59';
        context.strokeStyle = '#2f537d';
        context.lineWidth = 2;
        
        context.beginPath();
        context.arc(0, -player.h/2 - 2, 10, Math.PI, 0);
        context.fill();
        context.stroke();
        
        context.beginPath();
        context.moveTo(-15, -player.h/2 - 2);
        context.lineTo(15, -player.h/2 - 2);
        context.stroke();
        
        context.beginPath();
        context.moveTo(0, -player.h/2 - 12);
        context.lineTo(0, -player.h/2 - 18);
        context.stroke();
        
        context.save();
        context.translate(0, -player.h/2 - 18);
        context.rotate(performance.now() / 20);
        context.beginPath();
        context.moveTo(-15, 0);
        context.lineTo(15, 0);
        context.stroke();
        context.restore();
      }

      context.restore();
    }

    function draw() {
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      
      if (score > 1000) currentTheme = 'space'; else currentTheme = 'normal';

      if (currentTheme === 'space') {
         context.fillStyle = '#0b1320';
         context.fillRect(0, 0, canvasWidth, canvasHeight);
         context.fillStyle = '#ffffff';
         for(let i=0; i<30; i++) {
            let sx = (Math.sin(i*123) * 0.5 + 0.5) * canvasWidth;
            let sy = (Math.cos(i*321) * 0.5 + 0.5) * canvasHeight;
            context.fillRect(sx, sy, 2, 2);
         }
      }

      if (state === 'MENU') {
        if (currentTheme !== 'space') drawMenuBackground();
      } else {
        for (let p of platforms) {
          drawPlatform(p);
        }
        for (let m of monsters) {
          context.fillStyle = '#8a2be2';
          context.beginPath();
          context.arc(m.x + m.w/2, m.y + m.h/2, m.w/2, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = 'white';
          context.beginPath();
          context.arc(m.x + m.w/2 - 8, m.y + m.h/2 - 5, 4, 0, Math.PI * 2);
          context.arc(m.x + m.w/2 + 8, m.y + m.h/2 - 5, 4, 0, Math.PI * 2);
          context.fill();
        }
        if (state === 'PLAYING') {
          drawPlayer();
        }
      }
    }

    function gameLoop() {
      if (state === 'PLAYING') {
        updatePhysics();
        draw();
        
        const coinsToGive = Math.floor(score / 500);
        if (coinsToGive > quests.coins) {
            quests.coins = coinsToGive;
            totalCoins++;
            localStorage.setItem('doodle_coins', totalCoins);
            if (coinElement) coinElement.textContent = totalCoins;
        }
        if (quests.jumps >= 100) {
            document.getElementById('questStatus').textContent = 'Completed!';
        } else {
            document.getElementById('questStatus').textContent = 'Jumps: ' + quests.jumps + '/100';
        }

        animationFrameId = requestAnimationFrame(gameLoop);
      }
    }

    function resizeCanvas() {
      dpr = window.devicePixelRatio || 1;
      canvasWidth = canvas.clientWidth;
      canvasHeight = canvas.clientHeight;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (state !== 'PLAYING') {
        draw();
      }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    });

    window.addEventListener('touchstart', (e) => {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      touchX = null;
    });

    async function connectPhantom() {
      const provider = window.phantom?.solana;
      if (!provider?.isPhantom) {
        alert('Please install the Phantom wallet extension.');
        return;
      }
      try {
        const resp = await provider.connect();
        const pubKey = resp.publicKey.toString();
        localStorage.setItem('doodle_active_wallet', pubKey);
        updateWalletUI(pubKey);
      } catch (err) {
        console.error("Wallet connection failed", err);
      }
    }

    function updateWalletUI(address) {
      const truncated = address.slice(0, 4) + '...' + address.slice(-4);
      connectButton.textContent = '✦ ' + truncated;
      connectButton.style.backgroundColor = '#d2eedc';
    }

    connectButton.addEventListener('click', connectPhantom);

    playButton.addEventListener('click', startGame);
    playAgainButton.addEventListener('click', startGame);

    window.setTimeout(() => {
      loadingCover.classList.add('opacity-0', 'pointer-events-none');
    }, 900);

    const savedWallet = localStorage.getItem('doodle_active_wallet');
    if (savedWallet) {
      updateWalletUI(savedWallet);
      window.addEventListener('load', () => {
        if (window.phantom?.solana?.isPhantom) {
          window.phantom.solana.connect({ onlyIfTrusted: true }).catch(() => { });
        }
      });
    }
  