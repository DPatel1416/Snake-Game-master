# Snake Mania

Welcome to Snake Mania, a classic Snake game implemented in HTML, CSS, and JavaScript.

## Getting Started

To play the game, follow these steps:

1. Clone the repository to your local machine:

    ```bash
    git clone https://github.com/DPatel1416/Snake-Game-master
    ```

2. Open the `index.html` file in your web browser.

## Gameplay

- Use the arrow keys or WASD to control the direction of the snake.
- Eat the food to increase your score.
- Cross any board edge to continue from the opposite side. Avoid colliding with the snake's own body.
- Click **Play** or press a direction key to start.
- Press **P**, **Space**, or use the **Pause** button to pause and resume. Press **R** or click **Restart** for a new run.
- Every five apples raises the level and speed, up to level 7 (11 cells per second).
- Use the on-screen arrows on mobile. Sound is off initially; toggle **Sound off** to enable it.
- Your personal best is saved in this browser. Switching tabs automatically pauses the game.

## Interface

The responsive interface uses a dark navy background, a glowing mint board, a green snake, and a red SVG apple. Score and control panels sit to the left, with level, speed, and pause controls to the right. On mobile, scores move above the board and touch controls appear below it. System fonts keep the interface independent of font downloads.

## Checks

Run the game logic regression checks with Node.js (no packages required):

```bash
node tests/game.test.cjs
```

These checks use mocked browser APIs; they do not verify visual layout or audio playback.

## Files and Structure

- **index.html:** The main HTML file containing the game structure.
- **css/style.css:** Stylesheet file for styling the game elements.
- **js/index.js:** JavaScript file with the game logic.

## Customization

Feel free to customize the game by tweaking the CSS styles, changing the game logic, or adding new features.

Enjoy playing Snake Mania!
