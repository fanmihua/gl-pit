# glfans

> 欢迎入坑。请保管好你的理智，虽然大概率用不上。

[欢迎入坑](https://fanmihua.github.io/glfans/#/) · [坑底文学](https://fanmihua.github.io/glfans/#/tide-words) · [考古档案](https://fanmihua.github.io/glfans/#/archive) · [Repo 文专栏](https://fanmihua.github.io/glfans/#/column) · [来捡表情包](https://fanmihua.github.io/glfans/#/memes) · [坑底电台](https://fanmihua.github.io/glfans/#/radio) · [关于](https://fanmihua.github.io/glfans/#/about)

[参与讨论](https://github.com/fanmihua/glfans/discussions) · [提交问题](https://github.com/fanmihua/glfans/issues)

[![Deploy GitHub Pages](https://github.com/fanmihua/glfans/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/fanmihua/glfans/actions/workflows/deploy-pages.yml)

glfans 是一个正在慢慢挖的泰百小网页。

起因很简单：随便看看一部剧。

后来事情变成了：补花絮、翻采访、逐帧研究眼神、宣布退坑，以及在下一支视频出现时郑重得出结论——

> **这次真的不一样。**

所以有了这个坑。

至于这里最后会长出什么——

还没想好。先挖着。

## 现在挖到哪了

`PIT STATUS: 首页片头、坑底文学、考古档案、REPO、MEME PIT、坑底电台都已接通`

现在打开网页，能看到几条已经挖通的路：

- **坑底文学**：看词频潮汐，也翻一翻坑底人留下的原话；卡片能拖动、交换和吸附；
- **考古档案**：按年份翻胶卷；真实事件资料尚未补齐时只展示建档状态，不编造内容；
- **Repo 文专栏**：从证据目录进入合集，再一路读到单篇图文档案；
- **来捡表情包**：按下拍立得快门，等一张表情包出片、显影、落进相纸栏；
- **坑底电台**：用唱片机选择网易云歌单中当前可播放的 12 首关联歌曲；
- **关于这个坑**：看看是谁在挖，以及这份热爱为什么还在继续。

页面使用黑白主体、粉色高亮的独立杂志排版，适配桌面和移动端，并通过 GitHub Pages 自动构建发布。

它还不是一个已经想明白的大网站。只是 Repo 写着写着，原话攒着攒着，表情包拍着拍着，坑又比昨天深了一点。

如果你突然想到点什么，或单纯觉得“这里不对”，欢迎开 [Issue](../../issues)、去 [Discussions](../../discussions) 聊聊，或者直接提交 Pull Request。

## 本地挖坑

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

生产构建与站点打包检查：

```bash
npm run build
npm run test:sites
```

### 坑底文学互动后台

互动功能使用 Supabase 托管数据库与身份服务，静态站不保存数据库密钥，也不需要常驻 Node 服务。复制 `.env.example` 为 `.env.local`，配置项目 URL 和 `publishable key` 后即可连接。

数据库表、RLS 权限和 RPC 位于 `supabase/migrations/`；完整的接入、管理员创建、安全与备份检查见 [坑底文学互动与后台计划](docs/tide-words-community-plan.md)。管理员入口为 `#/admin`，不出现在公开导航中。

## 坑底公约

- 嗑糖可以，造谣不行。
- 自由心证可以，替真人盖章不行。
- 考古可以，隐私不挖。
- 玩梗归玩梗，公开资料和素材尽量标明来源。
- 如果塌了，先深呼吸；如果没塌，也先别急着贷款一辈子。

## 内容与权利

glfans 是非官方、非商业的粉丝共创站。第三方素材相关权利归原权利人；站点原创版权仅覆盖原创文字、设计与代码。完整边界、反馈流程和素材台账见 [内容权利与素材管理](docs/RIGHTS_POLICY.md)，仓库授权范围见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。参与共创前请先看 [CONTRIBUTING](CONTRIBUTING.md)。
