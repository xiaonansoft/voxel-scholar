# 参与贡献

只收**你自己编写**的题目、以及修 bug、改进触控、补文档、补截图。

## 题目

- 新题放进 `data/questions/demo/`（或你另建的、同样标成自编的 JSON），并写上 `"licenseStatus": "ORIGINAL"`。
- 题干只保留一个问句（零个或一个 `？` / `?`）。省略号 `……` 不算问号。
- 不要提交课文原文、日积月累、识字表整表、古诗填空的教材原句。`data/questions/extracted/` 里的条目标着 `NEED_REWRITE`，用来对照重写，不是可直接合并进公开题库的稿件。
- 数学题可以是原创的生活情境；不要整题复制试卷扫描件或教辅。
- 提交说明里写清：科目、单元键、这题为什么是自编的。

## 拉取请求

1. 一个 PR 做一件事。
2. 运行 `npm test`。题干守卫和离线构建都会跑。
3. 不要把 `dist/` 或 `src/generated/` 提交进来，它们是构建产物。
4. 改界面时保持触控能点：按钮要够大，手机和平板宽度下菜单不能撑破屏幕。
5. 不要在用户能看见的标题里使用「我的世界」或 Minecraft 作为产品名。

## 本地检查

```bash
npm test
npm run build
```

浏览器打开 `dist/voxel-scholar-offline.html` 或 `dist/方块备考_offline.html`。
