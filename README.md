# 方块备考

[![CI](https://github.com/xiaonansoft/voxel-scholar/actions/workflows/ci.yml/badge.svg)](https://github.com/xiaonansoft/voxel-scholar/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![repo](https://img.shields.io/badge/github-xiaonansoft%2Fvoxel--scholar-black)](https://github.com/xiaonansoft/voxel-scholar)

方块备考（Block Prep）是一款面向二年级上册语文、数学方向的体素答题小游戏，按钮大、支持平板触控，也能收成一个离线 HTML 发给家长。

仓库与 npm 包名是 `voxel-scholar`。产品名不是任何沙盒游戏的官方版本。

![主菜单占位](docs/screenshots/menu-placeholder.svg)

## 打开离线文件

```bash
npm test
npm run build
```

构建完成后，下面两个文件内容相同，双击任意一个即可：

- `dist/方块备考_offline.html`
- `dist/voxel-scholar-offline.html`

`dist/index.html` 也是同一份页面，方便把 `dist/` 挂到 GitHub Pages（仓库 [xiaonansoft/voxel-scholar](https://github.com/xiaonansoft/voxel-scholar)）。

本地预览：

```bash
npm run dev
```

然后打开终端里打印的地址（默认 `http://127.0.0.1:41731`）。离线文件不依赖运行时 CDN；three.js 已经打进页面。

若浏览器拦截本地文件里的脚本，用 `npm run dev` 比直接双击更稳。

## 平板和触控

菜单里把「触屏模式」设为开。左边摇杆移动，右边是挖、跳、放方块、垫高和合成。答题用大按钮或数字键盘，不需要实体键盘。横屏更好点。

## 成绩只在这台设备上

角色、星星、错题和设置写在浏览器的 `localStorage`（键名以 `g2q_` 开头）。没有账号，也没有上传。换浏览器或清站点数据会丢失，换电脑也不会跟着走。

## 题库：要自编

开源题库需要自编。当前 `data/questions/extracted/` 里的条目标成了 **NEED_REWRITE**，不能当作已经获得教材授权。

| 命令 | 题库 | 输出 |
| --- | --- | --- |
| `npm run build` | `data/questions/demo/`，`ORIGINAL` | `dist/voxel-scholar-offline.html` 与 `dist/方块备考_offline.html` |
| `npm run build:extracted` | `data/questions/extracted/`，全部 `NEED_REWRITE` | 只写到 `dist/personal/`，不替换公开页 |

示范题是方块镇里的自编故事和口算。提取题是从旧的单文件原型拆出来供个人重写的，说明见 [docs/OPEN_SOURCE.md](docs/OPEN_SOURCE.md)。

## 免责声明

方块备考 / Block Prep / voxel-scholar 与 Minecraft、我的世界、Mojang、Microsoft、网易没有隶属、赞助或授权关系。这是一个独立的体素风格答题练习，不是上述产品的官方版本。

本项目不声称拥有人民教育出版社（人教 / PEP）或任何课本的原文权利。默认页面里的题目是自编示范；提取目录里的旧题干在重写之前不能公开当成授权内容分发。

## 许可

自写代码与示范题：MIT，见 [LICENSE](LICENSE)。  
第三方：three.js（MIT）和笔画轮廓（Arphic Public License），见 [NOTICE](NOTICE)。

## 建议的 GitHub Topics

`voxel-scholar` `block-prep` `education` `quiz` `voxel` `chinese-learning` `pinyin` `offline-first` `threejs` `html5` `grade-2`

## English

Block Prep (方块备考) is a touch-friendly voxel quiz aimed at grade-2 Chinese and math practice. The package name is `voxel-scholar`.

`npm run build` writes two identical offline files, `dist/voxel-scholar-offline.html` and `dist/方块备考_offline.html`. Scores stay in `localStorage` only. The public question pack is original demo text. Files under `data/questions/extracted/` are tagged `NEED_REWRITE` and are not a claim of textbook permission. This project is not affiliated with Minecraft, 我的世界, Mojang, Microsoft, or NetEase. See `NOTICE` for three.js and stroke-data licenses.

## 从单文件拆出来的结构

| 路径 | 内容 |
| --- | --- |
| `src/styles.css`、`src/index.html` | 界面 |
| `src/quiz/generators.js` | 口算、时钟、方向等生成器，以及单元注册 |
| `src/quiz/pinyin-stroke.js` | 拼音与笔顺 |
| `src/quiz/stem-guard.js` | 题干只能有一个问号 |
| `src/game/main.js` | 体素世界、存档、菜单 |
| `vendor/three/` | three.js r160 |
| `data/questions/` | 示范题与提取题 |
| `data/strokes/` | 笔画轮廓 |
| `scripts/build.mjs` | 打成一个离线 HTML |

还留在大文件里、没有再拆的，主要是世界生成、合成和角色控制（`src/game/main.js`）。题干数据已经不在这些文件里。

后续可以做的事：把 `main.js` 再按输入、存档、渲染拆开；用自编题替换 `extracted/`；补上真实截图。
