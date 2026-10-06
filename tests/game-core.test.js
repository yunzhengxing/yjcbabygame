const assert = require("node:assert/strict");
const test = require("node:test");
const { COLORS, shuffle, createRounds, isCorrectChoice } = require("../games/color-detective/game-core.js");

test("包含六种不重复的基础颜色", () => {
  assert.equal(COLORS.length, 6);
  assert.equal(new Set(COLORS.map((color) => color.id)).size, 6);
});

test("洗牌不修改原数组", () => {
  const original = [1, 2, 3, 4];
  const shuffled = shuffle(original, () => 0);
  assert.deepEqual(original, [1, 2, 3, 4]);
  assert.notEqual(shuffled, original);
});

test("默认生成五轮，难度从两个选项增加到三个", () => {
  const rounds = createRounds(5, () => 0.42);
  assert.equal(rounds.length, 5);
  assert.deepEqual(rounds.map((round) => round.choices.length), [2, 2, 3, 3, 3]);
});

test("每轮选项包含且只包含一个目标色", () => {
  createRounds(12, () => 0.73).forEach((round) => {
    assert.equal(round.choices.filter((color) => color.id === round.target.id).length, 1);
    assert.equal(new Set(round.choices.map((color) => color.id)).size, round.choices.length);
  });
});

test("正确选择判断", () => {
  const round = createRounds(1, () => 0.25)[0];
  assert.equal(isCorrectChoice(round, round.target.id), true);
  const other = COLORS.find((color) => color.id !== round.target.id);
  assert.equal(isCorrectChoice(round, other.id), false);
});

test("拒绝无效回合数", () => {
  assert.throws(() => createRounds(0), /正整数/);
  assert.throws(() => createRounds(1.5), /正整数/);
});

test("支持固定难度和指定颜色池", () => {
  const rounds = createRounds(6, () => 0.31, {
    choiceCount: 4,
    palette: ["yellow", "blue", "red", "green"]
  });
  assert.equal(rounds.length, 6);
  rounds.forEach((round) => {
    assert.equal(round.choices.length, 4);
    assert.equal(round.choices.every((color) => ["yellow", "blue", "red", "green"].includes(color.id)), true);
  });
});

test("拒绝超过颜色池的选项数量", () => {
  assert.throws(
    () => createRounds(3, Math.random, { choiceCount: 4, palette: ["red", "blue"] }),
    /选项数量/
  );
});
