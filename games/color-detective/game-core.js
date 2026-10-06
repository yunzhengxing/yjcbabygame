(function attachGameCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ColorDetectiveCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createGameCore() {
  const COLORS = Object.freeze([
    { id: "yellow", name: "黄色", value: "#ffd84d", shadow: "#d7a82b" },
    { id: "blue", name: "蓝色", value: "#52a9ff", shadow: "#2775c4" },
    { id: "red", name: "红色", value: "#ff665c", shadow: "#c83f3a" },
    { id: "green", name: "绿色", value: "#62cf76", shadow: "#369c4a" },
    { id: "orange", name: "橙色", value: "#ff9d45", shadow: "#d66d23" },
    { id: "purple", name: "紫色", value: "#a983ea", shadow: "#7452b7" }
  ]);

  function shuffle(items, random = Math.random) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function createRounds(count = 5, random = Math.random, options = {}) {
    if (!Number.isInteger(count) || count < 1) throw new Error("回合数必须是正整数");
    const paletteIds = Array.isArray(options.palette) && options.palette.length
      ? options.palette
      : COLORS.map((color) => color.id);
    const palette = COLORS.filter((color) => paletteIds.includes(color.id));
    const requestedChoices = Number.isInteger(options.choiceCount) ? options.choiceCount : null;
    if (palette.length < 2) throw new Error("至少需要两种颜色");
    if (requestedChoices && (requestedChoices < 2 || requestedChoices > palette.length)) {
      throw new Error("选项数量必须在颜色范围内");
    }
    const targets = [];
    while (targets.length < count) targets.push(...shuffle(palette, random));
    return targets.slice(0, count).map((target, index) => {
      const choiceCount = requestedChoices || (index < 2 ? 2 : Math.min(3, palette.length));
      const distractors = shuffle(palette.filter((color) => color.id !== target.id), random)
        .slice(0, choiceCount - 1);
      return { target, choices: shuffle([target, ...distractors], random) };
    });
  }

  function isCorrectChoice(round, colorId) {
    return Boolean(round && round.target && round.target.id === colorId);
  }

  return { COLORS, shuffle, createRounds, isCorrectChoice };
});
