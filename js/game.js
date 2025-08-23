// Core game logic for Depths of Deaths

// ---- Data Structures ----
const Buildings = {
    blacksmith: {name: 'Blacksmith', level: 0, max: 1, desc: 'Unlocks the Forge Tile.\n100% chance per floor to generate the Forge Tile.'},
    huntersTent: {name: "Hunters Tent", level: 0, max: 1, desc: 'Unlocks the Practice Tile.\n25% chance per floor to generate the Practice Tile.'},
    magesGuild: {name: "Mage's Guild", level: 0, max: 1, desc: 'Unlocks the Skill Selection Tile.\n25% chance per floor to generate the Skill Selection Tile.'},
    merchantGuild: {name: "Merchant's Guild", level: 0, max: 3, desc: 'Increases the number of available items at Merchant Tiles by 5 per level (Max 3 Levels.)'},
    alchemyStand: {name: 'Alchemy Stand', level: 0, max: 1, desc: 'Unlocks additional Potion Crafts like temporary stat boosts.'},
    mystic: {name: 'Mystic', level: 0, max: 1, desc: 'Unlocks the Scroll Crafting option.'},
    trainingCamp: {name: 'Training Camp', level: 0, max: 5, desc: 'Increases Talents offered when leveling.'},
    biggerVials: {name: 'Bigger Vials', level: 0, max: 5, desc: 'Increases healing of potions by 20% per level.'},
    scholarsTower: {name: "Scholar's Tower", level: 0, max: 1, desc: 'Enables a single reroll for Talent selection.'},
    postOffice: {name: 'Post Office', level: 0, max: 1, desc: 'Enables 1-3 rerolls for the Merchant.'},
    temple: {name: 'Temple', level: 0, max: 1, desc: 'Unlocks Gifts from Above.'}
};

let player = {
    level: 1,
    damage: 10,
    armor: 0,
    healthRegen: 0,
    lifesteal: 0,
    strength: 5,
    health: 100,
    maxHealth: 100,
    critDamage: 50,
    thorns: 0,
    healing: 0,
    armorPen: 0,
    dexterity: 5,
    critChance: 5,
    dodge: 0,
    extraTurn: 0,
    cooldownReduction: 0,
    intelligence: 5,
    mana: 50,
    maxMana: 50,
    manaRegen: 5,
    abilityPower: 0,
    currencies: {wood: 0, iron: 0, herbs: 0, embers: 0, essence: 0},
    potionCooldown: 0
};

let currentFloor = 1;
let tiles = [];
let gridWidth = 0;
let gridHeight = 0;
let bossDefeated = false;
let currentTileIndex = 0;
let enemy = null;
let playerTurn = true;

