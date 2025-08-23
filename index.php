<?php
// Entry point for Depths of Deaths
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Depths of Deaths</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="town-screen" class="screen active">
        <h1>Depths of Deaths - Town</h1>
        <p>Upgrade buildings to unlock more features.</p>
        <div id="buildings"></div>
        <button id="start-run">Start Run</button>
    </div>

    <div id="game-screen" class="screen">
        <h2>Current Floor: <span id="floor-number">1</span></h2>
        <div id="stats" class="panel"></div>
        <div id="currencies" class="panel"></div>
        <div id="floor-grid" class="grid"></div>
        <button id="next-floor" disabled>Next Floor</button>
    </div>

    <div id="combat-screen" class="screen">
        <h2>Combat</h2>
        <div id="combat-log" class="panel"></div>
        <div id="ability-grid" class="grid abilities"></div>
        <button id="strike-btn">Strike</button>
        <button id="potion-btn">Health Potion</button>
        <button id="end-turn-btn">End Turn</button>
    </div>

    <script src="js/game.js"></script>
</body>
</html>
