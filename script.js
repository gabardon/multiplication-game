// Game variables
let playerName = "";
let currentLevel = 1;
let score = 0;
let uniqueQuestions = [];
let currentQuestionIndex = 0;
let startTime;
let timerInterval;
let feedbackTimeout;

// Level configurations
const levelConfigurations = [
    {
        level: 1,
        totalQuestions: 90,
        fixedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        randomRange: [0, 9],
    },
    {
        level: 2,
        totalQuestions: 90,
        fixedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        randomRange: [11, 20],
    },
    {
        level: 3,
        totalQuestions: 90,
        fixedNumbers: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        randomRange: [0, 9],
    },
];

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const infoScreen = document.getElementById('info-screen');
const playerGreeting = document.getElementById('player-greeting');
const levelInfo = document.getElementById('level-info');
const questionEl = document.getElementById('question');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const answerInput = document.getElementById('answer');
const playerNameInput = document.getElementById('player-name');
const timerEl = document.getElementById('timer');
const congratsScreen = document.getElementById('congrats-screen');
const congratsPlayerName = document.getElementById('congrats-player-name');
const playAgainBtn = document.getElementById('play-again-btn');

// Sounds
const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');

// Event listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('submit-btn').addEventListener('click', checkAnswer);
playAgainBtn.addEventListener('click', playAgain);
document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);


document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if (welcomeScreen.style.display !== 'none') {
            startGame();
        } else if (gameScreen.style.display !== 'none') {
            checkAnswer();
        }
    }
});

function startGame() {
    playerName = playerNameInput.value.trim() || "Player";
    playerGreeting.textContent = `Hello, ${playerName}!`;

    // Load previous progress if player exists
    const storedData = localStorage.getItem(playerName);
    if (storedData) {
        const playerData = JSON.parse(storedData);
        currentLevel = playerData.level || 1;
        score = playerData.score || 0;
    } else {
        currentLevel = 1;
        score = 0;
    }

    welcomeScreen.style.display = "none";
    gameScreen.style.display = "block";
    loadLevel(currentLevel);
}

function loadLevel(level) {
    const config = levelConfigurations.find(cfg => cfg.level === level);
    if (!config) {
        showCongratsScreen();
        return;
    }

    currentLevel = level;
    uniqueQuestions = generateUniqueQuestions(config);
    currentQuestionIndex = 0;
    scoreEl.textContent = score;
    levelInfo.textContent = `Level ${level}`;
    feedbackEl.textContent = "";
    resetTimer();
    startTimer();
    loadQuestion();
}

function generateUniqueQuestions(config) {
    const { fixedNumbers, randomRange } = config;
    const [min, max] = randomRange;
    const questions = [];

    fixedNumbers.forEach(num1 => {
        const usedNumbers = new Set();
        while (usedNumbers.size < max - min + 1) {
            const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!usedNumbers.has(num2)) {
                usedNumbers.add(num2);
                questions.push([num1, num2]);
            }
        }
    });

    return questions;
}

function loadQuestion() {
    if (currentQuestionIndex >= uniqueQuestions.length) {
        endLevel();
        return;
    }

    const [num1, num2] = uniqueQuestions[currentQuestionIndex];
    questionEl.textContent = `What is ${num1} x ${num2}?`;
    answerInput.value = "";
    answerInput.focus();
}


function showLeaderboard() {
    // Hide other screens
    welcomeScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    infoScreen.style.display = 'none';
    congratsScreen.style.display = 'none';

    // Show the leaderboard screen
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    leaderboardScreen.style.display = 'block';

    // Fetch leaderboard data and display it
    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboardTableBody = document.getElementById('leaderboard-table').getElementsByTagName('tbody')[0];
    leaderboardTableBody.innerHTML = ''; // Clear the table

    // Get all stored players from localStorage
    let allPlayers = [];
    for (let i = 0; i < localStorage.length; i++) {
        const playerName = localStorage.key(i);
        const playerData = JSON.parse(localStorage.getItem(playerName));
        allPlayers.push({
            name: playerName,
            score: playerData.score,
            lastLevel: playerData.level // Include last completed level
        });
    }

    // Sort players by last level (highest first) and then by score (highest first)
    allPlayers.sort((a, b) => b.lastLevel - a.lastLevel || b.score - a.score);

    // Get top 50 players
    const top50Players = allPlayers.slice(0, 50);

    // Populate the leaderboard table
    top50Players.forEach((player, index) => {
        const row = leaderboardTableBody.insertRow();
        const rankCell = row.insertCell(0);
        const nameCell = row.insertCell(1);
        const levelCell = row.insertCell(2); // New cell for Last Level
        const scoreCell = row.insertCell(3);

        rankCell.textContent = index + 1;
        nameCell.textContent = player.name;
        levelCell.textContent = player.lastLevel; // Show last completed level
        scoreCell.textContent = player.score;
    });
}

function checkAnswer() {
    clearTimeout(feedbackTimeout);
    const userAnswer = parseInt(answerInput.value);
    const [num1, num2] = uniqueQuestions[currentQuestionIndex];
    const correctAnswer = num1 * num2;

    if (userAnswer === correctAnswer) {
        feedbackEl.textContent = "Correct!";
        feedbackEl.style.color = "green";
        score++;
        scoreEl.textContent = `Score: ${score}`;
        correctSound.play();
    } else {
        feedbackEl.textContent = `Incorrect! The correct answer is ${correctAnswer}`;
        feedbackEl.style.color = "red";
        wrongSound.play();
    }

    document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);


    currentQuestionIndex++;
    feedbackTimeout = setTimeout(() => {
        feedbackEl.textContent = "";
    }, 1000);

    if (currentQuestionIndex < uniqueQuestions.length) {
        loadQuestion();
    } else {
        endLevel();
    }
}

function endLevel() {
    stopTimer();
    const playerData = { level: currentLevel, score };
    localStorage.setItem(playerName, JSON.stringify(playerData));

    if (score === uniqueQuestions.length) {
        feedbackEl.textContent = "Level completed!";
        feedbackEl.style.color = "green";
        currentLevel++;
        setTimeout(() => loadLevel(currentLevel), 1000);
    } else {
        feedbackEl.textContent = "You failed the level.";
        setTimeout(() => loadLevel(currentLevel), 1000);
    }
}

function showCongratsScreen() {
    gameScreen.style.display = "none";
    congratsPlayerName.textContent = playerName;
    congratsScreen.style.display = "block";
    localStorage.removeItem(playerName);
}

function playAgain() {
    congratsScreen.style.display = "none";
    currentLevel = 1;
    score = 0;
    loadLevel(currentLevel);
}

function resetTimer() {
    timerEl.textContent = "00:00:00";
    clearInterval(timerInterval);
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}
