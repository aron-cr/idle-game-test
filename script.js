// Initial Game State
let gameState = {
    yellowCurrency: 0,
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
const yellowCurrencyDisplay = document.getElementById('yellow-currency');
const greenCurrencyDisplay = document.getElementById('green-currency');
const blueCurrencyDisplay = document.getElementById('blue-currency');
const redCurrencyDisplay = document.getElementById('red-currency');
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
    constructor(color, value, bounceLimit, x, y, vx, vy) {
        this.radius = 10;
        this.color = color;
        this.value = value;
        this.bounceLimit = bounceLimit;
        this.bounceCount = 0;
        this.x = x;
        this.y = y;
        const angle = Math.random() * 2 * Math.PI;
        this.vx = vx;
        this.vy = vy;
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
        gameState.yellowCurrency += this.value;
        gameState[`${this.color}Currency`] += 1;
        updateDisplay();
    }

    isExpired() {
        return this.bounceCount >= this.bounceLimit;
    }
}

// Cannon class to handle ball spawning
class Cannon {
    constructor(color, x, y, angleSpeed) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 4; // Start pointing upwards
        this.angleSpeed = angleSpeed;
        this.direction = 1; // To control the rotation (1 for down, -1 for up)
    }

    draw() {
        const width = 50;
        const height = 25;
        const radius = 5; // Radius for rounded left corners
    
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
    
        // Begin path for rectangle with rounded left corners
        ctx.beginPath();
        ctx.moveTo(radius, -height / 2); // Start just after the top-left corner
    
        // Top side and top-left corner
        ctx.arcTo(0, -height / 2, 0, height / 2, radius); // Round top-left corner
    
        // Left side and bottom-left corner
        ctx.lineTo(0, height / 2 - radius); // Straight line down on the left side
        ctx.arcTo(0, height / 2, radius, height / 2, radius); // Round bottom-left corner
    
        // Bottom side (straight across)
        ctx.lineTo(width, height / 2); // Straight line along the bottom
    
        // Right side (straight up)
        ctx.lineTo(width, -height / 2); // Straight line up the right side
    
        // Connect back to start point
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    update() {
        // Rotate the cannon up and down within a specific range
        if (this.angle > Math.PI / 4 || this.angle < -Math.PI / 4) {
            this.direction *= -1;
        }
        this.angle += this.angleSpeed * this.direction;
        this.draw();
    }

    shootBall(value, bounceLimit, speed) {
        // Calculate the initial velocity based on the cannon's angle
        const vx = Math.cos(this.angle) * speed;
        const vy = Math.sin(this.angle) * speed;
        balls.push(new Ball(this.color, value, bounceLimit, this.x+40*Math.cos(this.angle), this.y+40*Math.sin(this.angle), vx, vy));
    }
}

// Initialize cannons
const cannons = [
    new Cannon('green', 0, ballCanvas.height / 4, 0.02),
    new Cannon('blue', 0, ballCanvas.height / 2, 0.02),
    new Cannon('red', 0, (3 * ballCanvas.height) / 4, 0.02)
];

// Update Display
function updateDisplay() {
    const currencies = [
        { element: document.getElementById('yellow-currency'), value: gameState.yellowCurrency },
        { element: document.getElementById('green-currency'), value: gameState.greenCurrency },
        { element: document.getElementById('blue-currency'), value: gameState.blueCurrency },
        { element: document.getElementById('red-currency'), value: gameState.redCurrency }
    ];

    currencies.forEach(currency => {
        currency.element.textContent = currency.value;
        currency.element.classList.toggle('zero', currency.value === 0);
    });
}

// Upgrade Ball
function upgradeBall(ball, type) {
    const level = ball[`${type}Level`] || 0;
    const cost = upgradePrices[type][level];
    const currencyType = type === 'speed' ? 'blueCurrency' : type === 'value' ? 'redCurrency' : type === 'maxBalls' ? 'yellowCurrency' : 'greenCurrency';

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
    if (gameState.yellowCurrency >= ball.cost && ball.currentBalls < ball.maxBalls) {
        gameState.yellowCurrency -= ball.cost;
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
        button.onclick = () => {
            const cannon = cannons.find(c => c.color === ball.color);
            if (cannon && gameState.yellowCurrency >= ball.cost && ball.currentBalls < ball.maxBalls) {
                gameState.yellowCurrency -= ball.cost;
                cannon.shootBall(ball.value, ball.bounceLimit, ball.speed);
                ball.currentBalls += 1;
                updateDisplay();
                renderUpgrades();
            }
        };
        ballButtonsDiv.appendChild(button);
    });
}

// Animation Loop to update cannons and balls
function animateBalls() {
    ctx.clearRect(0, 0, ballCanvas.width, ballCanvas.height);
    
    // Update cannons
    cannons.forEach(cannon => cannon.update());
    
    // Update balls
    balls = balls.filter(ball => {
        ball.update();
        if (ball.isExpired()) {
            const ballType = gameState.ballLists.find(b => b.color === ball.color);
            ballType.currentBalls -= 1;
            return false; // Remove expired ball
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

        // Add upgrade buttons for each type (speed, value, bounceLimit, maxBalls)
        ['speed', 'value', 'bounceLimit', 'maxBalls'].forEach(type => {
            const level = ball[`${type}Level`] || 0;
            const cost = upgradePrices[type][level] || 'MAX';
            const button = document.createElement('button');
            
            // Display ball icons for currency costs instead of text
            const currencyIcon = document.createElement('span');
            currencyIcon.classList.add(type === 'speed' ? 'blue-ball' : type === 'value' ? 'red-ball' : type === 'bounceLimit' ? 'green-ball' : 'yellow-ball');
            button.textContent = `${cost} `;
            //button.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Upgrade (${cost} `;
            button.appendChild(currencyIcon);
            button.append(` ${type.charAt(0).toUpperCase() + type.slice(1)} Upgrade`);  // Append closing parenthesis after the icon

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