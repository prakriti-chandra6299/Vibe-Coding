# Snake Game — Testing Report

This document summarizes the manual testing performed on the Pixel × Neon Snake Game.

## 1. Home Screen and Navigation

- Home screen renders correctly.
- Start Game begins the countdown and gameplay.
- World selection updates the selected world.
- The selected world loads when gameplay starts.
- Difficulty and play-mode controls work correctly.
- Home and restart navigation work correctly.

## 2. Gameplay and Controls

- Snake movement responds to supported controls.
- Fruit collection updates the score and snake length.
- Wall, self, and obstacle collisions end the game correctly.
- Pause and resume work through the available controls.

## 3. Worlds and Obstacles

- All 10 worlds are selectable without unlocking.
- Each world displays its intended terrain and obstacles.
- Snake and fruit placement avoids obstacles.
- Obstacle collisions behave as expected.

## 4. Fruits, Rewards, and Power-Ups

- All fruit types award their intended points.
- Mystery gifts spawn, disappear, and trigger the reward screen correctly.
- Reward outcomes are applied correctly.
- Revive tokens are saved and used correctly.
- Power mode activates and ends as intended.

## 5. Statistics and Saved Data

- High score, best time, and games played update correctly.
- Supported statistics persist after refreshing the page.
- Missing or cleared local storage does not break the game.

## 6. Responsive Design and Browser Compatibility

- Desktop layout displays correctly.
- Mobile layout and on-screen controls work as expected.
- Required game assets load correctly.
- No unexpected browser console errors were observed during testing.

## 7. Test Record

- **Project:** Pixel × Neon Snake Game
- **Testing method:** Manual testing
- **Local testing:** Completed for the features listed above.
- **Deployment testing:** Pending
- **Test date:** 14 October 2026

## Notes

The deployed version must be tested after publication. Update this report if future changes introduce new features or reveal issues.