// Select DOM elements
const grid = document.querySelector(".grid");
const resultDisplay = document.querySelector(".result");
const livesDisplay = document.querySelector(".lives");
const timerDisplay = document.querySelector(".timer");
const pauseOverlay = document.querySelector(".pause-overlay");
const continueButton = document.querySelector(".continue-button");
const restartButton = document.querySelector(".restart-button");
const infoButton = document.querySelector(".info-button");
const infoOverlay = document.querySelector(".info-overlay");
const closeInfoButton = document.querySelector(".close-info-button");
const movementCooldown = 100;
const fpsDisplay = document.querySelector(".fps-display"); // Select the FPS display element

let frameCount = 0;
let fps = 0;
let lastFpsUpdateTime = 0;

let lastMoveTime = 0; // Track the time of the last move
let pausedTime = null;
let lastShotTime = 0; // Store the time of the last shot
const shotCooldown = 400;
let TheTime = Date.now();
const width = 15;
let currentShooterIndex = 202;
let alienInvaders = [];
let aliensRemoved = [];
let result = 0;
let direction = -1; // Start moving left
let goingRight = false;
let lives = 3;
let gameStarted = false;
let isPaused = false;
let animationFrameId;
let invaderInterval = 1000; // Invader movement interval in milliseconds
let lastInvaderMoveTime = 0;
let gameStartTime;
const gameTime = 50; // Total game time in seconds
let remainingTime = gameTime;
let invaderShootInterval = 800; // How often invaders shoot
let lastInvaderShootTime = 0;
let keys = {};
let totalInvaders;
let gameOver = false; // Track if the game is over
let isInfoWindowShowm = false;
// Create the grid
for (let i = 0; i < width * width; i++) {
  const square = document.createElement("div");
  grid.appendChild(square);
}
const squares = Array.from(document.querySelectorAll(".grid div"));

// Define the alien invaders
function createAliens() {
  alienInvaders = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  ];
  totalInvaders = alienInvaders.length;
}

// Draw the alien invaders
function drawInvaders() {
  alienInvaders.forEach((invader, i) => {
    if (!aliensRemoved.includes(i)) {
      squares[invader].classList.add("invader");
    }
  });
}

// Remove the alien invaders
function removeInvaders() {
  alienInvaders.forEach((invader) => {
    squares[invader].classList.remove("invader");
  });
}

// Draw the shooter
function drawShooter() {
  squares[currentShooterIndex].classList.add("shooter");
}

// Remove the shooter
function removeShooter() {
  squares[currentShooterIndex].classList.remove("shooter");
}

// Move the shooter
function moveShooter() {
  const currentTime = Date.now();

  // Check if enough time has passed since the last move
  if (currentTime - lastMoveTime >= movementCooldown) {
    // Update the last move time
    lastMoveTime = currentTime;

    // Continue with shooter movement
    removeShooter();
    if (keys["ArrowLeft"] && currentShooterIndex % width !== 0) {
      currentShooterIndex -= 1;
    }
    if (keys["ArrowRight"] && currentShooterIndex % width < width - 1) {
      currentShooterIndex += 1;
    }
    drawShooter();
  }

  // Handle shooting
  if (keys["Space"]) {
    shootLaser();
  }
}

function shootLaser() {
  if (isPaused) return; // Do nothing if the game is paused

  const currentTime = Date.now();

  // Check if enough time has passed since the last shot
  if (currentTime - lastShotTime < shotCooldown) {
    return; // Prevent shooting if the cooldown hasn't passed
  }
  let audio = new Audio("sounds/shoot.wav");
  audio.play();
  lastShotTime = currentTime; // Update the last shot time

  let currentLaserIndex = currentShooterIndex;

  function moveLaser() {
    if (squares[currentLaserIndex]) {
      squares[currentLaserIndex].classList.remove("laser");
    }
    currentLaserIndex -= width;
    if (currentLaserIndex < 0) {
      return;
    }
    squares[currentLaserIndex].classList.add("laser");

    if (squares[currentLaserIndex].classList.contains("invader")) {
      squares[currentLaserIndex].classList.remove("laser", "invader");
      squares[currentLaserIndex].classList.add("boom");
      let audio = new Audio("sounds/invaderkilled.wav");
      audio.play();

      setTimeout(
        () => squares[currentLaserIndex].classList.remove("boom"),
        250
      );

      const alienRemovedIndex = alienInvaders.indexOf(currentLaserIndex);
      if (alienRemovedIndex >= 0) {
        aliensRemoved.push(alienRemovedIndex);
      }
      result += 10;
      resultDisplay.innerHTML = "Score: " + result;

      // Check if all invaders are destroyed
      if (aliensRemoved.length === totalInvaders) {
        if (lives > 0) {
          resultDisplay.innerHTML = "You Win!";
          let audio = new Audio("sounds/win.mp3");
          audio.play();
        } else {
          resultDisplay.innerHTML = "Draw";
        }
        endGame(true); // Pass true to indicate that the player won
        return;
      }
      return;
    } else {
      requestAnimationFrame(moveLaser);
    }
  }
  requestAnimationFrame(moveLaser);
}

