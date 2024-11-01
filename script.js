// Initial Game State
let gameState = {
    currency: 0,
    greenCurrency: 0,
    blueCurrency: 0,
    redCurrency: 0,
    ballLists: [
        { name: 'Green Ball', cost: 0, color: 'green', value: 1, bounceLimit: 1, speed: 2 , maxBalls: 3, currentBalls: 0},
        { name: 'Blue Ball', cost: 10, color: 'blue', value: 1, bounceLimit: 20, speed: 2, maxBalls: 3, currentBalls: 0 },
        { name: 'Red Ball', cost: 50, color: 'red', value: 5, bounceLimit: 20, speed: 2 , maxBalls: 3, currentBalls: 0}
    ]
};

// Custom price table for upgrades (speed, value, bounce limit)
const upgradePrices = {
    speed: [5, 10, 20, 30, 50, 75, 100, 130, 170, 220],
    value: [5, 10, 20, 40, 60, 90, 130, 180, 240, 310],
    bounceLimit: [10, 20, 30, 50, 80, 120, 170, 230, 300, 380],
    maxBalls: [10, 20, 40, 70, 110, 160, 220, 290, 370, 460] // Custom upgrade prices for maxBalls
};

// Elements
const currencyDisplay = document.getElementById('currency-display');
const ballButtonsDiv = document.getElementById('balls');
const ballCanvas = document.getElementById('ball-canvas');
const ctx = ballCanvas.getContext('2d');
const upgradesDiv = document.getElementById('upgrades');

// State to track open upgrade sections
const openSections = {};

// Resize canvas to match CSS
ballCanvas.width = ballCanvas.clientWidth;
ballCanvas.height = 300;

// Array to store balls
let balls = [];

// Ball Class
class Ball {
    constructor(color, value, bounceLimit, speed) {
        this.radius = 10;
        this.color = color;
        this.value = value;
        this.bounceLimit = bounceLimit;
        this.bounceCount = 0;
        this.x = Math.random() * (ballCanvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (ballCanvas.height - this.radius * 2) + this.radius;
        const angle = Math.random() * 2 * Math.PI;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x + this.radius > ballCanvas.width || this.x - this.radius < 0) {
            this.vx = -this.vx;
            this.bounce();
        }
        if (this.y + this.radius > ballCanvas.height || this.y - this.radius < 0) {
            this.vy = -this.vy;
            this.bounce();
        }
        this.draw();
    }

    bounce() {
        this.bounceCount += 1;
        gameState.currency += this.value;
        gameState[`${this.color}Currency`] += 1;
        updateDisplay();
    }

    isExpired() {
        return this.bounceCount >= this.bounceLimit;
    }
}

// Update Display
function updateDisplay() {
    currencyDisplay.textContent = `Currency: ${gameState.currency}`;
    document.getElementById('green-currency').textContent = `Green: ${gameState.greenCurrency}`;
    document.getElementById('blue-currency').textContent = `Blue: ${gameState.blueCurrency}`;
    document.getElementById('red-currency').textContent = `Red: ${gameState.redCurrency}`;
}

// Upgrade Ball
function upgradeBall(ball, type) {
    const level = ball[`${type}Level`] || 0;
    const cost = upgradePrices[type][level];
    const currencyType = type === 'speed' ? 'blueCurrency' : type === 'value' ? 'redCurrency' : type === 'maxBalls' ? 'currency' : 'greenCurrency';

    if (gameState[currencyType] >= cost) {
        gameState[currencyType] -= cost;
        ball[`${type}Level`] = (ball[`${type}Level`] || 0) + 1;
        if (type === 'speed') ball.speed += 1;
        if (type === 'value') ball.value += 1;
        if (type === 'bounceLimit') ball.bounceLimit *= 2;
        if (type === 'maxBalls') ball.maxBalls += 1;
        updateDisplay();
        renderUpgrades();
    }
}



// Buy Ball
function buyBall(ball) {
    if (gameState.currency >= ball.cost && ball.currentBalls < ball.maxBalls) {
        gameState.currency -= ball.cost;
        addBall(ball.color, ball.value, ball.bounceLimit, ball.speed);
        ball.currentBalls += 1;
        updateDisplay();
        renderUpgrades();
    }
}

// Add Ball
function addBall(color, value, bounceLimit, speed) {
    balls.push(new Ball(color, value, bounceLimit, speed));
}

// Render Ball Buttons
function renderBallButtons() {
    ballButtonsDiv.innerHTML = '';
    gameState.ballLists.forEach(ball => {
        const button = document.createElement('button');
        button.textContent = `${ball.name} (Cost: ${ball.cost})`;
        button.onclick = () => buyBall(ball);
        ballButtonsDiv.appendChild(button);
    });
}

// Animation Loop
function animateBalls() {
    ctx.clearRect(0, 0, ballCanvas.width, ballCanvas.height);
    balls = balls.filter(ball => {
        ball.update();
        if (ball.isExpired()) {
            // Decrement the currentBalls count for the specific ball type
            const ballType = gameState.ballLists.find(b => b.color === ball.color);
            ballType.currentBalls -= 1;
            return false;  // Remove the ball from the array
        }
        return true;
    });
    requestAnimationFrame(animateBalls);
}
// Toggle visibility of the upgrades for a specific ball type
function toggleUpgradeSection(ballName) {
    openSections[ballName] = !openSections[ballName];
    renderUpgrades();
}

// Render Upgrades with collapsible sections
function renderUpgrades() {
    upgradesDiv.innerHTML = '';
    gameState.ballLists.forEach(ball => {
        // Create the header for each ball type
        const header = document.createElement('h3');
        header.textContent = `${ball.name} Upgrades`;
        header.onclick = () => toggleUpgradeSection(ball.name);
        
        // Create the container for the upgrade buttons
        const upgradeContainer = document.createElement('div');
        upgradeContainer.classList.add('upgrade-buttons');
        upgradeContainer.id = `${ball.name}-upgrades`;

        // Set visibility based on openSections
        upgradeContainer.style.display = openSections[ball.name] ? 'block' : 'none';

        // Add upgrade buttons for each type (speed, value, bounceLimit)
        ['speed', 'value', 'bounceLimit', 'maxBalls'].forEach(type => {
            const level = ball[`${type}Level`] || 0;
            const cost = upgradePrices[type][level] || 'MAX';
            const button = document.createElement('button');
            button.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Upgrade (Cost: ${cost} ${type === 'speed' ? 'Blue' : type === 'value' ? 'Red' : type === 'bounceLimit' ? 'Green' :'Currency'})`;
            button.disabled = cost === 'MAX';
            button.onclick = () => upgradeBall(ball, type);
            upgradeContainer.appendChild(button);
        });

        // Append header and upgrade container to the upgrades div
        upgradesDiv.appendChild(header);
        upgradesDiv.appendChild(upgradeContainer);
    });
}
// Initialize
renderBallButtons();
renderUpgrades();
animateBalls();