// ---- Utility ----
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function logCombat(msg) {
    const log = document.getElementById('combat-log');
    const div = document.createElement('div');
    div.textContent = msg;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

// ---- Town ----
function renderBuildings() {
    const container = document.getElementById('buildings');
    container.innerHTML = '';
    Object.entries(Buildings).forEach(([key, b]) => {
        const div = document.createElement('div');
        div.className = 'building';
        const h = document.createElement('h3');
        h.textContent = `${b.name} (Lv ${b.level}/${b.max})`;
        const p = document.createElement('p');
        p.textContent = b.desc;
        const btn = document.createElement('button');
        btn.textContent = 'Upgrade';
        btn.disabled = b.level >= b.max;
        btn.addEventListener('click', () => {
            if (b.level < b.max) {
                b.level++;
                renderBuildings();
            }
        });
        div.appendChild(h);
        div.appendChild(p);
        div.appendChild(btn);
        container.appendChild(div);
    });
}

// ---- Stats & Currency ----
function updateStats() {
    const s = document.getElementById('stats');
    s.innerHTML = `
<table>
<tr><td>Level</td><td>${player.level}</td><td>Damage</td><td>${player.damage}</td><td>Armor</td><td>${player.armor}</td><td>Health Regen</td><td>${player.healthRegen}</td><td>Lifesteal</td><td>${player.lifesteal}%</td></tr>
<tr><td>Strength</td><td>${player.strength}</td><td>Health</td><td>${player.health}/${player.maxHealth}</td><td>Crit Damage</td><td>${player.critDamage}%</td><td>Thorns</td><td>${player.thorns}%</td><td>Healing</td><td>${player.healing}%</td><td>Armor Penetration</td><td>${player.armorPen}%</td></tr>
<tr><td>Dexterity</td><td>${player.dexterity}</td><td>Crit Chance</td><td>${player.critChance}%</td><td>Dodge</td><td>${player.dodge}%</td><td>Extra Turn</td><td>${player.extraTurn}%</td><td>Cooldown Reduction</td><td>${player.cooldownReduction}%</td></tr>
<tr><td>Intelligence</td><td>${player.intelligence}</td><td>Mana</td><td>${player.mana}/${player.maxMana}</td><td>Mana Regen</td><td>${player.manaRegen}</td><td>Ability Power</td><td>${player.abilityPower}</td></tr>
</table>`;
}

function updateCurrencies() {
    const c = document.getElementById('currencies');
    const cur = player.currencies;
    c.textContent = `Wood: ${cur.wood} | Iron: ${cur.iron} | Herbs: ${cur.herbs} | Embers: ${cur.embers} | Essence: ${cur.essence}`;
}

// ---- Floor Generation ----
function generateFloor() {
    document.getElementById('floor-number').textContent = currentFloor;
    bossDefeated = false;
    document.getElementById('next-floor').disabled = true;
    tiles = [];
    let normals = rand(15, 25);
    let rares = rand(0, 3);
    let boss = 1;
    let treasure = rand(0, 5);
    let forge = Buildings.blacksmith.level > 0 ? 1 : 0;
    let practice = Buildings.huntersTent.level > 0 && Math.random() < 0.25 ? 1 : 0;
    let skill = Buildings.magesGuild.level > 0 && Math.random() < 0.25 ? 1 : 0;
    let merchant = 1;
    let total = normals + rares + boss + treasure + forge + practice + skill + merchant;

    gridWidth = Math.ceil(Math.sqrt(total));
    gridHeight = Math.ceil(total / gridWidth);

    function push(type, count) { for (let i = 0; i < count; i++) tiles.push({ type, revealed: false, completed: false }); }
    push('normal', normals);
    push('rare', rares);
    push('boss', boss);
    push('treasure', treasure);
    push('forge', forge);
    push('practice', practice);
    push('skill', skill);
    push('merchant', merchant);

    // shuffle tiles except first which is normal combat
    shuffleArray(tiles);
    tiles[0].type = 'normal';
    tiles[0].revealed = true;

    renderFloor();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function renderFloor() {
    const grid = document.getElementById('floor-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gridWidth}, 50px)`;
    tiles.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'tile';
        div.dataset.index = i;
        let symbol = '?';
        if (!t.revealed) {
            div.classList.add('hidden');
        } else {
            const map = {normal: 'C', rare: 'R', boss: 'B', treasure: 'T', forge: 'F', practice: 'P', skill: 'S', merchant: 'M'};
            symbol = map[t.type] || '?';
            if (t.completed) div.classList.add('completed');
        }
        div.textContent = symbol;
        grid.appendChild(div);
    });
}

function handleTile(index) {
    const tile = tiles[index];
    if (!tile.revealed || tile.completed) return;
    currentTileIndex = index;
    switch (tile.type) {
        case 'normal':
        case 'rare':
        case 'boss':
            startCombat(tile.type);
            break;
        default:
            resolveNonCombat(tile);
            tile.completed = true;
            revealNeighbors(index);
            break;
    }
    renderFloor();
}

function resolveNonCombat(tile) {
    const type = tile.type;
    if (type === 'treasure') {
        rewardLoot();
        alert('You found treasure!');
    } else if (type === 'forge') {
        alert('Forge (placeholder).');
    } else if (type === 'practice') {
        player.strength++; player.dexterity++; player.intelligence++;
        updateStats();
        alert('Training increased Strength, Dexterity and Intelligence.');
    } else if (type === 'skill') {
        alert('Skill selection (placeholder).');
    } else if (type === 'merchant') {
        const items = 10 + Buildings.merchantGuild.level * 5;
        alert(`Merchant offers ${items} items (placeholder).`);
    }
}

function revealNeighbors(index) {
    const x = index % gridWidth;
    const y = Math.floor(index / gridWidth);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    dirs.forEach(d => {
        const nx = x + d[0];
        const ny = y + d[1];
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
            const ni = ny * gridWidth + nx;
            if (tiles[ni]) tiles[ni].revealed = true;
        }
    });
    if (tiles[index].type === 'boss') {
        bossDefeated = true;
        document.getElementById('next-floor').disabled = false;
    }
}

