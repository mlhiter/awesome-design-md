# Design Shelf

一个不依赖 getdesign.md 的静态设计语言收藏馆。包含 **84 份 DESIGN.md** 和 **58 套历史明暗 HTML 预览**，支持搜索、分类、预览筛选、复制、下载，以及 `?design=apple` 详情链接。

## 本地运行

从仓库根目录运行：

```sh
cd website
python3 -m http.server 8047 --bind 127.0.0.1
```

打开 http://127.0.0.1:8047 。通过 HTTP 服务打开，避免 `file://` 限制文档加载和剪贴板操作。无需 npm 安装、构建或数据库。

## 部署

将 `index.html`、`assets/`、`designs/` 和 `LICENSE` 上传到任意静态托管服务。所有内部路径均为相对路径，可部署到 GitHub Pages 子目录。在本仓库中，Cloudflare Pages / Netlify 的构建命令留空，发布目录设为 `website`。GitHub Pages 需通过 Actions 上传 `website/` 为静态站点产物，或将网站文件单独发布到 Pages 分支根目录。不要上传 `.context/`，其中仅含开发过程和上游检出。

所有设计内容均保存在仓库内，运行时不依赖 GitHub 或 getdesign.md。历史预览去除了远程字体与头像请求，字体会回退到系统字体。页面底部和“查看源文件”链接仍可跳转 GitHub。

## 数据来源与更新

- 当前文档：[mlhiter/awesome-design-md](https://github.com/mlhiter/awesome-design-md)，源自 VoltAgent，MIT。
- 历史预览：[Meliwat/awesome-design-md-pre-paywall](https://github.com/Meliwat/awesome-design-md-pre-paywall)，恢复上游 `ef729b2` 时期的 58 套预览，MIT。
- 精确来源 commit 记录在 `assets/catalog.js` 的 `sources` 字段。

可用 Python 标准库导入两个本地上游检出：

```sh
python3 scripts/import-designs.py --current /path/to/awesome-design-md --historical /path/to/awesome-design-md-pre-paywall
```

导入脚本保留原始 DESIGN.md，并从文档色彩字段生成本地目录。历史预览与当前文档来自不同版本，可能不一致；没有历史预览的条目只显示文档色板及示意组件。常用品牌的卡片用不同布局呈现文档的设计方向，并标为“文档示意”；其他有历史预览的条目展示本地 HTML 截图，其余明确标为“文档色板”。这些不是品牌官网截图。该站是非官方镜像，不包含原站的账号、付费请求或生成服务。

品牌商标与视觉标识属于各自所有者。设计文档与预览沿用 VoltAgent 的 MIT 许可证，见 [LICENSE](LICENSE)。

## 更新预览缩略图

先启动本地 HTTP 服务，再运行（需要已安装 `agent-browser` CLI）：

```sh
python3 scripts/capture-previews.py --url http://127.0.0.1:8047
```

脚本按历史预览实际页面截图，保存到 `assets/previews/`。偏暗设计使用深色历史预览，其余使用浅色；运行时直接加载本地图片，不启动浏览器。
