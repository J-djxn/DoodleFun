const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');

function replace(search, replacement) {
    if (html.includes(search)) {
        html = html.replace(search, replacement);
    } else {
        console.log("Failed to match (see below):");
        console.log(search);
        console.log("---");
    }
}

// 1. Globals
replace(
`    let player = { x: 0, y: 0, w: 40, h: 40, vx: 0, vy: 0, squashTimer: 0, isFlying: false, flightTimer: 0 };
    let platforms = [];`,
`    let player = { x: 0, y: 0, w: 40, h: 40, vx: 0, vy: 0, squashTimer: 0, isFlying: false, flightTimer: 0 };
    let platforms = [];
    let monsters = [];
    let currentTheme = "normal";
    let quests = { jumps: 0, coins: 0 };
    let hasShield = false;`
);

// 2. initGame arrays clear
replace(
`      platforms = [];
      const platformCount = 10;`,
`      platforms = [];
      monsters = [];
      currentTheme = "normal";
      quests = { jumps: 0, coins: 0 };
      hasShield = false;
      const platformCount = 10;`
);


// 3. initGame platform creation
replace(
`        const type = Math.random() < 0.2 ? 'moving' : 'static';
        let powerup = null;
        if (i !== 1) { // No powerup on spawn
          const r = Math.random();
          if (r < 0.03) powerup = 'helicopter';
          else if (r < 0.13) powerup = 'spring';
        }`,
`        let rType = Math.random();
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
        }`
);

// 4. scroll platforms logic
replace(
`      while (highestY > -50) {
        const py = highestY - (Math.random() * 40 + 50);
        const px = Math.random() * (canvasWidth - 65);
        const type = Math.random() < 0.2 ? 'moving' : 'static';
        let powerup = null;
        const r = Math.random();
        if (r < 0.03) powerup = 'helicopter';
        else if (r < 0.13) powerup = 'spring';`,
`      while (highestY > -50) {
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
        }`
);


// 5. Jump physics exactly matching lines 371-396
replace(
`      if (player.vy > 0 && !player.isFlying) {
        for (let p of platforms) {
          if (
            player.x + player.w > p.x &&
            player.x < p.x + p.w &&
            player.y + player.h > p.y &&
            player.y + player.h < p.y + p.h + player.vy
          ) {
            if (p.powerup === 'spring') {
              player.vy = -22;
              p.powerup = null;
              player.squashTimer = performance.now();
              audio.playSpring();
            } else if (p.powerup === 'helicopter') {
              player.isFlying = true;
              player.flightTimer = performance.now();
              p.powerup = null;
              audio.playHelicopter();
            } else {
              player.vy = bounceVelocity;
              player.squashTimer = performance.now();
              audio.playJump();
            }
            break;
          }
        }
      }`,
`      if (player.vy > 0 && !player.isFlying) {
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
              audio.playSpring();
            } else if (p.powerup === 'helicopter') {
              player.isFlying = true;
              player.flightTimer = performance.now();
              p.powerup = null;
              audio.playHelicopter();
            } else if (p.powerup === 'jetpack') {
              player.isFlying = true;
              player.vy = -20; // Faster
              player.flightTimer = performance.now() + 1000; // longer
              p.powerup = null;
              audio.playHelicopter();
            } else if (p.powerup === 'shield') {
              hasShield = true;
              player.vy = bounceVelocity;
              player.squashTimer = performance.now();
              p.powerup = null;
              audio.playJump();
            } else {
              player.vy = bounceVelocity;
              player.squashTimer = performance.now();
              audio.playJump();
            }
            quests.jumps++;
            break;
          }
        }
      }`
);

// 6. Scroll Offset
replace(
`        for (let p of platforms) {
          p.y += scrollOffset;
        }`,
`        for (let p of platforms) {
          p.y += scrollOffset;
        }
        for (let m of monsters) {
          m.y += scrollOffset;
        }`
);

// 7. Breaking platforms fall
replace(
`      for (let i = platforms.length - 1; i >= 0; i--) {
        let p = platforms[i];
        if (p.type === 'moving') {
          p.x += p.vx;
          if (p.x < 0 || p.x + p.w > canvasWidth) p.vx *= -1;
        }`,
`      for (let i = platforms.length - 1; i >= 0; i--) {
        let p = platforms[i];
        if (p.type === 'moving') {
          p.x += p.vx;
          if (p.x < 0 || p.x + p.w > canvasWidth) p.vx *= -1;
        }
        if (p.isBreaking) {
          p.y += p.vy;
          p.vy += gravity;
        }`
);

