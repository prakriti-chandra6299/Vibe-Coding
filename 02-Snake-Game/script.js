
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game screen elements
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const homeButton = document.getElementById("homeButton");
const overlayHomeButton = document.getElementById("overlayHomeButton");

const scoreElement = document.getElementById("score");
const powerProgressFill = document.getElementById("powerProgressFill");
const powerProgressText = document.getElementById("powerProgressText");
const highScoreElement = document.getElementById("highScore");
const gameMessage = document.getElementById("gameMessage");
const gameTimer = document.getElementById("gameTimer");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const pauseButton = document.getElementById("pauseButton");
const gameOverlay = document.getElementById("gameOverlay");

const finalScore = document.getElementById("finalScore");
const finalHighScore = document.getElementById("finalHighScore");
const overlayRestartButton =
    document.getElementById("overlayRestartButton");

const difficultySelect = document.getElementById("difficulty");

// Statistics elements
const statsButton = document.getElementById("statsButton");
const statsPanel = document.getElementById("statsPanel");
const statsScore = document.getElementById("statsScore");
const statsHighScore = document.getElementById("statsHighScore");
const statsTime = document.getElementById("statsTime");
const statsGamesPlayed = document.getElementById("statsGamesPlayed");

const closeStatsButton = document.getElementById("closeStatsButton");
const closeStatsButtonBottom =
    document.getElementById("closeStatsButtonBottom");

const homeHighScore = document.getElementById("homeHighScore");
const homeBestTime = document.getElementById("homeBestTime");
const homeGamesPlayed = document.getElementById("homeGamesPlayed");
const readyOverlay = document.getElementById("readyOverlay");
const playButton = document.getElementById("playButton");
const readyHomeButton = document.getElementById("readyHomeButton");
// Game settings
const gridSize = 20;

const FRUIT_TYPES = [
    { name: "Apple", emoji: "🍎", points: 100, color: "#ff3b52", weight: 50 },
    { name: "Orange", emoji: "🍊", points: 200, color: "#ff9f1c", weight: 30 },
    { name: "Mango", emoji: "🥭", points: 300, color: "#ffd166", weight: 15 },
    { name: "Grapes", emoji: "🍇", points: 500, color: "#b57aff", weight: 5 }
];

const MAX_FRUITS = 5;
let fruits = [];

/* ===== MYSTERY GIFT SETTINGS ===== */

let mysteryGift = null;
let collectedGifts = [];

let giftSpawnTimeout = null;
let giftDisappearTimeout = null;

// Gifts appear occasionally, every 15–30 seconds
const GIFT_MIN_DELAY = 15000;
const GIFT_MAX_DELAY = 30000;

// A gift stays on the board for 5 seconds
const GIFT_LIFETIME = 5000;

const tileCount = canvas.width / gridSize;

const deviceModeButton = document.getElementById("deviceModeButton");
const mobileControls = document.querySelector(".mobile-controls");

const celebrationOverlay = document.getElementById("celebrationOverlay");
const celebrationScore = document.getElementById("celebrationScore");
const celebrationTokens = document.getElementById("celebrationTokens");
const celebrationContinueButton =
    document.getElementById("celebrationContinueButton");
const reviveButton = document.getElementById("reviveButton");
const reviveTokenCount = document.getElementById("reviveTokenCount");


let deviceMode = localStorage.getItem("snakeDeviceMode") || "desktop";


let snake = [];

let fruitStats = {};

let resultsTimeout = null;

function resetFruitStats() {
    fruitStats = {};

    FRUIT_TYPES.forEach(fruit => {
        fruitStats[fruit.name] = {
            emoji: fruit.emoji,
            pointsPerFruit: fruit.points,
            count: 0,
            totalPoints: 0
        };
    });
}

let food;
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let score = 0;
let gameOver = false;
let collisionPending = false;
let collisionTimeout = null;
let gameStarted = false;
let isPaused = false;

let gameLoop = null;
let countdownInterval = null;
let countdownTimeout = null;

const countdownNumber = document.getElementById("countdownNumber");
let timerInterval = null;
let elapsedSeconds = 0;
let gameSpeed = Number(difficultySelect.value);
// Power mode settings
const POWER_TARGET = 2000;
const POWER_DURATION = 2500;
const POWER_SPEED = 60;

let isPowerActive = false;
let powerTimeout = null;
let powerCharge = 0;

// Saved statistics
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;
let bestTime = Number(localStorage.getItem("snakeBestTime")) || 0;
let gamesPlayed = Number(localStorage.getItem("snakeGamesPlayed")) || 0;

let reviveTokens = Number(localStorage.getItem("snakeReviveTokens")) || 0;
let previousHighScore = highScore;
let celebrationPending = false;

// Show saved data
highScoreElement.textContent = highScore;
homeHighScore.textContent = highScore;
homeBestTime.textContent = formatTime(bestTime);
homeGamesPlayed.textContent = gamesPlayed;
updateTimerDisplay();