// Invaders shoot back
function invadersShoot(timestamp) {
  if (!lastInvaderShootTime) lastInvaderShootTime = timestamp;
  const elapsed = timestamp - lastInvaderShootTime;

  if (elapsed > invaderShootInterval && alienInvaders.length > 0) {
    const availableInvaders = alienInvaders.filter(
      (_, i) => !aliensRemoved.includes(i)
    );
    if (availableInvaders.length === 0) return;
    const shootingInvaderIndex =
      availableInvaders[Math.floor(Math.random() * availableInvaders.length)];
    let currentEnemyLaserIndex = shootingInvaderIndex;

    function moveEnemyLaser() {
      if (squares[currentEnemyLaserIndex]) {
        squares[currentEnemyLaserIndex].classList.remove("enemy-laser");
      }
      currentEnemyLaserIndex += width;
      if (currentEnemyLaserIndex >= squares.length) {
        return;
      }
      squares[currentEnemyLaserIndex].classList.add("enemy-laser");

      if (squares[currentEnemyLaserIndex].classList.contains("shooter")) {
        squares[currentEnemyLaserIndex].classList.remove("enemy-laser");
        squares[currentEnemyLaserIndex].classList.add("boom");
        setTimeout(
          () => squares[currentEnemyLaserIndex].classList.remove("boom"),
          250
        );
        lives--;
        livesDisplay.innerHTML = "Lives: " + lives + " ";
        if (lives <= 0) {
          if (aliensRemoved.length !== totalInvaders) {
            resultDisplay.innerHTML = "Game Over";
            let audio = new Audio("sounds/loser.mp3");
            audio.play();
          } else {
            resultDisplay.innerHTML = "Draw";
          }
          endGame(false); // Pass false to indicate the player lost
          return;
        }
      } else {
        requestAnimationFrame(moveEnemyLaser);
      }
    }
    requestAnimationFrame(moveEnemyLaser);
    lastInvaderShootTime = timestamp;
  }
}

// Move the invaders
function moveInvaders(timestamp) {
  if (!lastInvaderMoveTime) lastInvaderMoveTime = timestamp;
  const elapsed = timestamp - lastInvaderMoveTime;

  calculateFPS(timestamp); // Calculate and update FPS

  if (elapsed > invaderInterval) {
    const leftEdge = alienInvaders[0] % width === 0;
    const rightEdge =
      alienInvaders[alienInvaders.length - 1] % width === width - 1;

    removeInvaders();

    if (leftEdge && !goingRight) {
      for (let i = 0; i < alienInvaders.length; i++) {
        alienInvaders[i] += width;
      }
      direction = 1;
      goingRight = true;
    } else if (rightEdge && goingRight) {
      for (let i = 0; i < alienInvaders.length; i++) {
        alienInvaders[i] += width;
      }
      direction = -1;
      goingRight = false;
    }

    // Move aliens
    for (let i = 0; i < alienInvaders.length; i++) {
      alienInvaders[i] += direction;
    }

    drawInvaders();
    lastInvaderMoveTime = timestamp;

    // Increase difficulty over time, but more slowly
    if (invaderInterval > 200) {
      invaderInterval -= 1;
    }

    // Check for game over conditions
    if (
      squares[currentShooterIndex].classList.contains("invader", "shooter")
    ) {
      squares[currentShooterIndex].classList.add("boom");
      lives--;
      livesDisplay.innerHTML = "Lives: " + lives + " ";
      if (lives <= 0) {
        resultDisplay.innerHTML = "Game Over";
        let audio = new Audio("sounds/loser.mp3");
        audio.play();
        endGame(false);
        return;
      } else {
        setTimeout(() => {
          squares[currentShooterIndex].classList.remove("boom");
          removeShooter();
          currentShooterIndex = 202;
          drawShooter();
        }, 250);
      }
    }

    const invadersReachedBottom = alienInvaders.some((invader, i) => {
      return !aliensRemoved.includes(i) && invader >= squares.length - width;
    });

    if (invadersReachedBottom) {
      resultDisplay.innerHTML = "Game Over";
      let audio = new Audio("sounds/loser.mp3");
      audio.play();
      endGame(false);
      return;
    }
  }

  // Invaders shooting back
  invadersShoot(timestamp);

  // Update shooter position
  moveShooter();

  // Update timer
  updateTimer();

  // Continue the animation
  if (!isPaused) {
    animationFrameId = requestAnimationFrame(moveInvaders);
  }
}

