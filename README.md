# IELTI 学习工具

## 源码与发布

根目录是主要源码位置，不要直接把 `deploy/` 当作唯一维护目录。

主要页面包括：

- `index.html`
- `ielts-roadmap.html`
- `ielts_word_memory_v2_ipa.html`
- `ielts-core-vocabulary.html`
- `ielts-vocabulary-categories.html`
- `121-letter-combinations.html`

共享样式主要在 `apple-ui.css` 和 `eink-ui.css`，共享逻辑主要在 `ielti-core.js`。需要统一标题、导航、显示模式、播放器、Apple 风格或墨水屏模式时，优先修改共享文件。

发布到 GitHub 前，默认只上传网页运行需要的 HTML、CSS、JS、manifest、service worker 和 icon；不要上传视频、PDF、课程资料、截图、进度备份或 `node_modules`。除非用户明确要求“上传到 GitHub / 发布 / 推送”，否则只在本地修改。

## 进度备份

所有学习页面都提供“导出/导入进度”。导出的 `IELTI-progress-日期.json` 同时包含路线图打卡、计划开始日期、核心词表掌握状态、分类词汇掌握状态、间隔重复记录和自动同步身份；在新设备导入一次后，后续进度会自动同步。主题、翻译缓存、IPA 缓存等设置不会写入备份。

同步由 `ielti-config.js` 统一配置。直接打开本地 `file://` 页面时也可以连接 NAS 同步接口；如果没有配置可用接口，才只保存在当前浏览器。由于不同网站拥有独立的本地存储，第一次切换入口时建议先导出一份备份，再让自动同步合并数据。

导入只接受 IELTI v1 格式并在写入前要求确认；未包含的数据不会被清除。

## 今日学习与统一进度

打开根目录 `index.html` 进入“今日学习”。统一数据保存在 `ielti_progress_v3`，旧版路线图、核心词表、分类词汇和间隔重复记录会自动迁移。单词复习使用动态间隔、难度系数、连续记忆次数和遗忘次数计算下次复习时间。

## PWA

通过 HTTPS 或本地 HTTP 服务访问时可安装为应用并离线打开。直接双击 `file://` 页面仍可学习，但浏览器不会启用 Service Worker。

## NAS 媒体与进度同步

课程视频和 PDF 不放进 GitHub。路线图会通过 `ielti-config.js` 判断运行环境：本地 `file://` 打开时继续使用本地相对路径；在 GitHub Pages 这类线上页面打开时，视频和 PDF 链接会指向 `nasBaseUrl` 配置的群晖地址。

进度同步接口是 `ielti-sync.php`，用于把本地页面、NAS 页面和将来的 GitHub 页面同步到同一份 `ielti_progress_v3` 数据。现在默认指向 `http://100.71.87.40/IELTI/ielti-sync.php`；如果 GitHub Pages 要直接自动同步，需要先把 NAS 配成可信 HTTPS，然后在 `ielti-config.js` 填入 `nasHttpsBaseUrl`。
