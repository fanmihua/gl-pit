# 坑底文学互动与后台计划

## 边界

- 静态网站和图片继续由静态服务器/CDN 发布。
- Supabase 承担 PostgreSQL、匿名身份、管理员登录和 Data API。
- 浏览器只使用 `publishable key`；任何 `secret` / `service_role` key 都不能进入前端构建。
- 页面留言和卡片评论提交后直接以 `published` 公开；管理员只做事后隐藏或恢复。
- 当前不做头像、关注、私信、通知、楼中楼和实时在线人数。

## 已规划的数据

- `community_comments`：页面留言与卡片评论。
- `community_quotes`：可由管理员编辑、排序、发布或隐藏的原话卡片。
- `community_reactions`：每个匿名身份对每个目标最多一条心动记录。
- `community_views`：按匿名身份与目标聚合浏览；30 分钟内重复打开不重复累计。
- `community_admins`：允许进入审核后台的 Supabase 用户。

## 前台请求策略

1. 进入坑底文学时，一次读取所有目标的聚合统计。
2. 页面初始化一次匿名身份并登记页面浏览。
3. 卡片只展示统计；点击卡片后才加载该卡片的评论并登记卡片浏览。
4. 公共留言板只读取最近 12 条已公开留言。
5. 评论不会在所有卡片上预加载，避免无意义请求。

## 接入 Supabase

1. 新建 Supabase 项目并启用 Anonymous Sign-Ins。
2. 在 SQL Editor 执行 `supabase/migrations/20260902090000_tide_words_community.sql`。
3. 在 Authentication 中创建管理员邮箱用户。
4. 使用该用户的 UUID 执行：

   ```sql
   insert into public.community_admins (user_id)
   values ('管理员的 auth.users.id');
   ```

5. 复制 `.env.example` 为 `.env.local`，填入项目 URL 和 `publishable key`。
6. 新域名确定后，在 Supabase Auth URL Configuration 中加入正式域名。

## 上线前安全项

- 给 Anonymous Sign-Ins 接入 Cloudflare Turnstile。
- Turnstile token 必须由 Supabase Edge Function 或 Cloudflare Worker 在服务端校验。
- 根据正式域名设置允许来源并增加边缘层速率限制。
- 设置定期 `supabase db dump`，并将备份保存在托管服务之外。
- 用非管理员、匿名用户和管理员三类身份分别验证 RLS 的允许/拒绝路径。

## 分阶段交付

### 第一阶段：当前分支

- 页面级路过、心动、回声统计。
- 页面点赞和公共留言板。
- 卡片点赞、评论数和按需打开的评论抽屉。
- 独立管理员内容与回声管理页。
- SQL migration、配置示例和无配置安全降级。

### 第二阶段：正式域名确定后

- 绑定生产 Supabase 项目。
- 接入 Turnstile 与服务端 token 校验。
- 配置 CDN 缓存、正式域名、备份和监控。
- 使用真实匿名/管理员身份进行线上验收。
