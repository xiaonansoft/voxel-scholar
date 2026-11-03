# 提取题库（NEED_REWRITE）

这里的 JSON 从开源前的单文件原型拆出，供个人对照重写。

- `yuwen.json`：语文情节题（原型中的 YW）
- `yuwen-old.json`：另一套分组里的园地、诗句类条目（原型中的 OLD_RJ）
- `yuwen-practice.json`：试卷风格的语文练习（原型中的 XY）
- `math-practice.json`：静态数学题（原型中的 XM）。随机口算、时钟、方向图仍在 `src/quiz/generators.js`
- `poems.json`：原型用来做上下句的古诗
- `pinyin-lexicon.json`：原型里的字词表

每一条内容记录都有 `"licenseStatus": "NEED_REWRITE"`。

不要把本目录当作已经获得人教 / PEP 授权的题库，也不要把它设成公开网站的默认构建。个人试用：

```bash
npm run build:extracted
```

输出在 `dist/personal/`，不覆盖 `dist/index.html`。
