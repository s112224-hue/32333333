// 1. 取得 Canvas 元素與繪圖環境
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// 2. 遊戲狀態與資源
let gameState = 'loading'; // loading, playing, win, lose
let timeLeft = 30;
let timerId = null;

// 3. 圖片資源
const obstacleImage = new Image();
let isImageLoaded = false;
obstacleImage.src = 'tsai.png';
obstacleImage.onload = () => {
  isImageLoaded = true;
  startGame(); // 資源載入後才開始遊戲
};
obstacleImage.onerror = () => {
  console.log('tsai.png 圖片載入失敗，將使用灰色方塊作為障礙物。');
  startGame(); // 資源載入失敗也要開始遊戲
};

// 4. 定義角色與物件
const player = { x: 50, y: 50, width: 40, height: 40, color: 'blue', speed: 5 };
const ghost = { x: 700, y: 500, width: 50, height: 50, color: 'red', speed: 3.6, stuckCounter: 0 }; // 再次提高鬼的速度
const obstacles = [
  { x: 200, y: 150, width: 80, height: 80 },
  { x: 500, y: 350, width: 80, height: 80 },
  { x: 350, y: 250, width: 80, height: 80 },
  { x: 150, y: 400, width: 80, height: 80 },
  { x: 550, y: 100, width: 80, height: 80 },
];

// 5. 鍵盤狀態
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

document.addEventListener('keydown', (event) => {
  if (event.key in keys) keys[event.key] = true;
  if (gameState !== 'playing' && event.key.toLowerCase() === 'r') {
    resetGame();
  }
});
document.addEventListener('keyup', (event) => {
  if (event.key in keys) keys[event.key] = false;
});

// 6. 核心函式
function resetGame() {
  player.x = 50; player.y = 50;
  ghost.x = 700; ghost.y = 500;
  ghost.stuckCounter = 0;
  timeLeft = 30;
  gameState = 'playing';
  clearInterval(timerId);
  startTimer();
}

function startTimer() {
  timerId = setInterval(() => {
    if (gameState === 'playing') {
      timeLeft--;
      if (timeLeft <= 0) {
        gameState = 'win';
      }
    }
  }, 1000);
}

// 7. 移動與碰撞
function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function moveCharacter(character, moveX, moveY) {
  const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
  if (magnitude === 0) return;

  const velX = (moveX / magnitude) * character.speed;
  const velY = (moveY / magnitude) * character.speed;

  const originalX = character.x;
  const originalY = character.y;

  character.x += velX;
  for (const obstacle of obstacles) {
    if (isColliding(character, obstacle)) {
      character.x = originalX;
      break;
    }
  }

  character.y += velY;
  for (const obstacle of obstacles) {
    if (isColliding(character, obstacle)) {
      character.y = originalY;
      break;
    }
  }

  if (character === player) {
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
      if (player.y < 0) player.y = 0;
      if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
  }
}

// 8. 繪製函式
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = ghost.color;
  ctx.fillRect(ghost.x, ghost.y, ghost.width, ghost.height);

  for (const obstacle of obstacles) {
    if (isImageLoaded) {
      ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
      ctx.fillStyle = '#888';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  }

  ctx.fillStyle = 'black';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Time: ${timeLeft}`, 20, 40);

  if (gameState !== 'playing') {
    clearInterval(timerId);
    ctx.textAlign = 'center';
    ctx.font = '60px sans-serif';
    let message = '';
    let subMessage = "Press 'R' to Restart";
    if (gameState === 'win') {
      ctx.fillStyle = 'green';
      message = 'You Win!';
    } else if (gameState === 'lose') {
      ctx.fillStyle = 'red';
      message = 'Game Over!';
    } else if (gameState === 'loading') {
        message = 'Loading...';
        subMessage = '';
    }
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    ctx.font = '20px sans-serif';
    ctx.fillText(subMessage, canvas.width / 2, canvas.height / 2 + 40);
  }
}

// 9. 遊戲主迴圈
function gameLoop() {
  if (gameState === 'playing') {
    const ghostOriginalX = ghost.x;
    const ghostOriginalY = ghost.y;

    let playerMoveX = 0;
    let playerMoveY = 0;
    if (keys.ArrowLeft) playerMoveX = -1;
    if (keys.ArrowRight) playerMoveX = 1;
    if (keys.ArrowUp) playerMoveY = -1;
    if (keys.ArrowDown) playerMoveY = 1;
    moveCharacter(player, playerMoveX, playerMoveY);

    let ghostMoveX = player.x - ghost.x;
    let ghostMoveY = player.y - ghost.y;

    if (ghost.stuckCounter > 5) {
        ghostMoveX = Math.random() - 0.5;
        ghostMoveY = Math.random() - 0.5;
        if (ghost.stuckCounter > 20) {
            ghost.stuckCounter = 0;
        }
    }

    moveCharacter(ghost, ghostMoveX, ghostMoveY);

    if (ghost.x === ghostOriginalX && ghost.y === ghostOriginalY) {
        ghost.stuckCounter++;
    } else {
        ghost.stuckCounter = 0;
    }

    if (isColliding(player, ghost)) {
      gameState = 'lose';
    }
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// 10. 啟動遊戲
function startGame() {
    console.log('遊戲開始！');
    gameState = 'playing';
    startTimer();
    gameLoop();
}

console.log('遊戲載入中...');