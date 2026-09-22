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

- Use the arrow keys (Up, Down, Left, Right) to control the direction of the snake.
- Eat the food to increase your score.
- Cross any board edge to continue from the opposite side. Avoid colliding with the snake's own body.
- Click **Let’s play** or press an arrow key to start.
- Press **Space** or use the **Pause** button to pause and resume.
- Use the on-screen arrows on mobile. Sound is off initially; toggle **Sound off** to enable it.
- Your personal best is saved in this browser. Switching tabs automatically pauses the game.

## Interface

The responsive interface pairs a cream background and score cards with a forest-green game board, a mint snake, and orange food. Start, pause, and game-over screens appear inside the board.

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
