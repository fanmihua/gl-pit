import { useState } from "react";
import { RepoFilmStrip } from "./RepoFilmStrip.jsx";
import { SiteHeader } from "./SiteHeader.jsx";
import { RIGHTS_FEEDBACK_URL, RIGHTS_SHORT_NOTICE } from "./rights.js";
import "./about-page.css";

const withBase = (assetPath) => `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, "")}`;

function HanddrawnHeart({ className = "" }) {
  return (
    <img
      className={className}
      src={withBase("assets/repo-handdrawn-heart-pink.webp")}
      alt=""
      aria-hidden="true"
      decoding="async"
      data-page-critical="true"
    />
  );
}

export function AboutPage({ defaultRightsOpen = false }) {
  const [rightsOpen, setRightsOpen] = useState(defaultRightsOpen);

  return (
    <main className="about-shell">
      <SiteHeader activePath="about" />

      <section className="about-stage" aria-labelledby="about-title">
        <span className="about-ghost-word" aria-hidden="true">ABOUT</span>

        <div className="about-title-cluster">
          <HanddrawnHeart className="about-heart about-heart-title" />
          <h1 id="about-title" aria-label="关于这个坑">
            <span className="about-title-top" aria-hidden="true">
              <i>关</i><i>于</i>
            </span>
            <span className="about-title-bottom" aria-hidden="true">
              {["这", "个", "坑"].map((character) => <i key={character}>{character}</i>)}
            </span>
          </h1>
          <img
            className="about-title-underline"
            src={withBase("assets/repo-handdrawn-underline-pink.webp")}
            alt=""
            aria-hidden="true"
            decoding="async"
            data-page-critical="true"
          />
          <strong className="about-pullquote">这次真的不一样。</strong>
          <img
            className="about-loop-arrow"
            src={withBase("assets/about/annotation-loop-arrow-v1.webp")}
            alt=""
            aria-hidden="true"
            data-page-critical="true"
          />
          <p className="about-margin-note">because love<br />is real.</p>
          <HanddrawnHeart className="about-heart about-heart-margin" />
        </div>

        <div className="about-copy">
          <div className="about-copy-text">
            <p>
              这是一个自嘲式泰百粉丝磕糖网站，记录泰百 CP 的入坑欣喜、
              磕糖的上头、塌房的心酸，以及自嘲的嘴硬。二创是因为真的热爱，
              也时刻提醒自己保留一点“良好心态”——
              <strong>【不磕 RPS】【都是侄女，放心磕】</strong>。
            </p>
          </div>
          <p className="about-top-note">we pit, we write,<br />we love.</p>
          <HanddrawnHeart className="about-heart about-heart-top" />
        </div>

        <section className="about-makers" aria-labelledby="about-makers-title">
          <header className="about-makers-heading">
            <h2 id="about-makers-title">挖坑的人</h2>
            <HanddrawnHeart className="about-makers-heart" />
            <span aria-hidden="true" />
          </header>

          <div className="about-maker-grid">
            <article className="about-maker">
              <strong>Conceal</strong>
              <span>Content</span>
              <p>写字的，收藏心动与情绪。<br />让爱有迹可循。</p>
            </article>
            <span className="about-maker-divider" aria-hidden="true">/</span>
            <article className="about-maker about-maker-design">
              <strong>范米花儿</strong>
              <span>Design &amp; Dev</span>
              <p>做页面的，搭建与维护这个小窝。<br />让热爱有处安放。</p>
            </article>
          </div>

          <p className="about-maker-note">
            for us,<br /><span>for GL.</span>
            <img src={withBase("assets/repo-handdrawn-underline-pink.webp")} alt="" aria-hidden="true" decoding="async" />
          </p>
        </section>

        <aside className="about-welcome" aria-label="欢迎与参与说明">
          <strong>欢迎入坑，磕得<span>开心</span>最重要！</strong>
          <i aria-hidden="true" />
          <p>
            如果你也想分享你的文字、图文、表情包或宝藏资源，<br />
            欢迎联系我们，一起把这份热爱攒得更大、更久一点。
          </p>
          <HanddrawnHeart className="about-heart about-heart-welcome" />
        </aside>

        <details
          className="about-rights"
          open={rightsOpen}
          onToggle={(event) => setRightsOpen(event.currentTarget.open)}
        >
          <summary>
            <span>RIGHTS &amp; CREDITS</span>
            <strong>版权与权利说明</strong>
            <small>{RIGHTS_SHORT_NOTICE}</small>
            <i>展开完整说明</i>
          </summary>
          <div className="about-rights-content">
            <article>
              <h3>非官方声明</h3>
              <p>
                glfans 是由粉丝自发维护的非商业共创网站，与相关艺人、经纪公司、
                剧集制作方、发行平台及品牌不存在隶属、合作或授权关系，页面另有明确说明的除外。
              </p>
            </article>
            <article>
              <h3>内容与权利</h3>
              <p>
                网站原创文字、设计、编排和代码归相应创作者所有。页面涉及的艺人姓名与肖像、
                剧照、海报、节目截图、歌曲、官方视频及其他第三方素材，其相关权利归原权利人所有。
                引用内容主要用于作品介绍、评论和资料整理，不代表 glfans 对相关素材拥有权利。
              </p>
            </article>
            <article>
              <h3>使用边界</h3>
              <p>
                除页面明确开放的无真人脸表情素材外，glfans 不提供完整剧集、完整音视频、破解资源、
                付费内容转载或来源待核实的第三方素材下载，也不会利用艺人肖像暗示代言、合作或进行商品销售。
              </p>
            </article>
            <article>
              <h3>权利反馈</h3>
              <p>
                如您是相关权利人并对页面内容有异议，请提供具体页面地址、涉及内容与处理诉求。
                请勿在公开页面提交身份证件等敏感材料；需要进一步核验时再转为非公开沟通。
                我们将在核验后及时补充标注、更正、下架或断开链接。
              </p>
              <a href={RIGHTS_FEEDBACK_URL} target="_blank" rel="noreferrer">提交权利反馈</a>
            </article>
            <p className="about-rights-copyright">
              © 2026 glfans，仅指网站原创文字、设计与代码；不涵盖艺人肖像、剧照、海报、音视频及其他第三方素材。
            </p>
          </div>
        </details>
      </section>

      <RepoFilmStrip />
    </main>
  );
}