// Update the timer
function updateTimer() {
  if (isPaused) return; // Do nothing if the game is paused

  const currentTime = Date.now(); // Get the current time in milliseconds

  if (!gameStartTime) gameStartTime = currentTime; // Set the start time only if it's not already set

  const elapsedTime = Math.floor((currentTime - gameStartTime) / 1000); // Calculate elapsed time in seconds
  remainingTime = gameTime - elapsedTime;

  timerDisplay.innerHTML = "Time: " + remainingTime;

  if (remainingTime <= 0) {
    timerDisplay.innerHTML = "Time: 0";
    resultDisplay.innerHTML = "Time Up!";
    let audio = new Audio("sounds/loser.mp3");
    audio.play();
    endGame(false);
  }
}

// Start the game
function startGame() {
  if (gameStarted || gameOver) return;
  gameStarted = true;
  result = 0;
  lives = 3;
  direction = -1;
  goingRight = false;
  aliensRemoved = [];
  currentShooterIndex = 202;
  squares.forEach((square) => {
    square.classList.remove(
      "invader",
      "shooter",
      "laser",
      "boom",
      "enemy-laser"
    );
  });
  createAliens();
  drawInvaders();
  drawShooter();
  resultDisplay.innerHTML = "Score: " + result;
  livesDisplay.innerHTML = "Lives: " + lives + " ";
  timerDisplay.innerHTML = "Time: " + gameTime + " ";
  isPaused = false;
  lastInvaderMoveTime = 0;
  lastInvaderShootTime = 0;
  invaderInterval = 1000;
  gameStartTime = null;
  gameOver = false; // Reset the gameOver flag when game restarts

  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);
  animationFrameId = requestAnimationFrame(moveInvaders);
}

// End the game
function endGame(playerWon) {
  if (gameOver) return;
  gameStarted = false;
  gameOver = true; // Set gameOver to true when game ends
  document.removeEventListener("keydown", keyDownHandler);
  document.removeEventListener("keyup", keyUpHandler);
  cancelAnimationFrame(animationFrameId);

  // Display the results page
  showResultsPage(playerWon);
}

// Pause the game
function pauseGame() {
  if (!isPaused) {
    pausedTime = Date.now(); // Capture the time when the game is paused
    isPaused = true;
  }
  if (!gameStarted) return;
  isPaused = true;
  cancelAnimationFrame(animationFrameId);
}

// Resume the game
function resumeGame() {
  if (isPaused) {
    const pauseDuration = Date.now() - pausedTime; // Calculate the time the game was paused
    gameStartTime += pauseDuration; // Adjust the gameStartTime to account for the pause duration
    isPaused = false; // Reset the pause flag
    pausedTime = null; // Clear pausedTime
  }
  if (!gameStarted) return;
  isPaused = false;
  pauseOverlay.style.display = "none";
  animationFrameId = requestAnimationFrame(moveInvaders);
}

