(function startColorDetective() {
  "use strict";

  const { createRounds, isCorrectChoice } = window.ColorDetectiveCore;
  const levels = {
    sprout: {
      number: 1,
      name: "彩虹芽",
      rounds: 3,
      choices: 2,
      palette: ["yellow", "blue", "red", "green"],
      stars: 1,
      message: "你认识了第一批颜色！"
    },
    detective: {
      number: 2,
      name: "云朵侦探",
      rounds: 5,
      choices: 3,
      palette: ["yellow", "blue", "red", "green", "orange", "purple"],
      stars: 2,
      message: "你的颜色眼睛越来越亮啦！"
    },
    master: {
      number: 3,
      name: "彩虹高手",
      rounds: 6,
      choices: 4,
      palette: ["yellow", "blue", "red", "green", "orange", "purple"],
      stars: 3,
      message: "四种颜色也难不倒你！"
    }
  };
  let selectedLevelId = readSavedLevel();
  let currentLevel = levels[selectedLevelId];
  let bestCompletedLevel = readBestCompletedLevel();
  let totalRounds = currentLevel.rounds;
  let rounds = [];
  let roundIndex = 0;
  let acceptingInput = true;
  let soundEnabled = true;

  const screens = {
    start: document.querySelector("#start-screen"),
    play: document.querySelector("#play-screen"),
    finish: document.querySelector("#finish-screen")
  };
  const grid = document.querySelector("#color-grid");
  const targetName = document.querySelector("#target-name");
  const promptLead = document.querySelector("#prompt-lead");
  const hint = document.querySelector("#gentle-hint");
  const progress = document.querySelector("#progress");
  let progressDots = [];
  const soundButton = document.querySelector("#sound-button");
  const soundIcon = document.querySelector("#sound-icon");
  const soundLabel = document.querySelector("#sound-label");
  const levelButtons = Array.from(document.querySelectorAll(".level-button"));
  const startLabel = document.querySelector("#start-label");
  const currentLevelLabel = document.querySelector("#current-level");

  function readSavedLevel() {
    try {
      const saved = window.localStorage.getItem("color-detective-level");
      return saved && levels[saved] ? saved : "sprout";
    } catch {
      return "sprout";
    }
  }

  function saveLevel(levelId) {
    try {
      window.localStorage.setItem("color-detective-level", levelId);
    } catch {
      // The game remains fully playable when storage is unavailable.
    }
  }

  function readBestCompletedLevel() {
    try {
      const value = Number(window.localStorage.getItem("color-detective-best-level"));
      return Number.isInteger(value) && value >= 0 && value <= 3 ? value : 0;
    } catch {
      return 0;
    }
  }

  function rememberCompletion(levelNumber) {
    bestCompletedLevel = Math.max(bestCompletedLevel, levelNumber);
    try {
      window.localStorage.setItem("color-detective-best-level", String(bestCompletedLevel));
    } catch {
      // Completion badges are optional when storage is unavailable.
    }
    updateCompletionBadges();
  }

  function updateCompletionBadges() {
    levelButtons.forEach((button) => {
      const completed = levels[button.dataset.level].number <= bestCompletedLevel;
      button.classList.toggle("is-complete", completed);
    });
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, screen]) => {
      screen.classList.toggle("is-active", key === name);
    });
  }

  function speak(text) {
    if (!soundEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(text);
    message.lang = "zh-CN";
    message.rate = 0.78;
    message.pitch = 1.15;
    message.volume = 0.88;
    window.speechSynthesis.speak(message);
  }

  function sayPrompt() {
    const round = rounds[roundIndex];
    if (round) speak(`请找一找，${round.target.name}`);
  }

  function updateProgress() {
    progressDots.forEach((dot, index) => dot.classList.toggle("is-done", index < roundIndex));
  }

  function buildProgress() {
    progress.replaceChildren();
    progressDots = Array.from({ length: totalRounds }, () => {
      const dot = document.createElement("span");
      dot.className = "progress-dot";
      progress.append(dot);
      return dot;
    });
  }

  function selectLevel(levelId) {
    if (!levels[levelId]) return;
    selectedLevelId = levelId;
    currentLevel = levels[levelId];
    saveLevel(levelId);
    levelButtons.forEach((button) => {
      const selected = button.dataset.level === levelId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    startLabel.textContent = `开始：${currentLevel.name}`;
  }

  function renderRound() {
    acceptingInput = true;
    const round = rounds[roundIndex];
    targetName.textContent = round.target.name;
    targetName.style.color = currentLevel.number === 1 ? round.target.value : "#17324d";
    promptLead.textContent = "请找一找";
    hint.textContent = "点一点你找到的颜色";
    grid.replaceChildren();
    grid.dataset.count = String(round.choices.length);
    grid.style.gridTemplateColumns = `repeat(${round.choices.length}, minmax(0, 1fr))`;

    round.choices.forEach((color) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "color-card";
      button.dataset.colorId = color.id;
      button.style.setProperty("--card-color", color.value);
      button.style.setProperty("--card-shadow", color.shadow);
      button.setAttribute("aria-label", color.name);
      button.addEventListener("click", () => chooseColor(button, color));
      grid.append(button);
    });

    updateProgress();
    window.setTimeout(sayPrompt, 260);
  }

  function chooseColor(button, color) {
    if (!acceptingInput) return;
    const round = rounds[roundIndex];

    if (!isCorrectChoice(round, color.id)) {
      button.classList.remove("is-try-again");
      void button.offsetWidth;
      button.classList.add("is-try-again");
      hint.textContent = "再看一看，它在和你捉迷藏呢";
      speak(`再看一看，找找${round.target.name}`);
      return;
    }

    acceptingInput = false;
    button.classList.add("is-right");
    promptLead.textContent = "找到了！";
    hint.textContent = `${color.name}，真漂亮！`;
    progressDots[roundIndex].classList.add("is-done");
    speak(["找到了！", "真棒！", "你发现它啦！"][roundIndex % 3]);

    window.setTimeout(() => {
      roundIndex += 1;
      if (roundIndex >= totalRounds) finishGame();
      else renderRound();
    }, 1050);
  }

  function startGame() {
    currentLevel = levels[selectedLevelId];
    totalRounds = currentLevel.rounds;
    rounds = createRounds(totalRounds, Math.random, {
      choiceCount: currentLevel.choices,
      palette: currentLevel.palette
    });
    roundIndex = 0;
    currentLevelLabel.textContent = `等级 ${currentLevel.number} · ${currentLevel.name}`;
    buildProgress();
    showScreen("play");
    renderRound();
  }

  function finishGame() {
    rememberCompletion(currentLevel.number);
    showScreen("finish");
    document.querySelector("#finish-eyebrow").textContent = `等级 ${currentLevel.number} 完成`;
    document.querySelector("#finish-title").textContent = `${currentLevel.name}，完成啦！`;
    document.querySelector("#finish-message").textContent = currentLevel.message;
    const stars = document.querySelector("#earned-stars");
    stars.replaceChildren();
    for (let index = 0; index < currentLevel.stars; index += 1) {
      const star = document.createElement("span");
      star.className = "earned-star";
      star.textContent = "★";
      stars.append(star);
    }
    stars.setAttribute("aria-label", `获得 ${currentLevel.stars} 颗星星`);
    makeConfetti();
    speak(`太棒啦！${currentLevel.name}完成啦！`);
  }

  function returnHome() {
    acceptingInput = false;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    showScreen("start");
  }

  function makeConfetti() {
    const holder = document.querySelector("#celebration");
    const colors = ["#ff665c", "#ffd84d", "#52a9ff", "#62cf76", "#a983ea"];
    holder.replaceChildren();
    for (let index = 0; index < 28; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--drift", `${Math.round(Math.random() * 140 - 70)}px`);
      piece.style.setProperty("--fall-time", `${2.2 + Math.random() * 1.8}s`);
      piece.style.animationDelay = `${Math.random() * .7}s`;
      holder.append(piece);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute("aria-pressed", String(soundEnabled));
    soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
    soundLabel.textContent = soundEnabled ? "声音已开启" : "声音已关闭";
    if (!soundEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (soundEnabled) speak("声音已开启");
  }

  document.querySelector("#start-button").addEventListener("click", startGame);
  document.querySelector("#again-button").addEventListener("click", startGame);
  document.querySelector("#home-button").addEventListener("click", returnHome);
  document.querySelector("#finish-home-button").addEventListener("click", returnHome);
  document.querySelector("#repeat-button").addEventListener("click", sayPrompt);
  soundButton.addEventListener("click", toggleSound);
  levelButtons.forEach((button) => button.addEventListener("click", () => selectLevel(button.dataset.level)));
  updateCompletionBadges();
  selectLevel(selectedLevelId);
})();
