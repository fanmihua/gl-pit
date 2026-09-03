// UI decisions only; audio playback continues to belong to PitRadioProvider.
export function mobileRadioControls({ selectedTrack, activePath, needleDown, playbackPhase, playerReady, playerError }) {
  const isPlaying = Boolean(needleDown && playbackPhase === "playing" && !playerError);
  const canPause = Boolean(needleDown && playbackPhase !== "idle" && !playerError);
  return {
    showQuickControls: Boolean(selectedTrack && activePath !== "radio"),
    isPlaying,
    canPause,
    disabled: !playerReady || !selectedTrack,
    action: playerError ? "重试播放" : canPause ? "暂停音乐" : needleDown ? "继续播放音乐" : "播放音乐",
    status: playerError ? "播放遇到问题，可重试" : isPlaying ? "正在播放" : canPause ? "正在缓冲" : needleDown ? "已暂停" : "等待播放",
  };
}
