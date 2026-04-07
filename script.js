const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const nextBlocksDiv = document.getElementById('next-blocks');
const resetBtn = document.getElementById('resetBtn');

/* ---------- ADAPTIVE CANVAS ---------- */

function resizeCanvas() {
  const size = Math.min(window.innerWidth - 40, 400);
  canvas.width = size;
  canvas.height = size;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ---------- GRID ---------- */

const gridSize = 40;
let cols = canvas.width / gridSize;
let rows = canvas.height / gridSize;

function updateGridSize() {
  cols = Math.floor(canvas.width / gridSize);
  rows = Math.floor(canvas.height / gridSize);
}

updateGridSize();

/* ---------- DATA ---------- */

let score = 0;

const blockColors = ['#FF073A','#00FF7F','#1E90FF','#FFD700','#FF4500','#9400D3'];

const blockShapes = [
  [[1,1],[1,1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1],[0,1]],
  [[1,0],[1,1]],
  [[1,1,1],[0,1,0]],
  [[1,1,1],[1,1,1],[1,1,1]]
];

let grid = [];
let nextBlocks = [];
let selectedBlock = null;
let offsetX = 0, offsetY = 0;
let mouseX = 0, mouseY = 0;

/* ---------- INIT GRID ---------- */

function createGrid(){
  grid = Array(rows).fill().map(()=>Array(cols).fill(0));
}

createGrid();

/* ---------- GENERATE ---------- */

function generateNextBlocks() {
  nextBlocks = Array(3).fill().map(()=> {
    const idx = Math.floor(Math.random()*blockShapes.length);
    return {
      shape: blockShapes[idx],
      color: blockColors[idx % blockColors.length]
    };
  });
}

/* ---------- DRAW ---------- */

function drawGrid() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(grid[r][c]){
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c*gridSize,r*gridSize,gridSize-1,gridSize-1);
      }
    }
  }

  // preview
  if(selectedBlock){
    ctx.fillStyle = selectedBlock.color;

    const gridX = Math.floor((mouseX - offsetX)/gridSize);
    const gridY = Math.floor((mouseY - offsetY)/gridSize);

    for(let r=0;r<selectedBlock.shape.length;r++){
      for(let c=0;c<selectedBlock.shape[r].length;c++){
        if(selectedBlock.shape[r][c]){
          ctx.globalAlpha = 0.7;
          ctx.fillRect((gridX+c)*gridSize,(gridY+r)*gridSize,gridSize-1,gridSize-1);
          ctx.globalAlpha = 1;
        }
      }
    }
  }
}

/* ---------- NEXT BLOCKS ---------- */

function drawNextBlocks() {
  nextBlocksDiv.innerHTML = '';

  nextBlocks.forEach((block,i)=>{
    const bCanvas = document.createElement('canvas');
    bCanvas.width = block.shape[0].length * 30;
    bCanvas.height = block.shape.length * 30;
    bCanvas.dataset.index = i;

    const bCtx = bCanvas.getContext('2d');
    bCtx.fillStyle = block.color;

    for(let r=0;r<block.shape.length;r++){
      for(let c=0;c<block.shape[r].length;c++){
        if(block.shape[r][c]){
          bCtx.fillRect(c*30,r*30,29,29);
        }
      }
    }

    nextBlocksDiv.appendChild(bCanvas);
  });
}

/* ---------- LOGIC ---------- */

function canPlaceBlock(block, gridX, gridY){
  for(let r=0;r<block.shape.length;r++){
    for(let c=0;c<block.shape[r].length;c++){
      if(block.shape[r][c]){
        const x = gridX+c;
        const y = gridY+r;

        if(x<0 || x>=cols || y<0 || y>=rows || grid[y][x]){
          return false;
        }
      }
    }
  }
  return true;
}

function placeBlock(block, gridX, gridY){
  let placed = 0;

  for(let r=0;r<block.shape.length;r++){
    for(let c=0;c<block.shape[r].length;c++){
      if(block.shape[r][c]){
        grid[gridY+r][gridX+c] = block.color;
        placed++;
      }
    }
  }

  score += placed;
  scoreDisplay.textContent = `Очки: ${score}`;
}

function clearLines(){
  let cleared = 0;

  for(let r=rows-1;r>=0;r--){
    if(grid[r].every(cell=>cell!==0)){
      grid[r].fill(0);
      cleared++;
    }
  }

  for(let c=0;c<cols;c++){
    let full = true;
    for(let r=0;r<rows;r++){
      if(!grid[r][c]) full=false;
    }
    if(full){
      for(let r=0;r<rows;r++) grid[r][c]=0;
      cleared++;
    }
  }

  if(cleared){
    score += cleared * 10;
    scoreDisplay.textContent = `Очки: ${score}`;
  }
}

function checkGameOver(){
  return nextBlocks.every(block=>{
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        if(canPlaceBlock(block,c,r)) return false;
      }
    }
    return true;
  });
}

/* ---------- TOUCH + MOUSE ---------- */

nextBlocksDiv.addEventListener('mousedown', startDrag);
nextBlocksDiv.addEventListener('touchstart', startDrag);

function startDrag(e){
  const target = e.target;

  if(target.tagName === 'CANVAS'){
    const idx = parseInt(target.dataset.index);
    selectedBlock = {...nextBlocks[idx], index: idx};

    const rect = target.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;

    offsetX = touch.clientX - rect.left;
    offsetY = touch.clientY - rect.top;

    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
  }
}

/* ---------- MOVE ---------- */

canvas.addEventListener('mousemove', e=>{
  if(selectedBlock){
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }
});

canvas.addEventListener('touchmove', e=>{
  if(selectedBlock){
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
    mouseY = e.touches[0].clientY - rect.top;
  }
}, { passive: false });

/* ---------- DROP ---------- */

canvas.addEventListener('mouseup', dropBlock);
canvas.addEventListener('touchend', dropBlock);

function dropBlock(){
  if(!selectedBlock) return;

  const gridX = Math.floor((mouseX - offsetX)/gridSize);
  const gridY = Math.floor((mouseY - offsetY)/gridSize);

  if(canPlaceBlock(selectedBlock,gridX,gridY)){
    placeBlock(selectedBlock,gridX,gridY);
    clearLines();

    nextBlocks.splice(selectedBlock.index,1);

    if(nextBlocks.length === 0){
      generateNextBlocks();
    }

    drawNextBlocks();
  }

  selectedBlock = null;

  if(checkGameOver()){
    alert(`Игра окончена! Очки: ${score}`);
  }
}

/* ---------- RESET ---------- */

resetBtn.addEventListener('click', ()=>{
  createGrid();
  score = 0;
  scoreDisplay.textContent = `Очки: ${score}`;
  generateNextBlocks();
  drawNextBlocks();
});

/* ---------- LOOP ---------- */

function update(){
  drawGrid();
  requestAnimationFrame(update);
}

/* ---------- START ---------- */

generateNextBlocks();
drawNextBlocks();
update();
