# 开源说明：商标与题目版权

方块备考（英文名 Block Prep，仓库与包名 `voxel-scholar`）是一个可以离线打开的体素风格答题小游戏。把它开源，是为了让家长和老师能改题、能自己构建单文件 HTML，不是为了声明任何教材或游戏商标的授权。

## 商标

本项目与 Minecraft、我的世界、Mojang、Microsoft、网易没有隶属、赞助、授权或合作关系。

界面上的产品名是「方块备考 / Block Prep」。玩法是在体素沙盒里走动、挖方块、答题。请不要在介绍、截图标题或发行包封面上把本项目写成上述产品的官方版本、教材版或仿官方客户端。

## 教材与题目

- 本仓库**不声称**拥有人民教育出版社（人教 / PEP）或任何教科书的原文权利。
- 默认构建（`npm run build`）只使用 `data/questions/demo/`。这些题目标 `licenseStatus: "ORIGINAL"`，是为开源示范新写的，不是课文复述。
- `data/questions/extracted/` 是从开源前的单文件原型里拆出来的题干、词表和古诗填空。**每一条都标了 `NEED_REWRITE`。** 它们不能当作“已经获得教材授权”的内容，也不能当作可随意再发布的原创题。
- 公开网站、GitHub Pages、发给其他家庭的安装包，应使用默认示范构建。个人如果要对照自己的练习范围，可以 `npm run build:extracted`，产物在 `dist/personal/`，同样必须视为待重写，而不是已授权文本。
- 欢迎用你自己编写的题目替换示范题。不要把课文、日积月累、识字表整段贴回来。约定见 `CONTRIBUTING.md`。

## 笔画数据

笔顺模式用的轮廓和中线来自文鼎公众授权字体衍生的 Make Me a Hanzi 图形数据，许可是 Arphic Public License，不是 MIT。详见 `NOTICE` 和 `data/strokes/ARPHICPL.TXT`。

## 代码许可

项目自写的代码、示范题和文档中的原创部分以 MIT 发布，见 `LICENSE`。第三方部分以 `NOTICE` 为准。
