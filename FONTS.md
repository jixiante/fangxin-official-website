# 字体与排版 · 2026-10-15

## 2026-10-23 详情页参考补齐

八个业务详情页标题使用本地 Noto Serif SC（思源宋体），400–700 字重；导航及正文继续使用现有无衬线字体。原始文件从 Google Fonts 官方 `ofl/notoserifsc/NotoSerifSC[wght].ttf` 获取，SHA-256 为 `050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9`，许可证随站点保存在 `assets/fonts/notoserifsc-OFL.txt`。子集约 353 KB，只在业务详情页预加载，支持中英俄字符；当前哈希与覆盖记录见 `assets/fonts/coverage.json`。

`tools/prepare-fonts.py` 现同时生成三套字体，原件目录另外需要 `notoserifsc-*.ttf` 与 `notoserifsc-OFL.txt`。下文是此前版本记录。

中文使用本地 **Noto Sans SC**，英文/俄文使用本地 **Noto Sans**；中文品牌名和西文字体没有的符号回退到 Noto Sans SC。两套均为已有授权原件，不使用 Apple SF 或外部字体 CDN。标题 600、正文 400，界面 400–600，禁止合成粗体。

## 来源与许可

- [Noto Sans SC 官方仓库](https://github.com/google/fonts/tree/main/ofl/notosanssc)，原始 SHA-256：`a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`。
- [Noto Sans 官方仓库](https://github.com/google/fonts/tree/main/ofl/notosans)，原始 SHA-256：`bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d`。
- 原件和官方元数据留在 `.analysis/website-redesign-20261013/fonts`。两个 SIL OFL 1.1 许可证随站点分发于 `assets/fonts/`。

## 当前实质内容修订

当前1090个字符，两套字体合计315316 bytes（中文250172、西文65144），实际哈希在assets/fonts/coverage.json。手机首页主标题34px，小黎32px；详情保留共享字号。字体按新文案重新生成，npm test核对覆盖与文件哈希。

## 上一轮整站排版

| 用途 | 桌面 | 手机 |
|---|---|---|
| 主标题 | 中文/英文约 54–58px；俄文约 52px | 中文约 37px、英文 38px、俄文 34px |
| 栏目标题 | 约 36–40px | 约 29px |
| 正文与导语 | 16–18px，行高 1.7–1.8 | 16–17px，行高约 1.8 |
| 导航 | 14px，当前页 600 | 展开后 15px |

中文标题取消负字距；西文保留轻微负字距并控制行长。俄文首页另行缩短标题，375px 下顶栏保持单行控件，不隐藏体验入口。保留中文品牌和既有说明性译文。页脚、弹窗字号独立，不受主内容大标题规则影响。

## 资源与覆盖

`hainan-sans.woff2` 192028 bytes，`hainan-international.woff2` 65120 bytes，合计 **257148 bytes**。英俄页预加载两套；中文只预加载中文字体，西文字体没有实际需求时不请求。使用 `font-display: swap`。

`coverage.json` 记录当前 837 个非空白页面字符全部被中文字体覆盖。西文字体所需范围有 142 字符，其中 139 个直接覆盖，三个箭头/播放符号由中文字体回退；拉丁文字及含 Ё/ё 的俄文字母表完整。中文保留同一字体；西文单独使用 Noto Sans 解决撇号等标点的间距问题。

本轮检查了实际浏览器中的计算字体栈、三语换行、图片加载和控制台错误；此前的 CDP 实际字形与字体失败回退证据属于旧基线，没有声称本轮重跑。当前浏览器证据见 `evidence/content-browser-results.json`。

## 更新

新增文案后，先构建再重建字体并再次构建。原件目录须含 `notosanssc-*.ttf`、`notosans-*.ttf` 和两个 OFL 文件。工具固定字重范围为 400–600，Noto Sans 宽度轴固定 100。

```powershell
node build.mjs
$env:PYTHONPATH='D:/放心中医药/.analysis/website-redesign-20261013/python-lib'
python tools/prepare-fonts.py D:/放心中医药/.analysis/website-redesign-20261013/fonts
node build.mjs
```

Python/fonttools/Brotli 仅用于制作字体，不是官网运行依赖。本轮复用已有隔离的 Brotli，没有重新安装依赖。

本轮统一 styles.css；手机导航品牌译文独立放在导航下方，14px。coverage.json 保存实际 WOFF2 码点，npm test 检查当前字体哈希与所有页面正文、alt、aria-label 字母/数字覆盖。新增字漏入子集会直接失败，不依赖目测回退。
