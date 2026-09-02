import {
  ArrowLeft,
  Check,
  Eye,
  EyeSlash,
  Funnel,
  Heart,
  SignOut,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isCommunityConfigured, loadCommunityStats } from "./community-api.js";
import { resetCommunitySessionPromise, supabase } from "./lib/supabase.js";
import "./admin-page.css";

const statusOptions = [
  { id: "pending", label: "待审核" },
  { id: "published", label: "已公开" },
  { id: "hidden", label: "已隐藏" },
];
const quoteStatusOptions = [
  { id: "published", label: "公开" },
  { id: "draft", label: "草稿" },
  { id: "hidden", label: "隐藏" },
];

function withBase(assetPath) {
  return `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, "")}`;
}

function formatTarget(comment, quoteById) {
  if (comment.target_type === "page") return "坑底留言板";
  const quote = quoteById.get(comment.target_id);
  return quote ? `${comment.target_id.toUpperCase()} · ${quote.text}` : comment.target_id;
}

function AdminHeader({ onSignOut, signedIn }) {
  return (
    <header className="community-admin-header">
      <a className="community-admin-brand" href="#/">
        <img src={withBase("assets/gl-pit-logo.webp")} width="369" height="258" alt="glfans" />
        <span>COMMUNITY DESK</span>
      </a>
      <div>
        <a href="#/tide-words"><ArrowLeft weight="bold" aria-hidden="true" />返回坑底文学</a>
        {signedIn ? (
          <button type="button" onClick={onSignOut}><SignOut weight="bold" aria-hidden="true" />退出</button>
        ) : null}
      </div>
    </header>
  );
}

function AdminLogin({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState("submitting");
    setErrorMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState("error");
      setErrorMessage("邮箱或密码不对，或者账号还没有启用。 ");
      return;
    }
    resetCommunitySessionPromise();
    setState("success");
    onAuthenticated(data.session);
  };

  return (
    <section className="community-admin-login" aria-labelledby="community-admin-login-title">
      <span>PRIVATE ENTRY</span>
      <h1 id="community-admin-login-title">坑底编辑台</h1>
      <p>这里不靠隐藏地址保护。只有写入管理员名单的 Supabase 账号能够审核内容。</p>
      <form onSubmit={handleSubmit}>
        <label>
          <span>管理员邮箱</span>
          <input type="email" value={email} autoComplete="username" required onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>密码</span>
          <input type="password" value={password} autoComplete="current-password" required onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? <SpinnerGap className="is-spinning" aria-hidden="true" /> : null}
          {state === "submitting" ? "正在核对" : "进入后台"}
        </button>
        <p className="community-admin-form-message" aria-live="polite">{errorMessage}</p>
      </form>
    </section>
  );
}

function AdminSetupNotice() {
  return (
    <section className="community-admin-setup" aria-labelledby="community-admin-setup-title">
      <span>BACKEND NOT CONNECTED</span>
      <h1 id="community-admin-setup-title">后台代码已经到位，数据服务还没接线。</h1>
      <p>创建 Supabase 项目后，把公开连接信息写入部署环境，后台登录和审核功能才会开放。</p>
      <ol>
        <li>执行仓库中的 Supabase migration。</li>
        <li>启用匿名登录，并创建管理员账号。</li>
        <li>配置 <code>VITE_SUPABASE_URL</code> 和 <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>。</li>
      </ol>
      <a href="#/tide-words">先返回坑底文学</a>
    </section>
  );
}

