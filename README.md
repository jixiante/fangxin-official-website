# 放心中醫藥在海南 · 官网预览

> GitHub 独立官网源码仓库。2026-10-19 从工作区官网基线导出，源码来自 `3d71c5b4490973cb2ddfec25e93cd20d6d737e2c`，部署记录来自 `ddd0900`。
>
> 演示站：https://47.92.248.31/official/zh/ 。复用现有 80/443 的 `/official/` 路径；保留预览状态。部署校验与回滚记录见 [deployment/server-20261018.json](deployment/server-20261018.json)。以下带日期的测试报告保留其原始核验时间；原机浏览器截图及 `.analysis` 资料不随代码上传。

克隆前安装 Git LFS；克隆后执行 `git lfs pull`，以取得图片、字体与视频。运行需要 Node.js 22 或更新版本，无需 `npm install`：

```sh
git clone https://github.com/jixiante/fangxin-official-website.git
cd fangxin-official-website
git lfs pull
npm run build
npm run preview
```

另一个终端运行 `npm test`。


独立静态官网，简体中文、英文、俄文完整页面。Node 原生构建，不需要安装 npm 依赖，也不连接原平台后端。参考 GitLab 仓库保持只读；当前增量采用 test 提交 `f0612056fbafcb534036ff599a1d53e6ab0cb7b1`，2026-10-17 核对；旧快照保留。

## 当前体验

2026-10-17 八项内容实质修订：直接写出配料、器具结构、礼盒组成、路线时段和分级课程；原生展开可查看细节，中英俄同步。每个板块的实际新增段落、源行对照与截图见 SUBSTANCE-REPORT.md。保留海岛草本视觉、14 条页内视频、二维码和小黎入口。


- 本机：<http://localhost:4173/zh/>
- English：<http://localhost:4173/en/>
- Русский：<http://localhost:4173/ru/>
- 手机布局已在 375×900 浏览器视口核验；实体手机及局域网访问尚未验收，换网后的地址需重新确认。

建议体验：首页 → 八项业务详情 → 切换语言并刷新 → 小黎欢迎视频 → 合作联系 → 小程序体验弹窗。

2026-10-15 当前已统一完整官网：八项业务详情、首页、小黎、关于、合作、影像、新闻等三语页面。建议：首页选业务 → 小黎切换“一餐一饮” → 查看两款汤饮 → 切换语言 → 关于平台的合作联系。二维码与欢迎视频入口保留。

**已接入用户于 2026-10-15 提供的“放心消费在海南体验版”二维码，原图标注 10 月 22 日前有效。网页展示与大图入口可用，微信真实扫码、体验权限和目标页尚未验收；当前仍为本地预览。**

当前测试：54 页、2694 个本地引用与锚点、90 个相关浏览器视图及推荐、详情展开、视频、二维码等实际路径通过。详情与限制见 TEST-REPORT.md。

## 启动与构建

在本目录运行，Node 22 或以上：

```powershell
node build.mjs
node server.mjs
```

或者 `npm run build`、`npm run preview`。构建产物在 `dist/`，每个语言和内容页都有自己的 `index.html`。本地预览服务只提供 `dist/` 文件，不暴露源码、工作资料或视频原件。

端口默认 4173，可用 `PORT` 环境变量调整。服务默认通过 `::` 同时监听 IPv6 与 IPv4，支持本机和局域网；如只需 IPv4 本机访问，先设置 `$env:HOST='127.0.0.1'` 并使用对应地址。预览期间进程须保持运行。本次已后台启动，PID 位于 `work/preview.pid`；关闭前请先核实对应进程仍是本项目 Node 服务。

## 内容修改位置

| 内容 | 文件 |
|---|---|
| 品牌、公司公开联系方式、小程序码、域名 | `content/site.json` |
| 三语导航、正文、按钮、说明和图片替代文字 | `content/locales.mjs` |
| 八项业务的三语详情、适用场景和边界 | `content/businesses.mjs` |
| 新闻标题、日期、来源、摘要与详情 | `content/news.json` |
| 页内影片、封面、来源和三语说明 | `content/films.json` |
| 具体条目、来源行与详情布局 | `content/catalog.mjs`、`business-pages.mjs` |
| 页面生成与公共布局 | `build.mjs` |
| 本轮三页的内容与结构 | `content/focus.mjs`、`focused-pages.mjs` |
| 样式、响应式布局 | `styles.css` |
| 菜单、弹窗、语言切换、视频错误提示 | `client.js` |

内容文件按可信编辑输入处理，生成 HTML 时统一转义文字；不接收公网用户内容。修改后重新构建即可。

### 维护体验版二维码

