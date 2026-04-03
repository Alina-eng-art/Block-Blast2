const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const nextBlocksDiv = document.getElementById('next-blocks');
const resetBtn = document.getElementById('resetBtn');

const gridSize = 40;
const cols = canvas.width / gridSize;
const rows = canvas.height / gridSize;

let score = 0;

const blockColors = ['#FF073A', '#00FF7F', '#1E90FF', '#FFD700', '#FF4500', '#9400D3'];
const blockShapes = [
    [[1,1],[1,1]],           // 2x2
    [[1,1,1]],               // 3x1
    [[1],[1],[1]],           // 1x3
    [[1,1],[0,1]],           // L
    [[1,0],[1,1]],           // Reverse L
    [[1,1,1],[0,1,0]],       // T
    [[1,1,1],[1,1,1],[1,1,1]] // 3x3
];

let grid = Array(rows).fill().map(()=>Array(cols).fill(0));
let nextBlocks = [];
let selectedBlock = null;
let offsetX = 0, offsetY = 0;
let mouseX = 0, mouseY = 0;

function generateNextBlocks() {
    nextBlocks = Array(3).fill().map(()=> {
        const idx = Math.floor(Math.random()*blockShapes.length);
        return {
            shape: blockShapes[idx],
            color: blockColors[idx % blockColors.length]
        };
    });
}

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

    // Рисуем выбранный блок поверх
    if(selectedBlock){
        ctx.fillStyle = selectedBlock.color;
        const gridX = Math.floor((mouseX - offsetX)/gridSize);
        const gridY = Math.floor((mouseY - offsetY)/gridSize);
        for(let r=0;r<selectedBlock.shape.length;r++){
            for(let c=0;c<selectedBlock.shape[r].length;c++){
                if(selectedBlock.shape[r][c]){
                    ctx.fillRect((gridX+c)*gridSize,(gridY+r)*gridSize,gridSize-1,gridSize-1);
                }
            }
        }
    }
}

function drawNextBlocks() {
    nextBlocksDiv.innerHTML = '';
    nextBlocks.forEach((block,i)=>{
        const bCanvas = document.createElement('canvas');
        bCanvas.width = block.shape[0].length * gridSize;
        bCanvas.height = block.shape.length * gridSize;
        bCanvas.classList.add('next-block-canvas');
        bCanvas.dataset.index = i;
        const bCtx = bCanvas.getContext('2d');
        bCtx.fillStyle = block.color;
        for(let r=0;r<block.shape.length;r++){
            for(let c=0;c<block.shape[r].length;c++){
                if(block.shape[r][c]){
                    bCtx.fillRect(c*gridSize,r*gridSize,gridSize-1,gridSize-1);
                }
            }
        }
        nextBlocksDiv.appendChild(bCanvas);
    });
}

function canPlaceBlock(block, gridX, gridY){
    for(let r=0;r<block.shape.length;r++){
        for(let c=0;c<block.shape[r].length;c++){
            if(block.shape[r][c]){
                const x = gridX+c;
                const y = gridY+r;
                if(x<0 || x>=cols || y<0 || y>=rows || grid[y][x]) return false;
            }
        }
    }
    return true;
}

function placeBlock(block, gridX, gridY){
    let placedCells = 0;
    for(let r=0;r<block.shape.length;r++){
        for(let c=0;c<block.shape[r].length;c++){
            if(block.shape[r][c]){
                grid[gridY+r][gridX+c] = block.color;
                placedCells++;
            }
        }
    }
    score += placedCells; // начисляем очки за каждую клетку
    scoreDisplay.textContent = `Очки: ${score}`;
}

function clearLines(){
    let linesCleared = 0;
    // Rows
    for(let r=rows-1;r>=0;r--){
        if(grid[r].every(cell=>cell!==0)){
            for(let c=0;c<cols;c++) grid[r][c]=0;
            linesCleared++;
        }
    }
    // Columns
    for(let c=0;c<cols;c++){
        let full=true;
        for(let r=0;r<rows;r++){
            if(!grid[r][c]) full=false;
        }
        if(full){
            for(let r=0;r<rows;r++) grid[r][c]=0;
            linesCleared++;
        }
    }
    if(linesCleared>0){
        score += linesCleared*10; // бонус за линии
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

canvas.addEventListener('mousemove', e=>{
    if(selectedBlock){
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', e=>{
    if(selectedBlock){
        const gridX = Math.floor((mouseX - offsetX)/gridSize);
        const gridY = Math.floor((mouseY - offsetY)/gridSize);
        if(canPlaceBlock(selectedBlock,gridX,gridY)){
            placeBlock(selectedBlock,gridX,gridY);
            clearLines();
            nextBlocks.splice(selectedBlock.index,1);
            if(nextBlocks.length===0) generateNextBlocks();
            drawNextBlocks();
        }
        selectedBlock=null;
        if(checkGameOver()) alert(`Игра окончена! Очки: ${score}`);
    }
});

nextBlocksDiv.addEventListener('mousedown', e=>{
    const target = e.target;
    if(target.tagName==='CANVAS'){
        const idx = parseInt(target.dataset.index);
        selectedBlock = {...nextBlocks[idx], index: idx};
        const rect = target.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
});

function update(){
    drawGrid();
    requestAnimationFrame(update);
}

resetBtn.addEventListener('click', ()=>{
    grid = Array(rows).fill().map(()=>Array(cols).fill(0));
    score = 0;
    scoreDisplay.textContent = `Очки: ${score}`;
    generateNextBlocks();
    drawNextBlocks();
});

generateNextBlocks();
drawNextBlocks();
update();
