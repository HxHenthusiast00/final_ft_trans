class AiComponent extends HTMLElement {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
        this.ball = { x: 500, y: 250, radius: 10, dx: 5, dy: 5 };
        this.paddle1 = { x: 10, y: 200, width: 10, height: 120 };  // Player
        this.paddle2 = { x: 980, y: 200, width: 10, height: 120 }; // AI
        this.keys = {};
        this.paddleSpeed = 7;
        this.score1 = 0;
        this.score2 = 0;
        this.playerName = '';
        this.gameStarted = false;
        this.lastAIUpdate = 0;  // Timestamp for AI updates
        this.predictedBallY = 250;  // AI's prediction of where ball will be
        this.difficultyLevel = 0.85; // AI win rate adjustment (85% accuracy)
    }

    connectedCallback() {
        this.showPlayerRegistration();
    }

    showPlayerRegistration() {
        this.innerHTML = `
            <div class="login-container">
                <h2>Player Registration</h2>
                <div class="form-group">
                    <input type="text" id="playerName" placeholder="Enter Your Name">
                </div>
                <button class="btn" id="startGame">Start Game</button>
            </div>
        `;
        this.querySelector('#startGame').addEventListener('click', () => {
            const nameInput = this.querySelector('#playerName');
            const playerName = nameInput.value.trim();
            if (playerName) {
                this.playerName = playerName;
                this.initializeGame();
            } else {
                alert('Please enter your name.');
            }
        });
    }

    initializeGame() {
        this.innerHTML = `
            <div id="gameArea">
                <div class="score-container" id="scoreBoard">
                    <span class="score" id="player1Score">${this.playerName}: 0</span> -
                    <span class="score" id="player2Score">AI: 0</span>
                </div>
                <canvas id="pongCanvas" width="1000" height="500"></canvas>
            </div>
        `;

        this.canvas = this.querySelector('#pongCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        this.gameStarted = true;
        this.gameLoop();
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    updateAI() {
        const now = Date.now();
        // Only update AI decision once per second
        if (now - this.lastAIUpdate >= 1000) {
            this.predictBallPosition();
            this.lastAIUpdate = now;
        }

        // Move paddle towards predicted position with human-like constraints
        const paddleCenter = this.paddle2.y + this.paddle2.height / 2;
        const targetY = this.predictedBallY;

        // Add some randomness to make it less perfect
        const randomError = (Math.random() - 0.5) * 30 * (1 - this.difficultyLevel);
        const adjustedTargetY = targetY + randomError;

        // Move paddle with speed constraints
        if (Math.abs(paddleCenter - adjustedTargetY) > 10) { // Add dead zone for more human-like behavior
            if (paddleCenter < adjustedTargetY && this.paddle2.y < this.canvas.height - this.paddle2.height) {
                this.paddle2.y += this.paddleSpeed;
            } else if (paddleCenter > adjustedTargetY && this.paddle2.y > 0) {
                this.paddle2.y -= this.paddleSpeed;
            }
        }
    }

    predictBallPosition() {
        // Simple prediction logic considering ball's current trajectory
        if (this.ball.dx > 0) { // Only predict when ball is moving towards AI
            let futureX = this.ball.x;
            let futureY = this.ball.y;
            let futureDy = this.ball.dy;
            
            // Simulate ball path
            while (futureX < this.paddle2.x) {
                futureX += this.ball.dx;
                futureY += futureDy;
                
                // Simulate bounces off top and bottom
                if (futureY < 0 || futureY > this.canvas.height) {
                    futureDy *= -1;
                }
            }
            
            this.predictedBallY = futureY;
        }
    }

    update() {
        // Update player paddle
        if (this.keys['w'] && this.paddle1.y > 0) {
            this.paddle1.y -= this.paddleSpeed;
        }
        if (this.keys['s'] && this.paddle1.y < this.canvas.height - this.paddle1.height) {
            this.paddle1.y += this.paddleSpeed;
        }

        // Update AI paddle
        this.updateAI();

        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Ball collision with top and bottom
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
        }

        // Ball collision with paddles
        if (this.checkPaddleCollision(this.ball, this.paddle1) || 
            this.checkPaddleCollision(this.ball, this.paddle2)) {
            this.ball.dx *= -1;
            // Add slight randomization to make gameplay more interesting
            this.ball.dy += (Math.random() - 0.5) * 2;
        }

        // Score points
        if (this.ball.x < 0) {
            this.score2++;
            this.resetBall();
        } else if (this.ball.x > this.canvas.width) {
            this.score1++;
            this.resetBall();
        }

        this.updateScoreDisplay();

        // Check for winner
        if (this.score1 >= 5 || this.score2 >= 5) {
            this.showWinnerPopup();
        }
    }

    checkPaddleCollision(ball, paddle) {
        return (ball.x - ball.radius < paddle.x + paddle.width &&
                ball.x + ball.radius > paddle.x &&
                ball.y + ball.radius > paddle.y &&
                ball.y - ball.radius < paddle.y + paddle.height);
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 5 : -5);
        this.ball.dy = (Math.random() - 0.5) * 6;
    }

    updateScoreDisplay() {
        const player1ScoreElement = this.querySelector('#player1Score');
        const player2ScoreElement = this.querySelector('#player2Score');
        
        if (player1ScoreElement && player2ScoreElement) {
            player1ScoreElement.textContent = `${this.playerName}: ${this.score1}`;
            player2ScoreElement.textContent = `AI: ${this.score2}`;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.ctx.strokeStyle = 'white';
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();

        // Draw paddles
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    gameLoop() {
        if (!this.gameStarted) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    showWinnerPopup() {
        this.gameStarted = false;
        const winner = this.score1 >= 5 ? this.playerName : 'AI';
        
        this.innerHTML = `
            <div class="login-container">
                <h2 class="login-title">Game Over</h2>
                <p class="word">${winner} wins!</p>
                <button class="btn" id="restartGame">Play Again</button>
                <button class="btn" id="returnToDashboard">Return to Dashboard</button>
            </div>
        `;
        this.querySelector('#restartGame').addEventListener('click', () => {
            this.score1 = 0;
            this.score2 = 0;
            this.resetBall();
            this.initializeGame();
        });
        this.querySelector('#returnToDashboard').addEventListener('click', () => {
            window.location.hash = '#dashboard';
        });
    }
}

customElements.define('ai-component', AiComponent);