// Convert seconds into MM:SS
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return (
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0")
    );
}

// Update the timer display
function updateTimerDisplay() {
    gameTimer.textContent = formatTime(elapsedSeconds);
}

function updatePowerProgress() {
    const progress = Math.min(
        (powerCharge / POWER_TARGET) * 100,
        100
    );

    powerProgressFill.style.height = progress + "%";
    powerProgressText.textContent =
        `${powerCharge} / ${POWER_TARGET}`;
}


function activatePowerMode() {
    if (isPowerActive || powerCharge < POWER_TARGET) {
        return;
    }

    isPowerActive = true;
    powerCharge = 0;
    updatePowerProgress();

    clearInterval(gameLoop);

    gameMessage.textContent = "⚡ POWER MODE ACTIVATED!";
    gameLoop = setInterval(updateGame, POWER_SPEED);

    powerTimeout = setTimeout(() => {
        isPowerActive = false;

        // Reset the power bar after 2.5 seconds
        powerCharge = 0;
        updatePowerProgress();

        if (gameStarted && !gameOver) {
            clearInterval(gameLoop);
            gameSpeed = Number(difficultySelect.value);
            gameLoop = setInterval(updateGame, gameSpeed);
            gameMessage.textContent = "Use the arrow keys to move";
        }
    }, POWER_DURATION);
}




function updateDeviceMode() {
    const isMobileMode = deviceMode === "mobile";

    deviceModeButton.textContent = isMobileMode
        ? "📱 Mobile Mode"
        : "🖥️ Desktop Mode";

    deviceModeButton.setAttribute(
        "aria-pressed",
        String(isMobileMode)
    );

    mobileControls.style.display = isMobileMode ? "flex" : "none";

    document.body.classList.toggle("mobile-mode", isMobileMode);

    localStorage.setItem("snakeDeviceMode", deviceMode);
}

deviceModeButton.addEventListener("click", () => {
    deviceMode = deviceMode === "desktop" ? "mobile" : "desktop";
    updateDeviceMode();
});

updateDeviceMode();


// Start a fresh round


function startGame() {
    clearInterval(gameLoop);
    clearInterval(countdownInterval);
    clearTimeout(countdownTimeout);
    clearTimeout(giftSpawnTimeout);
    clearTimeout(giftDisappearTimeout);

    mysteryGift = null;
    collectedGifts = [];
    stopTimer();

    homeScreen.style.display = "none";
    gameScreen.style.display = "block";

    readyOverlay.style.display = "flex";
    gameOverlay.style.display = "none";
    celebrationOverlay.style.display = "none";
    celebrationPending = false;

    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    score = 0;
    elapsedSeconds = 0;
    resetFruitStats();
    clearTimeout(resultsTimeout);

    gameOverlay.style.display = "none";

    const resultsOverlay = document.getElementById("resultsOverlay");
    if (resultsOverlay) {
        resultsOverlay.style.display = "none";
    }
    scoreElement.textContent = score;

    powerCharge = 0;
    isPowerActive = false;
    updatePowerProgress();
    updateTimerDisplay();

    gameStarted = false;
    gameOver = false;
    isPaused = false;
    collisionPending = false;

    pauseButton.textContent = "⏸ Pause";
    gameMessage.textContent = "Get ready!";

    gameSpeed = Number(difficultySelect.value);

    fruits = [];
    // Generate the obstacles before placing fruit
    generateLevelObstacles();
    fillFruitGround();
    drawGame();

    startCountdown();
}

function startCountdown() {
    clearTimeout(countdownTimeout);
    clearInterval(gameLoop);

    const countdownNumber = document.getElementById("countdownNumber");

    if (!countdownNumber) {
        console.error("Countdown element not found!");
        beginRound();
        return;
    }

    readyOverlay.style.display = "flex";

    let count = 3;
    countdownNumber.textContent = count;

    function tick() {
        count--;

        if (count > 0) {
            countdownNumber.textContent = count;
            countdownTimeout = setTimeout(tick, 1000);
        } else {
            countdownNumber.textContent = "START!";

            countdownTimeout = setTimeout(() => {
                readyOverlay.style.display = "none";
                beginRound();
            }, 1000);
        }
    }

    countdownTimeout = setTimeout(tick, 1000);
}


function beginRound() {
    readyOverlay.style.display = "none";
    gameOverlay.style.display = "none";

    gameStarted = true;
    gameOver = false;
    isPaused = false;

    gameSpeed = Number(difficultySelect.value);
    pauseButton.textContent = "⏸ Pause";

    clearInterval(gameLoop);
    gameLoop = setInterval(updateGame, gameSpeed);

    startTimer();
    scheduleNextGift();
}

// Create food in an empty cell