// Restart the game and directly start it
function restartGame() {
  // Clear paused state and hide pause overlay
  keys = {}; // Clear the keys object
  isPaused = false; // Reset the paused state
  pausedTime = null; // Clear paused time
  pauseOverlay.style.display = "none"; // Hide the pause overlay

  // Cancel ongoing animations and reset game variables
  cancelAnimationFrame(animationFrameId); // Cancel any ongoing animations
  gameStarted = false;
  gameOver = false;

  const resultsPage = document.getElementById("results-page");
  if (resultsPage) {
    document.body.removeChild(resultsPage); // Remove results page if shown
  }

  // Reset grid and game variables before restarting
  squares.forEach((square) => {
    square.classList.remove(
      "invader",
      "shooter",
      "laser",
      "boom",
      "enemy-laser"
    );
  });

  result = 0;
  lives = 3;
  aliensRemoved = [];
  currentShooterIndex = 202;
  lastInvaderMoveTime = 0;
  lastInvaderShootTime = 0;
  invaderInterval = 1000;
  gameStartTime = null;
  remainingTime = gameTime;

  // Immediately start the game
  startGame(); // This will start the game without waiting for user input
}

// Handle key presses
function keyDownHandler(e) {
  if (e.code === "Escape") {
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
      pauseOverlay.style.display = "block";
    }
  } else if (e.code === "Space") {
    keys[e.code] = true;
    e.preventDefault(); // Prevent default scrolling behavior
  } else if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
    keys[e.code] = true;
  }
}

function keyUpHandler(e) {
  if (
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight" ||
    e.code === "Space"
  ) {
    keys[e.code] = false;
  }
}

// Pause menu buttons
continueButton.addEventListener("click", resumeGame);
restartButton.addEventListener("click", restartGame);

// Prevent restarting the game with the "Space" key if game is over
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !gameStarted && !gameOver) {
    startGame();
  }
});

// Display results page
function showResultsPage(playerWon) {
  if (document.getElementById("results-page")) return; // Already exists

  const resultsPage = document.createElement("div");
  resultsPage.className = "results-page";
  resultsPage.id = "results-page";
  resultsPage.style.position = "absolute";
  resultsPage.style.top = "50%";
  resultsPage.style.left = "50%";
  resultsPage.style.transform = "translate(-50%, -50%)";
  resultsPage.style.textAlign = "center";
  resultsPage.style.color = "yellow";
  resultsPage.style.backgroundColor = "#000000";
  resultsPage.style.padding = "20px";
  resultsPage.style.border = "2px solid #ffeb3b";
  resultsPage.style.fontFamily = "'Press Start 2P', cursive";
  resultsPage.style.fontSize = "24px";

  const title = document.createElement("h1");
  title.innerHTML = playerWon ? "You Win!" : "Game Over";

  const score = document.createElement("p");
  score.innerHTML = `Final Score: ${result}`;

  const time = document.createElement("p");
  time.innerHTML = `Time Left: ${remainingTime > 0 ? remainingTime : 0}`;

  const restartBtn = document.createElement("button");
  restartBtn.innerHTML = "Restart";
  restartBtn.style.marginTop = "20px";
  restartBtn.style.padding = "10px 20px";
  restartBtn.style.cursor = "pointer";
  restartBtn.onclick = () => {
    restartGame();
  };

  resultsPage.appendChild(title);
  resultsPage.appendChild(score);
  resultsPage.appendChild(time);
  resultsPage.appendChild(restartBtn);

  document.body.appendChild(resultsPage);
}

// Pause the game and show the info window
infoButton.addEventListener("click", () => {
  pauseGame(); // Pause the game
  infoOverlay.style.display = "block"; // Show the info overlay
});

// Close the info window and resume the game
closeInfoButton.addEventListener("click", () => {
  infoOverlay.style.display = "none"; // Hide the info overlay
  resumeGame(); // Resume the game
});

function calculateFPS() {
  // Increment the frame count
  frameCount++;

  // Update FPS once per second
  const currentTime = Date.now();
  if (currentTime - lastFpsUpdateTime >= 1000) {
    // Every second
    fps = frameCount; // Frames in the last second
    fpsDisplay.innerHTML = `FPS: ${fps}`;
    frameCount = 0; // Reset the frame count
    lastFpsUpdateTime = currentTime; // Update the last FPS update time
  }
}