1. 将用户提供的原始码保存为 `assets/mini-trial.png`，保持原比例、清晰度和白边。
2. `content/site.json` 中维护 `miniCode` 和 `miniCodeValidBefore`。当前截止值为 `2026-10-22T00:00:00+08:00`，保留原图“22 日前”含义。日期按上海时区生成三语说明，浏览器到期后隐藏码与原件链接，显示更新联系入口。换码时更新路径、截止时间及 `content/locales.mjs` 的真实名称和尺寸，再构建；文案新增字符时重建字体。截止提示依设备时钟，不是微信有效性验证。
3. 从当前微信官方后台核实码的版本、目标页和体验权限，使用真实微信账号分别记录扫码、授权和进入目标页的结果。网站弹窗打开不能算作成功进入小程序。
4. 本版不提供一键跳转。只有拿到适用的官方链接并实际验证后再增加。

2026-10-13 尝试访问微信官方快速开始中的测试与发布页面未成功，不能声称已完成当前官方规则核验。页面没有写死成员人数或保证所有访客可进入。

### 修改联系与新闻

现有电话 `0898-65351690`、邮箱 `idianqian@163.com` 来自用户指定的[公司官网](https://www.fs-signature.com/)，核对日期 2026-10-13。显示为“公司公开联系渠道”，不冒充本项目专线。不采集表单、不自动发送消息。

新闻为 `content/news.json` 数组。每条包含唯一 `id`、原始 `date`（YYYY-MM-DD）、`kind`（`public` 或 `platform`）、`image`、真实 `sourceUrl`、`checkedOn`，以及 `zh/en/ru` 各自的 `title/source/summary/paragraphs`。日期使用原报道发布时间；三语必须一同更新。构建会生成三语列表与详情，新增真实平台动态时将 `kind` 设为 `platform`，同时调整无平台动态提示。删除或改变新闻 slug 时，在新的空发布目录构建或清理旧发布目录，避免旧文件残留。

## 设计与素材

当前整站采用白色、草木绿、米沙色和有用途的图文分区。首页从平台定位、八项业务到小黎示意、公开来源和体验合作；康养页提供五类路线主题、具体饮食与养护内容、家庭行程示意及参与前信息。复用此前产品/美容图片包中的三张 AI 示意图，来源核对与其他七项业务内容提取见 CONTENT-SOURCES.md。本轮按用户要求取消前台AI图片标签，内部保留真实来源记录。中文保留本地 Noto Sans SC，英文/俄文改用已有授权 Noto Sans，避免西文标点间距问题；标题 600、正文 400。不增加滚动劫持、自动播放或外部字体 CDN。

实际阅读了[同仁堂健康](https://www.trthealth.com/)的品牌、产品、服务及动态栏目分层；阅读了[点签公司官网](https://www.fs-signature.com/)的产品、案例、资讯及公开联系结构。这里只借鉴内容分层，没有复制其视觉资产。另参考本地 `awesome-design-md` 的 Airbnb 图片优先、低阴影、简洁导航原则，不复制其品牌样式。海南旅游参考站读取超时，未将其列为已研究参考。

详见 `ASSETS.md` 和 `DETAILS-REPORT.md`。运行素材为本地文件；14条用户提供的视频可页内播放，原发布页为次级入口。生成图片原件和提示词保留内部；公开传播权限尚未核实。

本次完整改版用 REA 6.4.0 实际分析 Apple 首页与 Aman 康养页，结合截图和计算样式校验排版、影像及交互，见 `REDESIGN-REPORT.md`。没有复制参考站品牌素材或脚本，也没有增加官网运行依赖。`REA-REPORT.md` 保留第一次局部试用的历史记录。字体来源、许可、范围与更新方式见 `FONTS.md`。

## 后续域名接入

获得域名、目标服务器与可公开素材范围后，将 `dist/` 发布到隔离静态站点，保留目录式 URL、正确 MIME、视频 Range 和自定义 404。将 `siteUrl` 填为真实 HTTPS origin，会生成对应 canonical 和语言关联地址。预览默认 `preview: true`，保留 noindex 和 robots 禁止抓取；正式发布审查完成后才改为 `false`。

还需办理适用备案、HTTPS、正式运营与隐私说明、素材授权和发布内容审查。现有公司官网备案号不能自动复用到新域名。服务器需备份旧制品、保留可恢复版本；本次没有修改现有平台服务，没有进行远程部署。

## 验证

```powershell
node tests/check.mjs
node tests/connectivity.mjs
node tests/focus.mjs
node tests/catalog.mjs
python tests/browser.py
python tests/typography.py
```

四项 Node 检查使用标准库，要求双栈预览服务正在运行。Python 脚本为旧版验证工具，本轮未执行。当前实际浏览器135个视图及交互、视频检查通过Codex浏览器完成，见 `evidence/details-20261017/` 与 `TEST-REPORT.md`。

构建会校验并清空仅用于生成的 dist，切勿手改产物。新增文案后按 FONTS.md 更新字体，再运行 npm run build 和 npm test；测试会检查字体哈希与字形覆盖。当前 noindex 预览没有正式 sitemap；配置真实 HTTPS siteUrl 且关闭 preview 后才生成正式 sitemap 和绝对分享元信息。
