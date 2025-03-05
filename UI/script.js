const gridSize = 4;
let grid = [];
let timeLeft = 35;
let timer;
const colors = ["wire-red", "wire-blue", "wire-green", "wire-yellow"];

function createGrid() {
    const gridElement = document.getElementById("grid");
    gridElement.innerHTML = "";
    grid = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");

        // Assign a random wire color
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        tile.classList.add(randomColor);

        tile.dataset.rotation = 0;
        tile.addEventListener("click", () => rotateTile(tile));
        grid.push(tile);
        gridElement.appendChild(tile);
    }

    randomizeGrid();
}

function randomizeGrid() {
    grid.forEach(tile => {
        let rotations = Math.floor(Math.random() * 4);
        for (let i = 0; i < rotations; i++) {
            rotateTile(tile, true);
        }
    });
}

function rotateTile(tile, random = false) {
    let rotation = parseInt(tile.dataset.rotation);
    rotation = (rotation + 90) % 360;
    tile.dataset.rotation = rotation;
    tile.style.transform = `rotate(${rotation}deg)`;

    if (!random) checkWin();
}

function checkWin() {
    let allCorrect = grid.every(tile => tile.dataset.rotation === "0");
    if (allCorrect) {
        clearInterval(timer);
        document.getElementById("status").textContent = "HACK SUCCESS!";
        document.getElementById("status").style.color = "var(--neon-green)";
        fetch("https://bridge-smookey.com/hackSuccess", { method: "POST" });
    }
}

function startTimer() {
    timeLeft = 20;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("time-left").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById("status").textContent = "HACK FAILED!";
            document.getElementById("status").style.color = "red";
        }
    }, 1000);
}

document.getElementById("start-btn").addEventListener("click", () => {
    createGrid();
    document.getElementById("status").textContent = "";
    startTimer();
});
