// Variables
let gridSize = 5;
let targetCount = 6;
let timeLimit = 12;
let currentPhase = 'idle'; // idle, memorize, input, success, failure
let targetCells = [];
let selectedCells = [];
let timerInterval = null;
let timeRemaining = 0;
let gridCells = [];
let correctCount = 0;

// Listen for messages from the game client
window.addEventListener('message', function(event) {
    let data = event.data;
    
    if (data.type === "showBridgeHack") {
        // Initialize the minigame with settings from the client
        gridSize = data.gridSize || 5;
        targetCount = data.targetCount || 6;
        timeLimit = data.timeLimit || 12;
        
        resetGame();
        showHackUI(true);
        startGame();
    } else if (data.type === "hideBridgeHack") {
        showHackUI(false);
        resetGame();
    }
});

// Create and initialize the grid
function createGrid() {
    const hackGrid = document.getElementById('hackGrid');
    hackGrid.innerHTML = '';
    hackGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    gridCells = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'gridCell';
        cell.dataset.index = i;
        
        // Add a random symbol or icon (could be replaced with custom icons)
        const symbols = ['■', '●', '▲', '◆', '★', '✕', '⬡', '⬢', '+', '▣', '□', '△'];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        cell.textContent = randomSymbol;
        
        cell.addEventListener('click', function() {
            if (currentPhase !== 'input') return;
            
            // Toggle selection
            if (selectedCells.includes(i)) {
                // Remove from selected
                selectedCells = selectedCells.filter(cellIndex => cellIndex !== i);
                cell.classList.remove('selected');
            } else {
                // Add to selected if we haven't reached the target count
                if (selectedCells.length < targetCount) {
                    selectedCells.push(i);
                    cell.classList.add('selected');
                } else {
                    // Animate shake to indicate max selections reached
                    cell.classList.add('glitch');
                    setTimeout(() => cell.classList.remove('glitch'), 500);
                }
            }
            
            // Update progress display
            updateProgress();
        });
        
        hackGrid.appendChild(cell);
        gridCells.push(cell);
    }
}

// Generate random target cells
function generateTargets() {
    targetCells = [];
    while (targetCells.length < targetCount) {
        const randomIndex = Math.floor(Math.random() * (gridSize * gridSize));
        if (!targetCells.includes(randomIndex)) {
            targetCells.push(randomIndex);
        }
    }
}

// Show targets for memorization phase
function showTargets() {
    targetCells.forEach(index => {
        gridCells[index].classList.add('target');
    });
}

// Hide targets after memorization phase
function hideTargets() {
    targetCells.forEach(index => {
        gridCells[index].classList.remove('target');
    });
}

// Show/hide the hack UI
function showHackUI(show) {
    const container = document.getElementById('hackContainer');
    container.style.display = show ? 'flex' : 'none';
}

// Update the progress display
function updateProgress() {
    document.getElementById('progress').textContent = `${selectedCells.length}/${targetCount}`;
}

// Start the timer
function startTimer(duration) {
    clearInterval(timerInterval);
    timeRemaining = duration;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining -= 0.1;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            if (currentPhase === 'memorize') {
                startInputPhase();
            } else if (currentPhase === 'input') {
                checkResult(false); // Time's up, automatic failure
            }
        }
    }, 100);
}

// Update timer display
function updateTimerDisplay() {
    document.getElementById('timer').textContent = Math.max(0, timeRemaining.toFixed(1));
    const percentage = (timeRemaining / timeLimit) * 100;
    document.querySelector('.time-fill').style.width = `${Math.max(0, percentage)}%`;
    
    // Change color based on time remaining
    const timeBar = document.querySelector('.time-fill');
    if (percentage < 25) {
        timeBar.style.backgroundColor = '#ff3333';
    } else if (percentage < 50) {
        timeBar.style.backgroundColor = '#ff9933';
    } else {
        timeBar.style.backgroundColor = '#33cc33';
    }
}

// Start the memory phase
function startMemorizePhase() {
    currentPhase = 'memorize';
    document.getElementById('hackStatus').textContent = 'MEMORIZE THE PATTERN';
    document.getElementById('hackInstructions').textContent = 'Remember the highlighted cells';
    document.getElementById('submitHack').style.display = 'none';
    
    // Show the targets and start timer
    showTargets();
    startTimer(timeLimit / 2); // Use half the time for memorization
}

