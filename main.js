// =====================
// Canvas 初期化
// =====================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// UI
// =====================
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const taskLabel = document.getElementById("taskLabel");
const resultCard = document.getElementById("resultCard");
const resultText = document.getElementById("resultText");
const introSection = document.getElementById("introSection");

// =====================
// 状態
// =====================
let currentTask = 0;
let measuring = false;
let task3Finished = false;

// =====================
// マウス
// =====================
let mouseX = 0;
let mouseY = 0;

// =====================
// Task1：直線
// =====================
const guideY = canvas.height / 2;
const startX = 100;
const endX = canvas.width - 100;

let task1 = {
  deviationSum: 0,
  points: 0,
  prevY: null
};

// =====================
// Task2：クリック
// =====================
let target = null;
let task2 = {
  hits: 0,
  misses: 0
};

// =====================
// Task3：追従
// =====================
let follow = { x: 200, y: 200, vx: 3, vy: 2 };
let task3 = {
  distanceSum: 0,
  frames: 0,
  startTime: 0
};

// =====================
// マウスイベント
// =====================
canvas.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (currentTask === 1 && measuring) {
    if (task1.prevY !== null) {
      task1.deviationSum += Math.abs(mouseY - guideY);
      task1.points++;
    }
    task1.prevY = mouseY;

    if (mouseX >= endX) {
      measuring = false;
      currentTask = 2;
      initTask2();
    }
  }

  if (currentTask === 3 && measuring && !task3Finished) {
    task3.distanceSum += Math.hypot(mouseX - follow.x, mouseY - follow.y);
    task3.frames++;
  }
});

canvas.addEventListener("click", () => {
  if (currentTask === 2 && measuring && target) {
    const d = Math.hypot(mouseX - target.x, mouseY - target.y);
    if (d <= target.r) {
      task2.hits++;
      spawnTarget();
    } else {
      task2.misses++;
    }

    if (task2.hits >= 10) {
      measuring = false;
      currentTask = 3;
      initTask3();
    }
  }
});

// =====================
// Task 初期化
// =====================
function initTask2() {
  task2.hits = 0;
  task2.misses = 0;
  spawnTarget();
  taskLabel.textContent = "Task2：円を10回クリック";
  measuring = true;
}

function initTask3() {
  task3.distanceSum = 0;
  task3.frames = 0;
  task3.startTime = Date.now();
  task3Finished = false;
  taskLabel.textContent = "Task3：5秒追従";
  measuring = true;
}

// =====================
// 描画
// =====================
function spawnTarget() {
  target = {
    x: Math.random() * (canvas.width - 40) + 20,
    y: Math.random() * (canvas.height - 40) + 20,
    r: 10
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Task1
  if (currentTask === 1) {
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startX, guideY);
    ctx.lineTo(endX, guideY);
    ctx.stroke();
  }

  // Task2
  if (currentTask === 2 && target) {
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r, 0, Math.PI*2);
    ctx.fill();
  }

  // Task3
  if (currentTask === 3 && measuring && !task3Finished) {
    follow.x += follow.vx;
    follow.y += follow.vy;

    if (follow.x < 0 || follow.x > canvas.width) follow.vx *= -1;
    if (follow.y < 0 || follow.y > canvas.height) follow.vy *= -1;

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(follow.x, follow.y, 12, 0, Math.PI*2);
    ctx.fill();

    const elapsed = Date.now() - task3.startTime;
    ctx.fillStyle = "#333";
    ctx.font = "20px sans-serif";
    ctx.fillText(`残り ${Math.max(0, Math.ceil((5000-elapsed)/1000))} 秒`, 20, 40);

    if (elapsed >= 5000) {
      task3Finished = true;
      measuring = false;
      showResult();
    }
  }

  requestAnimationFrame(draw);
}
draw();

// =====================
// 感度おすすめ生成
// =====================
function generateSensitivityRecommendation() {
  const dev = task1.deviationSum / task1.points;
  const hitRate = task2.hits / (task2.hits + task2.misses);
  const followAvg = task3.distanceSum / task3.frames;

  let rec = "";

  // Task1
  if (dev < 10) rec += "直線操作安定 → 感度 +10% 可能\n";
  else if (dev < 30) rec += "直線操作標準 → 調整不要\n";
  else rec += "直線ブレ大 → 感度 -10〜20% 推奨\n";

  // Task2
  if (hitRate > 0.8) rec += "クリック精度良好 → 調整不要\n";
  else if (hitRate > 0.5) rec += "クリックやや不安 → 感度 -5〜10% 推奨\n";
  else rec += "クリック不安定 → 感度 -15% 推奨\n";

  // Task3
  if (followAvg < 20) rec += "追従良好 → 感度 +10% OK\n";
  else if (followAvg < 50) rec += "追従普通 → 標準感度\n";
  else rec += "追従遅れ大 → 感度 -10〜20% 推奨\n";

  return rec;
}

// =====================
// 結果表示
// =====================
function showResult() {
  const dev = task1.deviationSum / task1.points;
  const hitRate = task2.hits / (task2.hits + task2.misses);
  const followAvg = task3.distanceSum / task3.frames;

  const score =
    Math.max(0, 40 - dev) +
    hitRate * 30 +
    Math.max(0, 30 - followAvg / 2);

  resultText.innerHTML = `
    <p><b>総合スコア：</b>${score.toFixed(0)} / 100</p>
    <p>直線安定度：${dev.toFixed(1)} px</p>
    <p>クリック精度：${(hitRate*100).toFixed(0)}%</p>
    <p>追従平均距離：${followAvg.toFixed(1)} px</p>
    <hr>
    <h3>おすすめ感度調整</h3>
    <pre>${generateSensitivityRecommendation()}</pre>
  `;

  resultCard.classList.remove("hidden");
}

// =====================
// スタート・再スタート
// =====================
function resetAll() {
  currentTask = 1;
  measuring = true;

  task1.deviationSum = 0;
  task1.points = 0;
  task1.prevY = null;

  task2.hits = 0;
  task2.misses = 0;
  target = null;

  task3.distanceSum = 0;
  task3.frames = 0;
  task3Finished = false;

  taskLabel.textContent = "Task1：線をなぞってください";
  resultCard.classList.add("hidden");

  // テスト開始時に冒頭タイトル・目次非表示
  introSection.style.display = "none";
}

startBtn.onclick = resetAll;
restartBtn.onclick = () => {
  introSection.style.display = "block"; // 再表示可能
  resetAll();
};
