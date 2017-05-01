// Allows compatibility for requestAnimationFrame()
(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

// Constants
var BASE_COOLDOWN = 30;     // Base cooldown for clearing button
var BASE_DELAY = 60;        // Base delay when starting or restarting the game
var CLEAR_DELAY = 20;       // Delay when clear button is used
var TIME_SEC = 60;          // Amount of frames for 1 second
var SPAWN_RATE = 3;         // How many updates/frames until a spike should spawn
var PLAYER_WIDTH = 20;      // Player's width
var PLAYER_HEIGHT = 20;     // Player's height
var PLAYER_SPEED = 6;       // Player's maximum speed
var SPIKE_WIDTH = 15;       // Spike's width
var SPIKE_HEIGHT = 15;      // Spike's height
var SPIKE_SPEED_FACTOR = 3; // Spike's max speed factor
var FRICTION = 0.9;         // Friction to apply to player velocity in the x-direction
var GRAVITY = 0.5;          // Gravity to apply to player velocity in the y-direction
            
function init() {
    // Add Event Listeners
    document.getElementById("theButton").addEventListener("click", theButtonClicked);
    window.addEventListener("resize", windowResized);

    document.addEventListener("keydown", function(e) {
        // If 'a' key is down
        if (e.keyCode == 65) {
            keys.left = true;
        }

        // If 'd' key is down
        else if (e.keyCode == 68) {
            keys.right = true;
        }

        // If 'w' key is down
        else if (e.keyCode == 87) {
            keys.up = true;
        }
    });

    document.addEventListener("keyup", function(e) {
        // If 'a' key is up
        if (e.keyCode == 65) {
            keys.left = false;
        }

        // If 'd' key is up
        else if (e.keyCode == 68) {
            keys.right = false;
        }

        // If 'w' key is up
        else if (e.keyCode == 87) {
            keys.up = false;
        }
    });

    window.addEventListener("load", function() {
        update();
    });

    // Define areas as well as width and height
    var canvas = document.getElementById("canvas"),
        buttonArea = document.getElementById("buttonArea"),
        ctx = canvas.getContext("2d"),
        width = window.innerWidth * .85,
        height = window.innerHeight * .65;

    canvas.width = width;
    canvas.height = height;
    buttonArea.width = window.innerWidth * .9;
    buttonArea.height = window.innerHeight * .3;

    // Player object
    var player = {
        x : width / 2,
        y : height - PLAYER_HEIGHT,
        width : PLAYER_WIDTH,
        height : PLAYER_HEIGHT,
        speed: PLAYER_SPEED,
        velX: 0,
        velY: 0,
        jumping: false
    };

    // Key boolean object
    var keys = {
        up : false,
        left: false,
        right: false
    };

    // Define global variables
    var spikes = [],                // Contains obstacles that fall
        updates = 0,                // Update counter to reduce amount of obstacles falling
        time = 0,                   // Time counter to count frames for 1 second of cooldown
        score = 0,                  // Keeps track of score
        buttonPhase = 0,            // Indicates what button should do based on value
        cooldown = BASE_COOLDOWN,   // Cooldown counter for button to clear
        delay = BASE_DELAY;         // Delay for obstacles dropping
        pause = true;               // Pauses the game if true

    
    function theButtonClicked() {
        // First click of the button or when window is resized and game is paused
        if (buttonPhase == 0) {
            // Make text and game area visible
            document.getElementById("gameArea").style.visibility = "visible";
            document.getElementById("score").style.visibility = "visible";
            document.getElementById("nextClear").style.visibility = "visible";
            document.getElementById("textOverCanvas").style.visibility = "visible";
            
            // Unpause game and move to next button phase
            pause = false;
            buttonPhase++;
        }

        // During the game
        else if (buttonPhase == 1) {
            // If cooldown is over with, button press will clear the screen
            if (cooldown == 0) {
                // Clear canvas
                ctx.clearRect(0, 0, width, height);

                // Remove all spikes
                spikes = [];

                // Redraw player
                ctx.fillStyle = "#3371EC";
                ctx.fillRect(player.x, player.y, player.width, player.height);

                // Reset cooldown and add delay for spikes to be added
                cooldown = BASE_COOLDOWN;
                delay = CLEAR_DELAY;
            }
        }

        // After player has lost the game
        else if (buttonPhase == 2) {
            // Reset score
            document.getElementById("score").innerHTML = "Score: 0";
            score = 0;

            // Reset next clear
            document.getElementById("nextClear").innerHTML = "Next Clear: 30";
            cooldown = BASE_COOLDOWN;
            delay = BASE_DELAY;
            time = 0;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Remove all spikes
            spikes = [];

            // Reset player
            player.x = width / 2;
            player.y = height - PLAYER_HEIGHT;
            player.velX = 0;
            player.velY = 0;
            ctx.fillStyle = "#3371EC";
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Change Game Over! text back to instruction text
            document.getElementById("textOverCanvas").innerHTML = 'Press A to move left, D to move right and W to jump! Use the button to clear the screen when "Next Clear" hits 0!';

            // Restart game
            buttonPhase = 1;
            pause = false;
        }
    }

    function windowResized(e) {
        // Resize canvas and area
        width = window.innerWidth * .85;
        height = window.innerHeight * .65;
        canvas.width = width;
        canvas.height = height;
        buttonArea.width = window.innerWidth * .9;
        buttonArea.height = window.innerHeight * .3;

        // If the game is not paused, pause
        if (!pause) {
            pause = true;
            buttonPhase = 0;
        }

        // Check if player is outside right boundary
        if (player.x >= width - player.width) {
            player.x = width - player.width;
        }

        // Check if player is outside left boundary
        else if (player.x <= 0) {         
            player.x = 0;     
        }    

        // Check if player is below floor
        if (player.y >= height-player.height) {
            player.y = height - player.height;
            player.velY = 0;
            player.jumping = false;
        }

        // Redraw objects
        ctx.fillStyle = "#3371EC";
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = "red";
        for(var i = 0; i < spikes.length; i++) {
            ctx.fillRect(spikes[i].x, spikes[i].y, spikes[i].width, spikes[i].height);
        }
    }

    function update() {
        if (!pause) {
            // W is pressed
            if (keys.up) {
                // If player isn't already jumping, jump
                if(!player.jumping) {
                    player.jumping = true;
                    player.velY = -player.speed * 2;
                }
            }

            // D is pressed
            if (keys.right) {
                // If velocity in x-direction is less than maximum speed, increase it
                if (player.velX < player.speed) {             
                    player.velX++;         
                }     
            }     

            // A is pressed
            if (keys.left) {
                // If velocity in x-direction is less than maximum speed, increase it
                if (player.velX > -player.speed) {
                    player.velX--;
                }
            }

            // Introduce friction so that player doesn't keep moving without more key presses
            player.velX *= FRICTION;

            // Introduce gravity so that player falls after jumping
            player.velY += GRAVITY;

            // Move player based on current velocity
            player.x += player.velX;
            player.y += player.velY;

            // Check if player is outside right boundary
            if (player.x >= width-player.width) {
                player.x = width-player.width;
            }

            // Check if player is outside left boundary
            else if (player.x <= 0) {         
                player.x = 0;     
            }    

            // Check if player is below floor
            if (player.y >= height-player.height) {
                player.y = height - player.height;
                player.velY = 0;
                player.jumping = false;
            }

            // Add spikes if enough updates have passed or delay is not set
            if (updates >= SPAWN_RATE && delay == 0) {
                spikes.push({
                    x : 0,
                    y : 0,
                    width : SPIKE_WIDTH,
                    height : SPIKE_HEIGHT,
                    velX: 0,
                    velY: 0
                });
                spikes[spikes.length - 1].x = Math.random() * width;
                spikes[spikes.length - 1].velY = (Math.random() + 1) * SPIKE_SPEED_FACTOR;
                updates = 0;
            }

            // Move spikes based on current velocity
            for(var i = 0; i < spikes.length; i++) {
                spikes[i].x += spikes[i].velX;
                spikes[i].y += spikes[i].velY;

                // Remove spike from array if it's past edge
                if (spikes[i].y >= height) {
                    spikes.splice(i,1);
                    i--;
                    score++;
                    document.getElementById("score").innerHTML = "Score: " + score;
                }

                // Check if spike intersects with player
                else {
                    // Check top left corner and bottom left corner of spike
                    if (spikes[i].x >= player.x && spikes[i].x <= player.x + player.width) {
                        if (spikes[i].y >= player.y && spikes[i].y <= player.y + player.height) {
                            pause = true;
                            buttonPhase++;
                            document.getElementById("textOverCanvas").innerHTML = "Game Over!";
                        }

                        else if (spikes[i].y + spikes[i].height >= player.y && spikes[i].y + spikes[i].height <= player.y + player.height) {
                            pause = true;
                            buttonPhase++;
                            document.getElementById("textOverCanvas").innerHTML = "Game Over!";
                        }
                    }

                    // Check top right corner and bottom right corner of spike
                    else if (spikes[i].x + spikes[i].width >= player.x && spikes[i].x + spikes[i].width <= player.x + player.width) {
                        if (spikes[i].y >= player.y && spikes[i].y <= player.y + player.height) {
                            pause = true;
                            buttonPhase++;
                            document.getElementById("textOverCanvas").innerHTML = "Game Over!";
                        }

                        else if (spikes[i].y + spikes[i].height >= player.y && spikes[i].y + spikes[i].height <= player.y + player.height) {
                            pause = true;
                            buttonPhase++;
                            document.getElementById("textOverCanvas").innerHTML = "Game Over!";
                        }
                    }
                }
            }

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Redraw player
            ctx.fillStyle = "#3371EC";
            ctx.fillRect(player.x, player.y, player.width, player.height);

            // Redraw spikes
            ctx.fillStyle = "red";
            for(var i = 0; i < spikes.length; i++) {
                ctx.fillRect(spikes[i].x, spikes[i].y, spikes[i].width, spikes[i].height);
            }

            // If time is 60, 1 second has passed so cooldown should be decremented
            if (time >= TIME_SEC) {
                if (cooldown > 0) {
                    cooldown--;
                    document.getElementById("nextClear").innerHTML = "Next Clear: " + cooldown;
                }

                time = 0;
            }

            time++;
            updates++;
            
            // If a delay is in place, decrement it
            if (delay > 0) {
                delay--;
            }
        }

        // Call update again upon next animation frame
        requestAnimationFrame(update);
    }
}
document.addEventListener('DOMContentLoaded', init);
