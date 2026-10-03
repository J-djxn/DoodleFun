const fs = require('fs');

const colors = ["Green", "Blue", "Pink", "Yellow", "Beige"];

function getBase64(path, mime) {
    if (fs.existsSync(path)) {
        const b64 = fs.readFileSync(path).toString('base64');
        return `data:${mime};base64,${b64}`;
    }
    return "";
}

const audioB64 = getBase64("assets/audio/Coin.mp3", "audio/mp3");
const coinB64 = getBase64("assets/PNG/Items/coinGold.png", "image/png");

let assetsObj = `const ASSETS = {
  audio_coin: "${audioB64}",
  img_coinGold: "${coinB64}",
  img_monster: "${getBase64('assets/PNG/Enemies/fly.png', 'image/png')}",
  img_plat_static: "${getBase64('assets/PNG/Ground/Grass/grassHalf_mid.png', 'image/png')}",
  img_plat_moving: "${getBase64('assets/PNG/Ground/Sand/sandHalf.png', 'image/png')}",
  img_plat_breaking: "${getBase64('assets/PNG/Ground/Stone/stoneHalf.png', 'image/png')}",
  img_plat_disappearing: "${getBase64('assets/PNG/Ground/Snow/snowHalf.png', 'image/png')}",
  img_jetpack: "${getBase64('assets/PNG/Particles/fireball.png', 'image/png')}",
  img_shield: "${getBase64('assets/PNG/Items/star.png', 'image/png')}",
  img_spring: "${getBase64('assets/PNG/Items/spring.png', 'image/png')}",
\n`;

for (let c of colors) {
    let standPath = `assets/PNG/Players/128x256/${c}/alien${c}_stand.png`;
    let jumpPath = `assets/PNG/Players/128x256/${c}/alien${c}_jump.png`;
    
    let standB64 = getBase64(standPath, "image/png");
    let jumpB64 = getBase64(jumpPath, "image/png");
    
    assetsObj += `  ${c}_stand: "${standB64}",\n`;
    assetsObj += `  ${c}_jump: "${jumpB64}",\n`;
}
assetsObj += "};\n";

let html = fs.readFileSync("index_test.html", "utf8");

html = html.replace("window.CrazyGames.SDK.init();", "window.CrazyGames.SDK.init();\n\n    " + assetsObj);

html = html.replace("new Audio('assets/audio/Coin.mp3')", "new Audio(ASSETS.audio_coin)");
html = html.replace("'assets/PNG/Items/coinGold.png'", "ASSETS.img_coinGold");

html = html.replace("`assets/PNG/Players/128x256/${color}/alien${color}_stand.png`", "ASSETS[color + '_stand']");
html = html.replace("`assets/PNG/Players/128x256/${color}/alien${color}_jump.png`", "ASSETS[color + '_jump']");

html = html.replace("assets/PNG/Players/128x256/${skin}/alien${skin}_stand.png", "${ASSETS[skin + '_stand']}");

fs.writeFileSync("index_test.html", html);