// Start the input phase
function startInputPhase() {
    currentPhase = 'input';
    hideTargets();
    document.getElementById('hackStatus').textContent = 'REPLICATE THE PATTERN';
    document.getElementById('hackInstructions').textContent = 'Select the cells from memory';
    document.getElementById('submitHack').style.display = 'block';
    
    // Reset selections
    selectedCells = [];
    updateProgress();
    
    // Start timer for input phase
    startTimer(timeLimit / 1.5); // Use remaining time for input
}

// Check the result of the hack
function checkResult(manually = true) {
    clearInterval(timerInterval);
    
    // If checking was triggered manually but not all cells were selected
    if (manually && selectedCells.length < targetCount) {
        const missing = targetCount - selectedCells.length;
        document.getElementById('hackInstructions').textContent = 
            `${missing} more selection${missing > 1 ? 's' : ''} needed`;
        document.getElementById('hackInstructions').style.color = '#ff5555';
        
        // Flash the instruction text
        const instructions = document.getElementById('hackInstructions');
        instructions.classList.add('glitch');
        setTimeout(() => instructions.classList.remove('glitch'), 500);
        
        return; // Don't proceed with checking
    }
    
    // Count correct selections
    correctCount = 0;
    let correctCells = [];
    let incorrectCells = [];
    
    selectedCells.forEach(selectedIndex => {
        if (targetCells.includes(selectedIndex)) {
            correctCount++;
            correctCells.push(selectedIndex);
        } else {
            incorrectCells.push(selectedIndex);
        }
    });
    
    // Highlight correct and incorrect selections
    correctCells.forEach(index => {
        gridCells[index].classList.add('correct');
    });
    
    incorrectCells.forEach(index => {
        gridCells[index].classList.add('incorrect');
    });
    
    // Show missed targets
    targetCells.forEach(index => {
        if (!selectedCells.includes(index)) {
            setTimeout(() => {
                gridCells[index].classList.add('target');
            }, 1000);
        }
    });
    
    // Determine success based on correctness threshold
    const successThreshold = targetCount * 0.75; // 75% correct to succeed
    const success = correctCount >= successThreshold;
    
    setTimeout(() => {
        showResult(success);
    }, 1500);
}

// Show the success or failure result
function showResult(success) {
    const resultElement = document.getElementById('hackResult');
    const resultIcon = document.querySelector('.result-icon');
    const resultText = document.querySelector('.result-text');
    
    resultElement.style.display = 'flex';
    
    if (success) {
        resultIcon.className = 'result-icon success';
        resultText.className = 'result-text success';
        resultText.textContent = 'ACCESS GRANTED';
        currentPhase = 'success';
    } else {
        resultIcon.className = 'result-icon failure';
        resultText.className = 'result-text failure';
        resultText.textContent = 'ACCESS DENIED';
        currentPhase = 'failure';
    }
    
    // Send result back to the client after showing the result
    setTimeout(() => {
        sendResult(success);
    }, 2000);
}

// Send the result back to the FiveM client
function sendResult(success) {
    fetch('https://bridge-hack/hackResult', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
            success: success
        })
    }).catch(error => console.error('Error:', error));
}

// Start the game
function startGame() {
    generateTargets();
    setTimeout(() => {
        startMemorizePhase();
    }, 1000);
}

// Reset the game
function resetGame() {
    clearInterval(timerInterval);
    currentPhase = 'idle';
    targetCells = [];
    selectedCells = [];
    createGrid();
    updateProgress();
    
    // Reset UI elements
    document.getElementById('hackStatus').textContent = 'MEMORY SEQUENCE REQUIRED';
    document.getElementById('hackInstructions').textContent = 'Preparing sequence...';
    document.getElementById('hackInstructions').style.color = '#aaa';
    document.getElementById('submitHack').style.display = 'none';
    document.getElementById('hackResult').style.display = 'none';
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    createGrid();
    
    // Submit button event listener
    document.getElementById('submitHack').addEventListener('click', function() {
        checkResult(true);
    });
});

// Escape key to exit (for development and testing)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        sendResult(false);
    }
});