function createFood() {
    // Choose a fruit based on its rarity
    const totalWeight = FRUIT_TYPES.reduce(
        (sum, fruit) => sum + fruit.weight, 0
    );

    let randomWeight = Math.random() * totalWeight;
    let selectedFruit = FRUIT_TYPES[0];

    for (const fruit of FRUIT_TYPES) {
        randomWeight -= fruit.weight;

        if (randomWeight < 0) {
            selectedFruit = fruit;
            break;
        }
    }

    // Find cells not occupied by the snake, fruit, or obstacles
    const availableCells = [];

    for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
            const occupiedBySnake = snake.some(
                segment => segment.x === x && segment.y === y
            );

            const occupiedByFruit = fruits.some(
                fruit => fruit.x === x && fruit.y === y
            );

            const occupiedByObstacle = obstacles.some(
                obstacle => obstacle.x === x && obstacle.y === y
            );

            if (
                !occupiedBySnake &&
                !occupiedByFruit &&
                !occupiedByObstacle
            ) {
                availableCells.push({ x, y });
            }
        }
    }

    // Stop if no empty cells remain
    if (availableCells.length === 0) {
        return;
    }

    // Choose a random available cell
    const position = availableCells[
        Math.floor(Math.random() * availableCells.length)
    ];

    // Add the new fruit
    fruits.push({
        x: position.x,
        y: position.y,
        ...selectedFruit
    });
}



           
function fillFruitGround() {
    while (fruits.length < MAX_FRUITS) {
        const previousLength = fruits.length;
        createFood();

        // Avoid an infinite loop if the board is full
        if (fruits.length === previousLength) {
            break;
        }
    }
}


// Update the game
function updateGame() {
    
    // Automatically choose a direction during power mode
    if (isPowerActive && fruits.length > 0) {
        const head = snake[0];

        const target = fruits.reduce((nearest, fruit) => {
            const distance =
                Math.abs(head.x - fruit.x) +
                Math.abs(head.y - fruit.y);

            const nearestDistance = Math.abs(head.x - nearest.x) +
                Math.abs(head.y - nearest.y);

            return distance < nearestDistance ? fruit : nearest;
        });

        const choices = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        const safeChoices = choices.filter(move => {
            // Do not allow an immediate reverse
            if (move.x === -direction.x &&
                move.y === -direction.y) {
                return false;
            }

            const x = head.x + move.x;
            const y = head.y + move.y;

            // Avoid walls and the snake's body
            return x >= 0 && x < tileCount &&
                y >= 0 && y < tileCount &&
                !snake.slice(0, -1).some(
                    segment => segment.x === x && segment.y === y
                );
        });

        if (safeChoices.length > 0) {
            safeChoices.sort((a, b) => {
                const distanceA =
                    Math.abs(head.x + a.x - target.x) +
                    Math.abs(head.y + a.y - target.y);

                const distanceB =
                    Math.abs(head.x + b.x - target.x) +
                    Math.abs(head.y + b.y - target.y);

                return distanceA - distanceB;
            });

            nextDirection = safeChoices[0];
        }
    }

    if (!gameStarted || gameOver || isPaused) {
        return;
    }

    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Check wall collision
    if (
        head.x < 0 ||
        head.x >= tileCount ||
        head.y < 0 ||
        head.y >= tileCount
    ) {
       handleCollision();
        return;
    }
    
  // Check collision with obstacles
  if (obstacles.some(obstacle =>
      obstacle.x === head.x && obstacle.y === head.y
  )) {
      handleCollision();
      return;
  }


    // Check whether the snake eats food
    const eatenFruitIndex = fruits.findIndex(
    fruit => head.x === fruit.x && head.y === fruit.y
    );

    const ateFood = eatenFruitIndex !== -1;
    // The tail moves away on a normal move
    const bodyToCheck = ateFood ? snake : snake.slice(0, -1);

    // Check self collision
    if (
        bodyToCheck.some(segment =>
            head.x === segment.x && head.y === segment.y
        )
    ) {
        handleCollision();
        return;
    }

    // Check whether the snake collects a mystery gift
    if (
        mysteryGift &&
        head.x === mysteryGift.x &&
        head.y === mysteryGift.y
    ) {
        collectedGifts.push({});
        mysteryGift = null;
        clearTimeout(giftDisappearTimeout);
    }

    snake.unshift(head);

if (ateFood) {
    const eatenFruit = fruits.splice(eatenFruitIndex, 1)[0];
    
if (fruitStats[eatenFruit.name]) {
    fruitStats[eatenFruit.name].count++;

    fruitStats[eatenFruit.name].totalPoints +=
        eatenFruit.points;
}


    // Total score always increases
    score += eatenFruit.points;
    scoreElement.textContent = score;

    // Charge the meter only outside power mode
    if (!isPowerActive) {
        powerCharge = Math.min(
            powerCharge + eatenFruit.points,
            POWER_TARGET
        );

        updatePowerProgress();
    }

    // Activate power when the meter is full
    activatePowerMode();

    // Keep your existing high-score handling below this point
    scoreElement.textContent = score;
    scoreElement.textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
        highScoreElement.textContent = highScore;
        updateHomeStats();

        if (!celebrationPending) {
            celebrationPending = true;
            celebrateNewHighScore();
        }
    }

    // One new fruit replaces the collected fruit
    fillFruitGround();
} else {
    snake.pop();
}


    drawGame();
}