function QuoteEditor({ busy, onSave, quote }) {
  const [text, setText] = useState(quote.text);
  const [speaker, setSpeaker] = useState(quote.speaker);
  const [status, setStatus] = useState(quote.status);
  const [sortOrder, setSortOrder] = useState(quote.sort_order);

  useEffect(() => {
    setText(quote.text);
    setSpeaker(quote.speaker);
    setStatus(quote.status);
    setSortOrder(quote.sort_order);
  }, [quote]);

  return (
    <form className="community-admin-quote-editor" onSubmit={(event) => {
      event.preventDefault();
      onSave(quote.id, { text, speaker, status, sort_order: Number(sortOrder) || 0 });
    }}>
      <span>{quote.id.toUpperCase()}</span>
      <label>
        <span>原话</span>
        <textarea value={text} minLength={2} maxLength={120} required rows={3} onChange={(event) => setText(event.target.value)} />
      </label>
      <div>
        <label>
          <span>署名</span>
          <input value={speaker} maxLength={40} required onChange={(event) => setSpeaker(event.target.value)} />
        </label>
        <label>
          <span>顺序</span>
          <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
        </label>
      </div>
      <div className="community-admin-quote-footer">
        <select value={status} aria-label={`${quote.id} 展示状态`} onChange={(event) => setStatus(event.target.value)}>
          {quoteStatusOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
        </select>
        <button type="submit" disabled={busy}>{busy ? "保存中" : "保存卡片"}</button>
      </div>
    </form>
  );
}

function AdminDashboard({ session, onSignOut }) {
  const [comments, setComments] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("pending");
  const [state, setState] = useState("loading");
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [newQuoteText, setNewQuoteText] = useState("");

  const loadDashboard = useCallback(async () => {
    setState("loading");
    const [commentsResult, quotesResult, nextStats] = await Promise.all([
      supabase
        .from("community_comments")
        .select("id,target_type,target_id,user_id,nickname,body,status,created_at,moderated_at")
        .order("created_at", { ascending: false })
        .limit(250),
      supabase
        .from("community_quotes")
        .select("id,text,speaker,cover_path,sort_order,status,created_at,updated_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      loadCommunityStats(),
    ]);
    if (commentsResult.error) throw commentsResult.error;
    if (quotesResult.error) throw quotesResult.error;
    setComments(commentsResult.data ?? []);
    setQuotes(quotesResult.data ?? []);
    setStats(nextStats);
    setState("ready");
  }, []);

  useEffect(() => {
    loadDashboard().catch(() => setState("error"));
  }, [loadDashboard]);

  const filteredComments = useMemo(() => comments.filter((comment) => comment.status === filter), [comments, filter]);
  const quoteById = useMemo(() => new Map(quotes.map((quote) => [quote.id, quote])), [quotes]);
  const totals = useMemo(() => Object.values(stats).reduce((sum, item) => ({
    comments: sum.comments + item.comments,
    likes: sum.likes + item.likes,
    views: sum.views + item.views,
  }), { comments: 0, likes: 0, views: 0 }), [stats]);

  const moderate = async (commentId, nextStatus) => {
    setBusyId(commentId);
    setMessage("");
    const { error } = await supabase
      .from("community_comments")
      .update({
        status: nextStatus,
        moderated_at: new Date().toISOString(),
        moderated_by: session.user.id,
      })
      .eq("id", commentId);
    if (error) {
      setMessage("这条回声没有更新成功，请检查管理员权限。 ");
    } else {
      setComments((current) => current.map((comment) => (
        comment.id === commentId ? { ...comment, status: nextStatus } : comment
      )));
      setMessage(nextStatus === "published" ? "已经公开。" : "已经隐藏。 ");
    }
    setBusyId(null);
  };

  const saveQuote = async (quoteId, patch) => {
    setBusyId(quoteId);
    setMessage("");
    const { data, error } = await supabase
      .from("community_quotes")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", quoteId)
      .select("id,text,speaker,cover_path,sort_order,status,created_at,updated_at")
      .single();
    if (error) setMessage("卡片没有保存成功，请检查内容长度和管理员权限。 ");
    else {
      setQuotes((current) => current.map((quote) => quote.id === quoteId ? data : quote).sort((a, b) => a.sort_order - b.sort_order));
      setMessage("卡片已经保存。 ");
    }
    setBusyId(null);
  };

  const createQuote = async (event) => {
    event.preventDefault();
    const text = newQuoteText.trim();
    if (text.length < 2) return;
    setBusyId("new-quote");
    setMessage("");
    const nextSortOrder = Math.max(0, ...quotes.map((quote) => quote.sort_order || 0)) + 10;
    const { data, error } = await supabase
      .from("community_quotes")
      .insert({ text, speaker: "匿名坑底人", sort_order: nextSortOrder, status: "draft" })
      .select("id,text,speaker,cover_path,sort_order,status,created_at,updated_at")
      .single();
    if (error) setMessage("新卡片没有建好，请检查管理员权限。 ");
    else {
      setQuotes((current) => [...current, data]);
      setNewQuoteText("");
      setMessage("新卡片已保存为草稿。 ");
    }
    setBusyId(null);
  };

  return (
    <>
      <AdminHeader signedIn onSignOut={onSignOut} />
      <main className="community-admin-dashboard">
        <section className="community-admin-masthead">
          <div>
            <span>GLFANS / COMMUNITY DESK</span>
            <h1>坑底编辑台</h1>
            <p>{session.user.email}</p>
          </div>
          <dl>
            <div><dt><Eye aria-hidden="true" />浏览</dt><dd>{totals.views}</dd></div>
            <div><dt><Heart aria-hidden="true" />心动</dt><dd>{totals.likes}</dd></div>
            <div><dt><Check aria-hidden="true" />公开回声</dt><dd>{totals.comments}</dd></div>
          </dl>
        </section>

        <section className="community-admin-content" aria-labelledby="community-admin-content-title">
          <header>
            <div>
              <span>VOICE CARDS</span>
              <h2 id="community-admin-content-title">原话卡片</h2>
              <p>编辑文字、署名、顺序和公开状态；隐藏卡片不会从数据库删除。</p>
            </div>
            <form className="community-admin-new-quote" onSubmit={createQuote}>
              <label htmlFor="community-new-quote">新卡片</label>
              <input id="community-new-quote" value={newQuoteText} maxLength={120} placeholder="先写一句，默认保存为草稿" onChange={(event) => setNewQuoteText(event.target.value)} />
              <button type="submit" disabled={busyId === "new-quote" || newQuoteText.trim().length < 2}>新增草稿</button>
            </form>
          </header>
          <div className="community-admin-quote-grid">
            {quotes.map((quote) => (
              <QuoteEditor busy={busyId === quote.id} key={quote.id} quote={quote} onSave={saveQuote} />
            ))}
          </div>
        </section>

        <section className="community-admin-review" aria-labelledby="community-admin-review-title">
          <header>
            <div>
              <span><Funnel weight="bold" aria-hidden="true" />MODERATION QUEUE</span>
              <h2 id="community-admin-review-title">回声审核</h2>
            </div>
            <div className="community-admin-filters" aria-label="按状态筛选">
              {statusOptions.map((option) => (
                <button
                  type="button"
                  aria-pressed={filter === option.id}
                  onClick={() => setFilter(option.id)}
                  key={option.id}
                >
                  {option.label}
                  <small>{comments.filter((comment) => comment.status === option.id).length}</small>
                </button>
              ))}
            </div>
          </header>
          <p className="community-admin-message" aria-live="polite">{message}</p>

          {state === "loading" ? (
            <p className="community-admin-state"><SpinnerGap className="is-spinning" aria-hidden="true" />正在整理回声</p>
          ) : null}
          {state === "error" ? <p className="community-admin-state">数据没有打开。请确认 migration 和管理员名单。</p> : null}
          {state === "ready" && !filteredComments.length ? <p className="community-admin-state">这一栏现在是空的。</p> : null}

          <ol className="community-admin-comment-list">
            {filteredComments.map((comment) => (
              <li key={comment.id}>
                <div className="community-admin-comment-meta">
                  <strong>{comment.nickname}</strong>
                  <time dateTime={comment.created_at}>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.created_at))}</time>
                </div>
                <span className="community-admin-target">{formatTarget(comment, quoteById)}</span>
                <p>{comment.body}</p>
                <div className="community-admin-comment-actions">
                  {comment.status !== "published" ? (
                    <button type="button" disabled={busyId === comment.id} onClick={() => moderate(comment.id, "published")}>
                      <Eye weight="bold" aria-hidden="true" />公开
                    </button>
                  ) : null}
                  {comment.status !== "hidden" ? (
                    <button type="button" disabled={busyId === comment.id} onClick={() => moderate(comment.id, "hidden")}>
                      <EyeSlash weight="bold" aria-hidden="true" />隐藏
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}

export function AdminPage() {
  const [session, setSession] = useState(null);
  const [authState, setAuthState] = useState(isCommunityConfigured ? "loading" : "unconfigured");
  const [isAdmin, setIsAdmin] = useState(false);

  const verifyAdmin = useCallback(async (nextSession) => {
    if (!nextSession || nextSession.user?.is_anonymous) {
      setSession(nextSession);
      setIsAdmin(false);
      setAuthState("signed-out");
      return;
    }

    setSession(nextSession);
    setAuthState("checking");
    const { data, error } = await supabase
      .from("community_admins")
      .select("user_id")
      .eq("user_id", nextSession.user.id)
      .maybeSingle();
    if (error || !data) {
      setIsAdmin(false);
      setAuthState("forbidden");
      return;
    }
    setIsAdmin(true);
    setAuthState("ready");
  }, []);

  useEffect(() => {
    if (!isCommunityConfigured) return undefined;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) verifyAdmin(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) verifyAdmin(nextSession);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [verifyAdmin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    resetCommunitySessionPromise();
    setSession(null);
    setIsAdmin(false);
    setAuthState("signed-out");
  };

  if (!isCommunityConfigured) {
    return <main className="community-admin-page"><AdminHeader /><AdminSetupNotice /></main>;
  }

  if (authState === "loading" || authState === "checking") {
    return (
      <main className="community-admin-page">
        <AdminHeader />
        <p className="community-admin-auth-state"><SpinnerGap className="is-spinning" aria-hidden="true" />正在核对管理员身份</p>
      </main>
    );
  }

  if (authState === "forbidden") {
    return (
      <main className="community-admin-page">
        <AdminHeader signedIn onSignOut={signOut} />
        <section className="community-admin-forbidden">
          <span>ACCESS NOT LISTED</span>
          <h1>账号是真的，管理员身份还没有。</h1>
          <p>请把账号 UUID 写入 <code>community_admins</code> 后重新进入。</p>
        </section>
      </main>
    );
  }

  if (!session || !isAdmin) {
    return <main className="community-admin-page"><AdminHeader /><AdminLogin onAuthenticated={verifyAdmin} /></main>;
  }

  return <AdminDashboard session={session} onSignOut={signOut} />;
}