// ---- Combat ----
function startCombat(type) {
    enemy = generateEnemy(type);
    playerTurn = true;
    document.getElementById('combat-log').innerHTML = '';
    renderAbilityGrid();
    updatePotionBtn();
    showScreen('combat-screen');
    logCombat(`A ${type} enemy appears!`);
    logCombat(`Enemy HP: ${enemy.hp}`);
}

function generateEnemy(type) {
    let hp = 20 + currentFloor * 10;
    let dmg = 5 + currentFloor * 2;
    if (type === 'rare') { hp *= 1.5; dmg *= 1.5; }
    if (type === 'boss') { hp *= 3; dmg *= 2; }
    return { hp: Math.round(hp), damage: Math.round(dmg) };
}

function renderAbilityGrid() {
    const grid = document.getElementById('ability-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        grid.appendChild(slot);
    }
}

document.getElementById('strike-btn').addEventListener('click', () => {
    if (!playerTurn) return;
    enemy.hp -= player.damage;
    logCombat(`You strike for ${player.damage}. Enemy HP: ${enemy.hp}`);
    if (enemy.hp <= 0) {
        winCombat();
    } else {
        endPlayerTurn();
    }
});

document.getElementById('potion-btn').addEventListener('click', () => {
    if (!playerTurn || player.potionCooldown > 0) return;
    const heal = 30 * (1 + 0.2 * Buildings.biggerVials.level);
    player.health = Math.min(player.maxHealth, player.health + heal);
    player.potionCooldown = 8;
    updateStats();
    logCombat(`You drink a potion and heal ${heal}.`);
});

document.getElementById('end-turn-btn').addEventListener('click', () => {
    if (playerTurn) endPlayerTurn();
});

function endPlayerTurn() {
    playerTurn = false;
    enemyAttack();
    if (player.health > 0) {
        playerTurn = true;
        if (player.potionCooldown > 0) player.potionCooldown--;
        updatePotionBtn();
    }
}

function enemyAttack() {
    player.health -= enemy.damage;
    updateStats();
    logCombat(`Enemy hits for ${enemy.damage}. Your HP: ${player.health}`);
    if (player.health <= 0) {
        loseCombat();
    }
}

function updatePotionBtn() {
    const btn = document.getElementById('potion-btn');
    if (player.potionCooldown > 0) {
        btn.disabled = true;
        btn.textContent = `Health Potion (${player.potionCooldown})`;
    } else {
        btn.disabled = false;
        btn.textContent = 'Health Potion';
    }
}

function winCombat() {
    logCombat('Enemy defeated!');
    rewardLoot();
    tiles[currentTileIndex].completed = true;
    revealNeighbors(currentTileIndex);
    renderFloor();
    showScreen('game-screen');
}

function loseCombat() {
    alert('You have been defeated. Returning to town.');
    showScreen('town-screen');
    generateFloor();
}

function rewardLoot() {
    const cur = player.currencies;
    cur.wood += rand(0, 3);
    cur.iron += rand(0, 3);
    cur.herbs += rand(0, 3);
    cur.embers += rand(0, 2);
    cur.essence += rand(0, 1);
    updateCurrencies();
}

// ---- Event Listeners ----
document.getElementById('floor-grid').addEventListener('click', (e) => {
    if (e.target.classList.contains('tile')) {
        const index = parseInt(e.target.dataset.index);
        handleTile(index);
    }
});

document.getElementById('start-run').addEventListener('click', () => {
    currentFloor = 1;
    player.health = player.maxHealth;
    player.mana = player.maxMana;
    generateFloor();
    updateStats();
    updateCurrencies();
    showScreen('game-screen');
});

// ---- Next floor ----
document.getElementById('next-floor').addEventListener('click', () => {
    if (!bossDefeated) return;
    currentFloor++;
    generateFloor();
});

// ---- Init ----
renderBuildings();
updateStats();
updateCurrencies();
showScreen('town-screen');