// 8. Monsters & Game Over
replace(
`      if (player.y > canvasHeight) {
        gameOver();
      }`,
`      if (player.y > canvasHeight) {
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
             audio.playJump();
          } else {
             if (hasShield || player.isFlying) {
                monsters.splice(i, 1);
                hasShield = false;
             } else {
                gameOver();
             }
          }
        }
      }`
);

// 9. Draw Background Theme
replace(
`    function drawMenuBackground() {
      context.strokeStyle = '#496f98';`,
`    function drawMenuBackground() {
      if (currentTheme === 'space') {
         context.fillStyle = '#112233';
         context.fillRect(0, 0, canvasWidth, canvasHeight);
         context.fillStyle = 'white';
         for(let i=0; i<50; i++) {
             context.fillRect(Math.random()*canvasWidth, Math.random()*canvasHeight, 2, 2);
         }
      }
      if (state !== 'MENU') return;
      context.strokeStyle = '#496f98';`
);

replace(
`    function draw() {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      if (state === 'MENU') {
        drawMenuBackground();
      } else {`,
`    function draw() {
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
      } else {`
);

// 10. Draw Platform (color & new powerups)
replace(
`    function drawPlatform(p) {
      context.fillStyle = p.type === 'moving' ? '#6296b5' : '#78ab46';
      context.strokeStyle = '#2b4823';`,
`    function drawPlatform(p) {
      if (p.disappeared) return;
      context.fillStyle = p.type === 'moving' ? '#6296b5' : (p.type === 'breaking' ? '#b58562' : (p.type === 'disappearing' ? '#ffffff' : '#78ab46'));
      context.strokeStyle = p.type === 'moving' ? '#4a7692' : (p.type === 'breaking' ? '#8a5c3d' : (p.type === 'disappearing' ? '#cccccc' : '#5c8734'));`
);

replace(
`      context.strokeStyle = p.type === 'moving' ? '#4a7692' : '#5c8734';`,
`      context.strokeStyle = p.type === 'moving' ? '#4a7692' : (p.type === 'breaking' ? '#8a5c3d' : (p.type === 'disappearing' ? '#cccccc' : '#5c8734'));`
);

// Exact match for drawPlatform's helicopter check
replace(
`      } else if (p.powerup === 'helicopter') {
        context.fillStyle = '#db6e59';
        context.strokeStyle = '#2f537d';`,
`      } else if (p.powerup === 'jetpack') {
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
        context.strokeStyle = '#2f537d';`
);

// 11. Draw Player Shield & Monsters
replace(
`      if (player.isFlying) {
        context.fillStyle = '#db6e59';`,
`      if (hasShield) {
        context.strokeStyle = '#0ff';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(player.w/2, player.h/2, 35, 0, Math.PI * 2);
        context.stroke();
      }
      if (player.isFlying) {
        context.fillStyle = '#db6e59';`
);

replace(
`        for (let p of platforms) {
          drawPlatform(p);
        }
        if (state === 'PLAYING') {
          drawPlayer();
        }`,
`        for (let p of platforms) {
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
        }`
);

// 12. Quests UI
replace(
`            <div class="score-stamp rotate-2 mb-2">
              <span class="block text-xs uppercase tracking-[0.2em] text-[#d1ad63]">coins</span>
              <strong id="coinCount" class="text-[#d1ad63]">0</strong>
            </div>`,
`            <div class="score-stamp rotate-2 mb-2">
              <span class="block text-xs uppercase tracking-[0.2em] text-[#d1ad63]">coins</span>
              <strong id="coinCount" class="text-[#d1ad63]">0</strong>
            </div>
            <div class="score-stamp rotate-1 mt-2 text-right">
              <span class="block text-xs uppercase tracking-[0.2em] text-[#8a2be2]">Quests</span>
              <div id="questStatus" class="text-sm font-bold text-[#8a2be2]">Jumps: 0/100</div>
            </div>`
);

replace(
`        if (state === 'PLAYING') {
          scoreElement.classList.add('hidden');
          const coinsToGive = Math.floor(score / 500);
          if (coinsToGive > 0) {
            totalCoins += coinsToGive;
            localStorage.setItem('doodle_coins', totalCoins);
            coinElement.textContent = totalCoins;
          }`,
`        if (state === 'PLAYING') {
          scoreElement.classList.add('hidden');
          const coinsToGive = Math.floor(score / 500);
          if (coinsToGive > 0) {
            totalCoins += coinsToGive;
            localStorage.setItem('doodle_coins', totalCoins);
            coinElement.textContent = totalCoins;
          }
          if (quests.jumps >= 100) {
              document.getElementById('questStatus').textContent = 'Completed!';
          } else {
              document.getElementById('questStatus').textContent = 'Jumps: ' + quests.jumps + '/100';
          }`
);

fs.writeFileSync('index.html', html);
console.log('Patched without duplicates!');
