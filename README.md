# Redox Studio

Redox Studio 品牌官网。Astro 7 + TypeScript + 原生 CSS，静态生成至 GitHub Pages。
正式地址：https://redox.studio 。不使用 SSR、数据库、UI 框架、CMS 或跟踪服务。

## 本地开发

推荐 Node.js 24（`.nvmrc`）；最低 Node.js 22.12.0。

```sh
npm install
npm run dev
```

开发地址以终端输出为准，默认为 http://localhost:4321 。

```sh
npm run check    # Astro / TypeScript 检查
npm run build    # 类型检查与静态构建，输出 dist/
npm run preview  # 本地预览构建结果
```

提交 `package-lock.json`，后续可用 `npm ci` 按锁文件复现依赖。不要提交 `dist/` 或 `node_modules/`。

## GitHub Pages 部署

使用 [Astro 官方 GitHub Pages Action](https://github.com/withastro/action)：
`.github/workflows/deploy.yml` 在推送到 `main` 或手动运行时执行。
`withastro/action@v6` 安装依赖、运行 build（含类型检查）、上传静态产物；
`actions/deploy-pages@v5` 将产物部署到 `github-pages` 环境。Node 版本为 24。
工作流只使用 GitHub 提供的权限令牌，无需另设部署密钥。

首次切换时由仓库管理员在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**（如果已经选择则无需修改）。
保留 **Custom domain: redox.studio** 与现有 **Enforce HTTPS**；不要清空或重设 Custom Domain，也不需要修改 DNS。
本仓库工作流不调用 API 修改 Pages Custom Domain。若组织限制 Actions，需允许工作流中使用的官方 Actions。

`astro.config.mjs` 设置 `site: 'https://redox.studio'`，不设置仓库 `base` 路径。
根目录原有 `CNAME` 保留，`public/CNAME` 同步保留相同域名并复制到构建产物。
以后如需调整域名，应由管理员独立确认，不能仅依赖文件自动修改 GitHub 设置。

本次仅准备代码；未 push、未触发远程部署、未更改仓库 Pages 设置。首次部署后应检查工作流结果及五个正式 URL。

## 网站结构

```text
.github/workflows/deploy.yml  # 官方 Pages 构建与部署
astro.config.mjs             # 静态输出、正式域名、尾斜杠
src/
  components/                # Header、Footer、Placeholder
  data/products.ts           # 类型化作品列表
  layouts/                   # BaseLayout、DocumentLayout
  pages/
    index.astro              # /
    about.astro              # /about/
    qianli/
      index.astro            # /qianli/
      privacy.astro          # /qianli/privacy/
      support.astro          # /qianli/support/
  styles/global.css          # 共用视觉与响应式样式
public/
  CNAME
  assets/
    redox/                   # 工作室素材
    qianli/                  # 潜历正式素材
```

工作室及文档页共用导航与页脚；`/qianli/` 使用独立的 `QianliLayout` 与深海主题，保留工作室入口。各页均有 SEO 描述与 canonical URL。当前使用系统字体，无外部字体请求或客户端脚本。
隐私和支持页通过 `DocumentLayout` 复用潜历深色主题，采用紧凑长文布局；已移除草稿与 `noindex`。当前政策版本为 1.0，生效／更新日期为 2026-09-17。源码依据、35 项隐私事实表及 App Privacy 待确认事项见 `docs/qianli-app-privacy-audit.md`。

## 潜历产品展示

`src/styles/qianli-tokens.css` 对齐 QIAN 的 `docs/color-system.md` 和 `ios/Qianli/Theme/QianliTheme.swift`；`qianli.css` 仅作用于产品主题。首页只通过 `QianliArtwork.astro` 展示深色潜历作品卡，整体保留工作室暖白视觉。

素材位于 `public/assets/qianli/`，原样复制自 QIAN `IOS` 分支的本地 RC：优先 `screenshots/rc-final/website/`，其中缺少的 `go-results`、`transport-info`、`trip-list`、`trip-detail` 使用 `app-store-like/` 内的同名 `-final.png`。App Icon 来自 `ios/Qianli/Resources/Assets.xcassets/AppIcon.appiconset/appicon-1024.png`。不修改 PNG；Hero 与首页卡片仅通过 CSS 裁切展示。

产品页顺序为 Hero、时间与季节、出发规划（含鲸鲨搜索）、目的地功课、行程与记录、底部 CTA。手机宽度截图单列，正文展示区保留完整截图；图片均声明原始尺寸，Hero 主图优先加载，其余截图懒加载。暂无正式商店链接，两个 CTA 均为禁用按钮。

## 如何新增产品

1. 在 `src/data/products.ts` 添加作品名、类型（App / Game / Digital experience）、根路径和已确认简介。首页会自动显示新作品。
2. 新建 `src/pages/<slug>/index.astro`，复用 `BaseLayout`；可参考潜历页结构。
3. 将正式图片放到 `public/assets/<slug>/`，以 `/assets/<slug>/...` 引用；补充真实图片描述，不生成虚构截图。
4. 根据产品需要添加 privacy / support 页面，并使用产品专属文案及链接。
5. 替换首页卡片素材占位时，可扩展 `Product` 的素材字段并更新首页渲染。
6. 运行 `npm run build`，检查桌面/移动端、链接和新增路由后提交；经确认后推送 `main` 即部署。

## 待提供内容

- 潜历：正式 App Store URL 与上架状态；当前显示「App Store · 即将上线」。
- 联系方式：一般联系 `hello@redox.studio`（About）；潜历支持 `support@redox.studio`；隐私相关 `privacy@redox.studio`。支持邮件只处理 App 使用问题，隐私邮件处理隐私问题或信息处理请求。官网已更新，QIAN App 内旧邮箱需另行同步；邮件保留／删除规则及 Apple 后台诊断使用仍需负责人确认，见审计文档。网站内容已按当前代码完成，不代表 App Store 标签或发行包验收已完成。
- 品牌素材可放入 `public/assets/redox/`。当前没有虚构人物、简历或未发布作品。

搜索 `TODO` 可定位页面中的待补充项。替换内容后移除相应占位；商店 URL 确认后将禁用按钮换为真实链接。
