const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
const replacement = `const ASSETS = {
  audio_coin: 'assets/CoinSfx/Coin.mp3',
  img_coinGold: 'assets/PNG/Items/coinGold.png',
  img_monster: 'assets/PNG/Enemies/slimeBlock.png',
  img_plat_static: 'assets/PNG/Tiles/grassHalf.png',
  img_plat_moving: 'assets/PNG/Tiles/snowHalf.png',
  img_plat_breaking: 'assets/PNG/Tiles/dirtHalf.png',
  img_plat_disappearing: 'assets/PNG/Tiles/sandHalf.png',
  img_jetpack: 'assets/PNG/Items/star.png',
  img_shield: 'assets/PNG/Items/gemBlue.png',
  img_spring: 'assets/PNG/Tiles/spring.png',
  
  Green_stand: 'assets/PNG/Players/Variable sizes/Green/alienGreen_stand.png',
  Green_jump: 'assets/PNG/Players/Variable sizes/Green/alienGreen_jump.png',
  Blue_stand: 'assets/PNG/Players/Variable sizes/Blue/alienBlue_stand.png',
  Blue_jump: 'assets/PNG/Players/Variable sizes/Blue/alienBlue_jump.png',
  Pink_stand: 'assets/PNG/Players/Variable sizes/Pink/alienPink_stand.png',
  Pink_jump: 'assets/PNG/Players/Variable sizes/Pink/alienPink_jump.png',
  Yellow_stand: 'assets/PNG/Players/Variable sizes/Yellow/alienYellow_stand.png',
  Yellow_jump: 'assets/PNG/Players/Variable sizes/Yellow/alienYellow_jump.png',
  Beige_stand: 'assets/PNG/Players/Variable sizes/Beige/alienBeige_stand.png',
  Beige_jump: 'assets/PNG/Players/Variable sizes/Beige/alienBeige_jump.png'
};`;
code = code.replace(/const ASSETS = \{[\s\S]*?\};/, replacement);
fs.writeFileSync('index.html', code);
console.log('Replaced ASSETS in index.html');