// Timer runs once per round and pauses with the game
function startTimer() {
    stopTimer();

    timerInterval = setInterval(() => {
        if (gameStarted && !gameOver && !isPaused) {
            elapsedSeconds++;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

// Draw the snake and food

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
     // Draw pixel-art ground first
    drawPixelTerrain()
    // Draw obstacles on top of the ground
    obstacles.forEach(drawObstacle);
    // Draw all fruits on the board
    fruits.forEach(fruit => {
        const fx = fruit.x * gridSize + gridSize / 2;
        const fy = fruit.y * gridSize + gridSize / 2;

        ctx.save();
        ctx.shadowColor = fruit.color;
        ctx.shadowBlur = 9;

        ctx.font = "17px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(fruit.emoji, fx, fy);

        ctx.restore();
    });

    // Draw the mystery gift
    if (mysteryGift) {
        const giftX = mysteryGift.x * gridSize;
        const giftY = mysteryGift.y * gridSize;

        ctx.font = `${gridSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            "🎁",
            giftX + gridSize / 2,
            giftY + gridSize / 2
        );
    }

    
    // Draw snake body from tail to head
    for (let i = snake.length - 1; i >= 0; i--) {
        const segment = snake[i];
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const isHead = i === 0;

        // Gradient gives each segment a rounded look
        const bodyGradient = ctx.createLinearGradient(
            x, y, x + gridSize, y + gridSize
        );

        if (isHead) {
            bodyGradient.addColorStop(0, "#c5ff8a");
            bodyGradient.addColorStop(0.5, "#43ed75");
            bodyGradient.addColorStop(1, "#08a65b");
        } else {
            bodyGradient.addColorStop(0, "#7dff9d");
            bodyGradient.addColorStop(0.5, "#27d978");
            bodyGradient.addColorStop(1, "#087f61");
        }

        ctx.save();

        ctx.shadowColor = isHead
            ? "rgba(53, 255, 140, 0.65)"
            : "rgba(0, 0, 0, 0.15)";

        ctx.shadowBlur = isHead ? 10 : 3;

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.roundRect(
            x + 1,
            y + 1,
            gridSize - 2,
            gridSize - 2,
            8
        );
        ctx.fill();

        ctx.restore();

        // Shiny highlight on the segment
        ctx.fillStyle = "rgba(255,255,255,0.24)";
        ctx.beginPath();
        ctx.ellipse(x + 6, y + 5, 3, 2, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw eyes on the snake's head
    if (snake.length > 0) {
        const head = snake[0];
        const hx = head.x * gridSize;
        const hy = head.y * gridSize;

        let eye1, eye2;

        if (direction.x === 1) {
            eye1 = [hx + 14, hy + 5];
            eye2 = [hx + 14, hy + 14];
        } else if (direction.x === -1) {
            eye1 = [hx + 6, hy + 5];
            eye2 = [hx + 6, hy + 14];
        } else if (direction.y === -1) {
            eye1 = [hx + 5, hy + 6];
            eye2 = [hx + 14, hy + 6];
        } else {
            eye1 = [hx + 5, hy + 14];
            eye2 = [hx + 14, hy + 14];
        }

        [eye1, eye2].forEach(([ex, ey]) => {
            // White eye
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Dark pupil looking forward
            ctx.fillStyle = "#092b25";
            ctx.beginPath();
            ctx.arc(
                ex + direction.x,
                ey + direction.y,
                1.8,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
    }
}


// Change direction safely
function changeDirection(newDirection) {
    if (!gameStarted || gameOver || isPaused || collisionPending) {
    return;
    }
    if (newDirection === "up" && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
    } else if (newDirection === "down" && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
    } else if (newDirection === "left" && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
    } else if (newDirection === "right" && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
    }
}


 // Keyboard controls

document.addEventListener("keydown", function (event) {
    // Spacebar pauses or resumes the game
    if (event.code === "Space") {
        event.preventDefault();

        // Ignore repeated events when Space is held down
        if (event.repeat) return;

        // Only pause or resume during an active game
        if (!gameStarted || gameOver || collisionPending) return;

        togglePause();
        return;
    }

    // Arrow keys move the snake
    const keys = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
    };

    if (keys[event.key]) {
        event.preventDefault();
        changeDirection(keys[event.key]);
    }
});


 

// Mobile controls
document.querySelectorAll(".control-btn").forEach(button => {
    button.addEventListener("click", () => {
        changeDirection(button.dataset.direction);
    });
});

// Difficulty selection
difficultySelect.addEventListener("change", () => {
    gameSpeed = Number(difficultySelect.value);

    if (gameStarted && !gameOver) {
        clearInterval(gameLoop);
        gameLoop = setInterval(updateGame, gameSpeed);
    }
});

function handleCollision() {
    if (collisionPending || gameOver) return;

    collisionPending = true;

    // Freeze the snake and timer immediately
    clearInterval(gameLoop);
    stopTimer();

    // Stop power mode if it is active
    clearTimeout(powerTimeout);
    isPowerActive = false;

    // Keep the final snake position visible
    drawGame();
    gameMessage.textContent = "💥 Oops! Game over...";

    // Show the Game Over popup after 3 seconds
    collisionTimeout = setTimeout(() => {
        collisionPending = false;
        endGame();
    }, 2000);
}


// End the round

function endGame() {
    gameStarted = false;
    gameOver = true;
    isPaused = false;
    collisionPending = false;
    
    clearInterval(gameLoop);
    clearTimeout(giftSpawnTimeout);
    clearTimeout(giftDisappearTimeout);
    mysteryGift = null;
    stopTimer();

    clearTimeout(powerTimeout);
    isPowerActive = false;

    if (elapsedSeconds > bestTime) {
        bestTime = elapsedSeconds;
        localStorage.setItem("snakeBestTime", bestTime);
    }

   

    // Show the dramatic Game Over popup.
    gameOverlay.style.display = "flex";

    const resultsOverlay =
        document.getElementById("resultsOverlay");

    const resultsTotalScore =
        document.getElementById("resultsTotalScore");

    const resultsBestScore =
        document.getElementById("resultsBestScore");

    const resultsTime =
        document.getElementById("resultsTime");

    const resultsFruitCount =
        document.getElementById("resultsFruitCount");

    const fruitResults =
        document.getElementById("fruitResults");

    resultsTotalScore.textContent = score;
    resultsBestScore.textContent = highScore;
    resultsTime.textContent = formatTime(elapsedSeconds);

    // Build the fruit-by-fruit breakdown.
    fruitResults.innerHTML = "";

    let totalFruits = 0;

    FRUIT_TYPES.forEach(fruit => {
        const stats = fruitStats[fruit.name];

        if (!stats) return;

        totalFruits += stats.count;

        const row = document.createElement("div");
        row.className = "fruit-result-row";

        const fruitName = document.createElement("span");
        fruitName.textContent =
            `${stats.emoji} ${fruit.name}`;

        const fruitCount = document.createElement("strong");
        fruitCount.textContent = stats.count;

        const fruitPoints = document.createElement("strong");
        fruitPoints.textContent = stats.totalPoints;

        row.append(fruitName, fruitCount, fruitPoints);
        fruitResults.appendChild(row);
    });

    resultsFruitCount.textContent = totalFruits;

    reviveTokenCount.textContent = reviveTokens;
    reviveButton.disabled = reviveTokens < 1;

    reviveButton.textContent = reviveTokens > 0
        ? "❤️ Revive (1 Token)"
        : "🔒 No Revive Tokens";

    updateHomeStats();

    // Keep the bold popup visible for 2 seconds.
    clearTimeout(resultsTimeout);
    gameOverlay.style.display = "flex";
    resultsOverlay.style.display = "none";



    resultsTimeout = setTimeout(() => {
        gameOverlay.style.display = "none";

        if (collectedGifts.length > 0) {
            startGiftRewards();
        } else {
            resultsOverlay.style.display = "flex";
        }
    }, 2500);
   
}


// Pause and resume
function togglePause() {
    if (!gameStarted || gameOver) {
        return;
    }

    isPaused = !isPaused;

    if (isPaused) {
        pauseButton.textContent = "▶ Resume";
        gameMessage.textContent = "Game Paused";
        clearTimeout(giftSpawnTimeout);
    } else {
        pauseButton.textContent = "⏸ Pause";
        gameMessage.textContent = "Use the arrow keys to move";
        scheduleNextGift();
    }
}

// Refresh home page statistics
function updateHomeStats() {
    homeHighScore.textContent = highScore;
    homeBestTime.textContent = formatTime(bestTime);
    homeGamesPlayed.textContent = gamesPlayed;
}

// Show the statistics panel
function openStats() {
    statsScore.textContent = score;
    statsHighScore.textContent = highScore;
    statsTime.textContent = gameTimer.textContent;
    statsGamesPlayed.textContent = gamesPlayed;

    statsPanel.style.display = "flex";
}

function closeStats() {
    statsPanel.style.display = "none";
}

// Return home
function goHome() {
    clearInterval(gameLoop);
    stopTimer();

    gameStarted = false;
    gameOver = false;
    isPaused = false;

    gameScreen.style.display = "none";
    homeScreen.style.display = "block";
    gameOverlay.style.display = "none";
    statsPanel.style.display = "none";
    document.getElementById("resultsOverlay").style.display = "none";
    updateHomeStats();
}


let celebrationTimeout;



function celebrateNewHighScore() {
    // Award one revive token for a new personal best
    reviveTokens++;

    localStorage.setItem("snakeReviveTokens", reviveTokens);

    // Update the revive token display
    reviveTokenCount.textContent = reviveTokens;
}




function reviveGame() {
    // Revive only after Game Over and with a token available
    if (!gameOver || reviveTokens < 1) {
        return;
    }

    // Spend one revive token
    reviveTokens--;
    localStorage.setItem("snakeReviveTokens", reviveTokens);

   
    // Preserve the current snake length and reposition it
    const snakeLength = snake.length;

    // Choose a position that fits the entire snake
    const newX = snakeLength - 1 +
        Math.floor(Math.random() * (tileCount - snakeLength + 1));
    const newY = Math.floor(Math.random() * tileCount);

    snake = [];

    for (let i = 0; i < snakeLength; i++) {
        snake.push({
            x: newX - i,
            y: newY
        });
    }

    // Reset direction
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };    

    // Keep the current score, but resume the game
    gameOver = false;
    gameStarted = true;
    isPaused = false;

    // Hide Game Over and celebration overlays
    gameOverlay.style.display = "none";
    readyOverlay.style.display = "none";
    celebrationOverlay.style.display = "none";
    document.getElementById("resultsOverlay").style.display = "none";

    // Update the interface
    reviveTokenCount.textContent = reviveTokens;
    reviveButton.disabled = reviveTokens < 1;
    reviveButton.textContent = reviveTokens > 0
        ? "❤️ Revive (1 Token)"
        : "🔒 No Revive Tokens";

    pauseButton.textContent = "⏸ Pause";
    gameMessage.textContent = "❤️ Revived! Keep going!";

    
   // Refill the ground with fruits, avoiding the revived snake
    fruits = [];
    fillFruitGround();

    // Restart movement
    clearInterval(gameLoop);
    gameSpeed = Number(difficultySelect.value);
    gameLoop = setInterval(updateGame, gameSpeed);

    // Continue the timer without resetting elapsed time
    startTimer();

    // Draw the snake at the center
    drawGame();

}
// Button events
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
overlayRestartButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);

homeButton.addEventListener("click", goHome);
overlayHomeButton.addEventListener("click", goHome);

statsButton.addEventListener("click", openStats);
closeStatsButton.addEventListener("click", closeStats);
closeStatsButtonBottom.addEventListener("click", closeStats);

celebrationContinueButton.addEventListener("click", () => {
    celebrationOverlay.style.display = "none";
    clearTimeout(celebrationTimeout);
});

// Revive button works independently
reviveButton.addEventListener("click", reviveGame);

/* ===== MYSTERY GIFT FUNCTIONS ===== */

// Find a random empty cell for the gift
function createMysteryGift() {
    const availableCells = [];

    for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
            const occupiedBySnake = snake.some(
                segment => segment.x === x && segment.y === y
            );

            const occupiedByFruit = fruits.some(
                fruit => fruit.x === x && fruit.y === y
            );

            
            const occupiedByObstacle = obstacles.some(
                obstacle => obstacle.x === x && obstacle.y === y
            );

            if (!occupiedBySnake && !occupiedByFruit && !occupiedByObstacle) {
                availableCells.push({ x, y });
            }

        }
    }

    if (availableCells.length === 0) {
        return;
    }

    const position = availableCells[
        Math.floor(Math.random() * availableCells.length)
    ];

    mysteryGift = {
        x: position.x,
        y: position.y
    };

    // Remove the gift after 5 seconds if not collected
    clearTimeout(giftDisappearTimeout);

    giftDisappearTimeout = setTimeout(() => {
        mysteryGift = null;

        if (gameStarted && !gameOver) {
            drawGame();
        }
    }, GIFT_LIFETIME);

    drawGame();
}


// Schedule the next gift after a random delay
function scheduleNextGift() {
    clearTimeout(giftSpawnTimeout);

    if (!gameStarted || gameOver || isPaused) {
        return;
    }

    const delay = GIFT_MIN_DELAY +
        Math.random() * (GIFT_MAX_DELAY - GIFT_MIN_DELAY);

    giftSpawnTimeout = setTimeout(() => {
        if (gameStarted && !gameOver && !isPaused) {
            if (!mysteryGift) {
                createMysteryGift();
            }

            scheduleNextGift();
        }
    }, delay);
}

/* ===== MYSTERY GIFT REWARDS ===== */

let giftIndex = 0;
let giftBonusScore = 0;

const giftRewards = [
    {
        title: "Fruit Basket!",
        description: "A basket full of bonus points!",
        emoji: "🍎",
        type: "score",
        points: 500
    },
    {
        title: "Golden Fruit Basket!",
        description: "Amazing! You earned 1000 bonus points!",
        emoji: "🍇",
        type: "score",
        points: 1000
    },
    {
        title: "Revive Token!",
        description: "You earned one extra revive token!",
        emoji: "❤️",
        type: "token",
        points: 0
    }
];

// Display the first gift
function startGiftRewards() {
    giftIndex = 0;
    giftBonusScore = 0;

    const giftOverlay = document.getElementById("giftRewardsOverlay");

    if (collectedGifts.length === 0) {
        giftOverlay.style.display = "none";
        document.getElementById("resultsOverlay").style.display = "flex";
        return;
    }

    giftOverlay.style.display = "flex";
    document.getElementById("resultsOverlay").style.display = "none";

    document.getElementById("giftProgressText").textContent =
        `You collected ${collectedGifts.length} gift(s)!`;

    document.getElementById("giftBoxDisplay").textContent = "🎁";
    document.getElementById("giftRevealTitle").textContent =
        "Ready to open your gifts?";
    document.getElementById("giftRevealDescription").textContent =
        "Each gift holds a surprise!";

    document.getElementById("openGiftButton").style.display = "block";
    document.getElementById("openGiftButton").textContent = "🎁 Open Gift";
    document.getElementById("finishGiftsButton").style.display = "none";
}

// Open one random gift
function openNextGift() {
    if (giftIndex >= collectedGifts.length) {
        document.getElementById("openGiftButton").style.display = "none";
        document.getElementById("finishGiftsButton").style.display = "block";
        document.getElementById("giftRevealTitle").textContent =
            "All gifts opened!";
        document.getElementById("giftRevealDescription").textContent =
            `You earned ${giftBonusScore} bonus points!`;
        return;
    }

    const reward = giftRewards[
        Math.floor(Math.random() * giftRewards.length)
    ];

    document.getElementById("giftBoxDisplay").textContent = reward.emoji;
    document.getElementById("giftRevealTitle").textContent = reward.title;

    if (reward.type === "score") {
        giftBonusScore += reward.points;
        score += reward.points;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
        }

        scoreElement.textContent = score;
        document.getElementById("resultsTotalScore").textContent = score;

        document.getElementById("giftRevealDescription").textContent =
            `+${reward.points} bonus points!`;
    } else {
        reviveTokens++;
        localStorage.setItem("snakeReviveTokens", reviveTokens);

        reviveTokenCount.textContent = reviveTokens;
        reviveButton.disabled = false;
        reviveButton.textContent = "❤️ Revive (1 Token)";

        document.getElementById("giftRevealDescription").textContent =
            "One revive token added to your collection!";
    }

    giftIndex++;
    document.getElementById("giftProgressText").textContent =
        `Gift ${giftIndex} of ${collectedGifts.length} opened`;
}

// Connect the gift buttons
document.getElementById("openGiftButton").addEventListener("click", openNextGift);

document.getElementById("finishGiftsButton").addEventListener("click", () => {
    document.getElementById("giftRewardsOverlay").style.display = "none";
    document.getElementById("resultsOverlay").style.display = "flex";

    updateHomeStats();
});

/* ===== PIXEL-ART TERRAIN ===== */

// Draw a pixel-style ground tile
function drawGroundTile(x, y, type) {
    const px = x * gridSize;
    const py = y * gridSize;

    const groundColors = {
        grass: ["#438b43", "#367b39"],
        sand: ["#d9b56b", "#cba45b"],
        forest: ["#285b3a", "#214c32"],
        lava: ["#392e35", "#2c252e"],
        stone: ["#777b85", "#666a74"],
        snow: ["#e1f2ff", "#cde6f7"],
        mud: ["#62533b", "#51452f"],
        darkStone: ["#35394a", "#292d3d"],
        skyGrass: ["#79bd58", "#65a849"]
    };

    const colors = groundColors[type] || groundColors.grass;

    // Base ground tile
    ctx.fillStyle = colors[0];
    ctx.fillRect(px, py, gridSize, gridSize);

    // Small alternating pixel patch
    ctx.fillStyle = colors[1];
    ctx.fillRect(
        px + 3,
        py + 3,
        4,
        4
    );

    // Tile borders
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, gridSize, gridSize);
}

// Draw the complete terrain for the selected level
function drawPixelTerrain() {
    const level = LEVEL_CONFIGS.find(
        item => item.id === currentLevel
    );

    const groundType = level ? level.ground : "grass";
    const columns = Math.ceil(canvas.width / gridSize);
    const rows = Math.ceil(canvas.height / gridSize);

    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            drawGroundTile(x, y, groundType);
        }
    }
}

/* ===== PIXEL-ART OBSTACLES ===== */

let obstacles = [];

// Pixel-art colours for each obstacle
const OBSTACLE_COLORS = {
    tree: "#176536",
    rock: "#858b96",
    hut: "#a66b3f",
    wall: "#77717e",
    statue: "#c5bba5",
    cactus: "#34864b",
    lava: "#ff642e"
};

// Draw one obstacle on the game grid
function drawObstacle(obstacle) {
    const x = obstacle.x * gridSize;
    const y = obstacle.y * gridSize;
    const size = gridSize;

    ctx.save();

    if (obstacle.type === "tree") {
        // Trunk
        ctx.fillStyle = "#79502f";
        ctx.fillRect(x + 8, y + 10, 5, 9);

        // Pixelated leaves
        ctx.fillStyle = "#176536";
        ctx.fillRect(x + 3, y + 3, 14, 7);
        ctx.fillRect(x + 1, y + 7, 18, 6);
        ctx.fillRect(x + 5, y + 1, 10, 5);
    } else if (obstacle.type === "rock") {
        ctx.fillStyle = "#666d78";
        ctx.fillRect(x + 3, y + 8, 14, 8);

        ctx.fillStyle = "#aab0ba";
        ctx.fillRect(x + 5, y + 5, 10, 8);
        ctx.fillRect(x + 8, y + 3, 5, 4);
    } else {
        // Temporary coloured tile for other obstacle types
        ctx.fillStyle =
            OBSTACLE_COLORS[obstacle.type] || "#77717e";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    }

    ctx.restore();
}


/* ===== SNAKE ADVENTURE: LEVEL CONFIGURATION ===== */

// Each level will have its own terrain and obstacles.
// Easy, Medium, and Hard will be available for every level.

const LEVEL_CONFIGS = [
    {
        id: 1,
        name: "Green Meadow",
        ground: "grass",
        obstacles: ["tree", "rock", "hut"]
    },
    {
        id: 2,
        name: "Desert Ruins",
        ground: "sand",
        obstacles: ["cactus", "rock", "wall", "statue"]
    },
    {
        id: 3,
        name: "Forest Trail",
        ground: "forest",
        obstacles: ["tree", "rock", "hut"]
    },
    {
        id: 4,
        name: "Lava Land",
        ground: "lava",
        obstacles: ["lava", "rock", "deadTree"]
    },
    {
        id: 5,
        name: "Ancient Temple",
        ground: "stone",
        obstacles: ["wall", "statue", "rock"]
    },
    {
        id: 6,
        name: "Snowy Peaks",
        ground: "snow",
        obstacles: ["ice", "tree", "rock"]
    },
    {
        id: 7,
        name: "Swamp Lands",
        ground: "mud",
        obstacles: ["water", "tree", "rock"]
    },
    {
        id: 8,
        name: "Rocky Canyon",
        ground: "sand",
        obstacles: ["rock", "wall", "cactus"]
    },
    {
        id: 9,
        name: "Dark Castle",
        ground: "darkStone",
        obstacles: ["wall", "statue", "torch"]
    },
    {
        id: 10,
        name: "Sky Island",
        ground: "skyGrass",
        obstacles: ["tree", "rock", "bridge"]
    }
];

// The selected level and difficulty
let currentLevel = 1;
let currentDifficulty = "Easy";

/* ===== GENERATE LEVEL OBSTACLES ===== */

function generateLevelObstacles() {
    obstacles = [];

    const level = LEVEL_CONFIGS.find(
        item => item.id === currentLevel
    );

    if (!level) return;

    const obstacleCount = 12;
    let attempts = 0;

    while (
        obstacles.length < obstacleCount &&
        attempts < 500
    ) {
        attempts++;

        const x = Math.floor(Math.random() * tileCount);
        const y = Math.floor(Math.random() * tileCount);

        // Keep the starting area clear
        const nearStart =
            Math.abs(x - 10) <= 2 &&
            Math.abs(y - 10) <= 2;

        const occupiedBySnake = snake.some(
            segment => segment.x === x && segment.y === y
        );

        const occupiedByObstacle = obstacles.some(
            obstacle => obstacle.x === x && obstacle.y === y
        );

        if (
            nearStart ||
            occupiedBySnake ||
            occupiedByObstacle
        ) {
            continue;
        }

        const type = level.obstacles[
            Math.floor(Math.random() * level.obstacles.length)
        ];

        obstacles.push({ x, y, type });
    }
}

// ===== WORLD SELECTION =====

const worldCards = document.querySelectorAll(".world-card");
const selectedWorldName = document.getElementById("selectedWorldName");
const worldLabel = document.querySelector(".world-label");

worldCards.forEach((card) => {
    card.addEventListener("click", () => {
        // Get the selected world's ID
        const worldId = Number(card.dataset.world);

        // Find the matching world configuration
        const world = LEVEL_CONFIGS.find(
            (level) => level.id === worldId
        );

        // Stop if the world does not exist
        if (!world) return;

        // Update the active world
        currentLevel = worldId;

        // Update the selected card's appearance
        worldCards.forEach((item) => {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

        // Update the selected world name
        selectedWorldName.textContent = world.name;

        // Update the preview's world label
        worldLabel.textContent =
            `WORLD ${String(worldId).padStart(2, "0")} — ${world.name}`;
    });
});


