import { t } from "../../i18n/runtime.js";
import { withBase } from "../../lib/assets.js";
import { HOME_MEDIA_NOTICE } from "../../rights.js";
import { RightsNotice } from "../../RightsNotice.jsx";

export function PitOrbitCurves({ className = "", mobileOrbits = null }) {
  if (mobileOrbits) {
    return (
      <svg
        className={`${className} pit-home-orbits-mobile`}
        viewBox={mobileOrbits.viewBox}
        preserveAspectRatio="none"
        style={{ "--orbit-center-x": `${mobileOrbits.centerX}%`, "--orbit-center-y": `${mobileOrbits.centerY}%` }}
        aria-hidden="true"
      >
        {t(mobileOrbits.paths.map((path, index) => <path className="orbit-path" d={path} key={index} />))}
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true">
      <path className="orbit-path orbit-path-one" d="M 1490 118 C 1350 156, 1275 334, 1088 476 C 988 552, 938 612, 852 684" />
      <path className="orbit-path orbit-path-two" d="M 1035 118 C 1024 288, 968 448, 888 598 C 864 642, 850 668, 838 690" />
      <path className="orbit-path orbit-path-three" d="M 1554 430 C 1376 438, 1244 504, 1092 586 C 996 638, 926 664, 858 694" />
      <path className="orbit-path orbit-path-four" d="M 1212 826 C 1102 796, 994 748, 902 716 C 874 706, 852 700, 838 696" />
      <path className="orbit-path orbit-path-five" d="M 118 780 C 308 772, 438 738, 618 716 C 708 706, 774 702, 826 700" />
    </svg>
  );
}

export function EyesOrbitCurves({ mobileOrbits = null }) {
  return (
    <svg className="eyes-orbit-lines" viewBox={mobileOrbits?.viewBox ?? "0 0 1672 941"} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="eyes-curve-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <path className="eyes-orbit-solid" d={mobileOrbits?.solid ?? "M 68 780 C 34 726, 168 691, 332 724 C 560 770, 760 660, 980 548 C 1200 434, 1400 350, 1590 230 C 1660 185, 1650 274, 1600 330"} />
      <path className="eyes-orbit-dashed" markerEnd="url(#eyes-curve-arrow)" d={mobileOrbits?.dashed ?? "M 1505 230 C 1430 270, 1438 330, 1525 386 C 1635 456, 1634 552, 1538 626 C 1350 770, 1030 708, 720 770 C 560 800, 470 820, 396 838"} />
      {t(!mobileOrbits && <circle cx="486" cy="733" r="8" />)}
    </svg>
  );
}

export function WelcomeOrbitCurves({ mobileOrbit = null, desktopOrbit = null }) {
  return (
    <svg className="welcome-orbit-lines" viewBox={mobileOrbit?.viewBox ?? desktopOrbit?.viewBox ?? "0 0 1672 941"} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="welcome-curve-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth={mobileOrbit ? 5 : 8} markerHeight={mobileOrbit ? 5 : 8} orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <path className="welcome-route-guide welcome-orbit-pink-desktop" d={desktopOrbit?.guide ?? "M 1120 70 L 1120 172"} />
      <path className="welcome-orbit-echo welcome-orbit-pink-desktop" d={desktopOrbit?.path ?? "M 1094 168 C 1162 168, 1218 172, 1220 205 C 1218 256, 1088 323, 1010 378 C 918 442, 842 505, 836 544"} />
      <path
        className="welcome-orbit-pink welcome-orbit-pink-desktop"
        markerEnd="url(#welcome-curve-arrow)"
        d={desktopOrbit?.path ?? "M 1094 168 C 1162 168, 1218 172, 1220 205 C 1218 256, 1088 323, 1010 378 C 918 442, 842 505, 836 544"}
      />
      <path
        className="welcome-orbit-pink welcome-orbit-pink-mobile"
        markerEnd="url(#welcome-curve-arrow)"
        d={mobileOrbit?.path ?? "M 1240 128 C 1450 146, 1270 222, 1080 262 C 920 296, 838 326, 840 366"}
      />
    </svg>
  );
}

export function PitPortal({ className = "", style }) {
  return (
    <div className={`pit-portal-collage ${className}`} style={style} aria-hidden="true">
      <span className="pit-portal-paper-fusion" />
      <img
        className="pit-portal-image"
        src={withBase("assets/home/pit-portal-v1.webp")}
        width="1448"
        height="1086"
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        data-page-critical="true"
      />
    </div>
  );
}

export function HomeRightsNotice({ className = "" }) {
  return (
    <RightsNotice className={`home-rights-notice ${className}`} notice={HOME_MEDIA_NOTICE} />
  );
}
