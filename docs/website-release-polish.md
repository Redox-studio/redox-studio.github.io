# Website Release Polish — 2026-09-17

本地发布候选验收完成，未 push、未部署。主页、About、潜历产品结构与既有正文保留；Privacy / Support 源文件未修改，最低系统要求保留 iOS 26。未修改 QIAN App 仓库、GitHub Pages 工作流、CNAME、DNS 或邮箱设置。

## 发布资产与 SEO

- 新增 `public/favicon.svg`（暖白底、深色 R、边框）、`favicon.ico`（16 / 32 / 48px）与 `apple-touch-icon.png`（180px）。网站标识独立于潜历 App Icon。
- `public/assets/og/redox-og.jpg`：1200×630，47,391 bytes；延续暖白字标与已确认工作室文案。
- `public/assets/og/qianli-og.jpg`：1200×630，62,111 bytes；深海主题、潜历、核心文案与真实 App Icon，无商店 badge 或虚构数据。
- `SEO.astro` 供两个 Layout 复用，支持 title / description / image / canonical / noindex；输出完整 OG、Twitter summary_large_image、robots、图标与 sitemap 发现链接。metadata 中的站内 URL 统一由 `Astro.site` 解析。
- 首页 Organization 仅包含 name / url / email；潜历 SoftwareApplication 包含 name / alternateName / applicationCategory / operatingSystem / description / url。系统版本为 `iOS 26 or later`，未添加价格、下载、评分或评价字段。
- [Astro 官方 sitemap 集成](https://docs.astro.build/en/guides/integrations-guide/sitemap/)生成 `dist/sitemap-index.xml` 和 `dist/sitemap-0.xml`，收录 `/`、`/about/`、`/qianli/`、`/qianli/privacy/`、`/qianli/support/`。
- `robots.txt` 允许全站抓取，指向 `https://redox.studio/sitemap-index.xml`。五个正式页面均为 `index, follow`。
- `src/pages/404.astro` 生成 `dist/404.html`，使用工作室主题、`noindex, follow`，不进入 sitemap。直接访问与嵌套未知路径均可从本地预览返回品牌 404 和 HTTP 404。

## 图片优化

11 张原始截图和 1024px App Icon 合计 **15,325,362 bytes（15.33 MB）**。全部 PNG 原样保留；页面不再请求这些 PNG。原图仍会随 `public/` 复制到 dist，因此部署包大小不等于浏览器传输量。

截图生成 480 / 840 / 1206px 宽的 WebP，quality 90、smartSubsample；App Icon 使用 192px WebP，quality 95。共 34 个派生文件。840px 与原图等比例缩小后的 UI 文字已作视觉对照，未发现明显清晰度损失。1206px 版本覆盖高像素密度屏幕，不一律缩小原图。

| 图片 | 原始 PNG bytes | 840px WebP bytes | 1206px WebP bytes |
| --- | ---: | ---: | ---: |
| calendar-home-final | 1,388,854 | 72,356 | 112,648 |
| date-range-final | 445,024 | 52,690 | 76,102 |
| dive-history-photo-final | 418,531 | 33,830 | 54,340 |
| go-planner-final | 517,605 | 54,566 | 76,448 |
| go-results-final | 2,343,778 | 249,422 | 410,630 |
| practical-info-final | 989,860 | 124,272 | 182,758 |
| search-wildlife-whaleshark-final | 3,520,040 | 264,956 | 413,390 |
| site-detail-sanya-final | 2,108,937 | 189,784 | 313,190 |
| transport-info-final | 921,778 | 164,670 | 241,382 |
| trip-detail-final | 1,524,294 | 167,896 | 280,316 |
| trip-list-final | 367,158 | 35,636 | 53,182 |
| appicon | 779,503 | 7,650（192px） | 同左 |

Chrome 152 本地冷缓存实测，初始滚动位置为 0，高度 900px，关闭缓存，在载入后 1.2 秒取样，再滚动完整页面。统计 `PerformanceResourceTiming.encodedBodySize`，不含 HTTP 头；浏览器的懒加载预取距离可能因环境而异。

| 环境 | 初次图片 bytes | 滚动完整页图片 bytes | 相对原图总量减少 |
| --- | ---: | ---: | ---: |
| 1440px / DPR 2 | 132,696 | 1,417,728 | 90.7% |
| 390px / DPR 3 | 120,298 | 2,222,036 | 85.5% |

首次资源还包含 CSS，分别为 137,219 / 124,821 bytes（不含主 HTML）。首屏两张 eager 图片本身是 80,006 / 120,298 bytes；桌面样本另预取了一张邻近首屏的 lazy 截图。优化前这两张 eager PNG 为 2,168,357 bytes。上述优化前数字来自原始文件大小，并非旧版冷缓存网络测试。

Hero 为 `loading="eager"`、`fetchpriority="high"`、`decoding="async"`，其余截图与底部 App Icon 为 lazy / async。所有图片声明 width / height；`srcset` / `sizes` 让浏览器选择分辨率。没有全量 preload、客户端图片框架或图片服务。滚动完整页后 14 个 img 均成功解码，无失效图片。

素材再生成：`npm run assets:generate`。依赖 Sharp 作为开发工具，脚本与派生文件一并保存；普通构建无需重跑生成脚本。

## 可访问性、文案和链接

- About 邮箱增加常驻下划线及长文本换行；两个 Layout 的 main 增加 `tabindex="-1"`，使 skip link 能可靠转移焦点。
- 潜历两处表面色上的小字号编号原对比度为 4.18:1，改用既有 `--q-muted` 后为 6.93:1；未改品牌色变量。
- axe-core 4.13.0 在六个页面 × 1440 / 320px 下检测 WCAG 2 A / AA、2.1 AA，修复后 0 violations。渐变背景产生的 incomplete 项按实际颜色另行核查：正文色对最亮背景为 15.19:1，次级文字为 7.26:1；其余淡色截图编号位于渐变结束后的深色背景，为 4.95:1。自动扫描不是完整 WCAG 认证。
- 六页均只有一个 h1，无标题层级跳跃、重复 id、缺失 alt 或目录锚点。装饰 App Icon 保持空 alt。
- 六页实测 Tab 首次进入可见 skip link（2px outline），Enter 后焦点到 main，下一次 Tab 进入内容链接；禁用商店按钮不会接受 Tab 或误导跳转。
- `prefers-reduced-motion: reduce` 时六页计算得到 `scroll-behavior: auto`。
- 46 个本地页面、锚点目标及静态资源目标通过文件与 HTTP 检查。三组 mailto 分别为 hello / support / privacy @redox.studio。只验证链接，不发送测试邮件。
- 构建的用户可见内容无 TODO、TBD、placeholder、待提供、待确认、示例、example、localhost、127.0.0.1、test、dummy、旧 Gmail 或空 `href="#"`。开发占位组件未用于实际产品，技术文档中的合法说明保留。
- “即将上线”只出现在潜历两处禁用 App Store 按钮。无商店假链接。

## 响应式与浏览器

Chrome 对首页、About、潜历、Privacy、Support、404 检查 1440 / 1280 / 1024 / 768 / 430 / 390 / 320px，共 42 组，均无横向滚动或非预期元素溢出。截图已抽查首屏、窄屏导航、邮箱、长文目录和 404；手机截图的现有 Hero 裁切保持原样。

- **Chrome 152**：42 组尺寸、资源加载、WebP、键盘、focus-visible、减少动态效果、链接、自动可访问性检查通过。
- **Safari 27.0**：通过本机界面逐页打开六个页面，检查系统字体、暖白 / 深色布局、WebP、R favicon、mailto 目标；实际点击 Privacy / Support 目录锚点成功。Safari WebDriver 未开启，使用真实界面进行桌面基础验证，没有将 Chrome 的 42 组结果算作 Safari 自动验证。
- **Firefox**：本机未安装，未测试。

## 构建与发布边界

已运行 `npm install`、`npm run check`、`npm run build` 和 `git diff --check`。Astro / TypeScript 结果为 0 errors、0 warnings、0 hints；6 个页面、两份 sitemap、robots、404、三种 favicon 与 OG 图均生成。

正式站已确认可访问，未知路径返回 HTTP 404，但当前仍是 GitHub 默认错误页。本次未 push，不能声称新 404、OG 或 favicon 已在线生效。

发布后需复核：未知路径显示品牌 404 且保留 HTTP 404；正式域名上的 sitemap / robots / 两张 OG / favicon 返回成功；分享平台刷新旧缓存后的实际预览；iPhone 添加到主屏幕的图标。App Store 上架前保持禁用状态，上架后再接入真实商店 URL。
