import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const playlistId = "17374864309";
const headers = { "user-agent": "Mozilla/5.0" };
const cpGroups = [
  {
    id: "janjingjing",
    name: "JanJingJing",
    artwork: "assets/home/janjingjing-card-v1.webp",
    positions: [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20, 21],
  },
  {
    id: "emibonnie",
    name: "EmiBonnie",
    artwork: "assets/home/emibonnie-card-v1.webp",
    positions: [6, 7, 8, 18, 24, 25, 26, 27, 28, 29],
  },
  {
    id: "namtanfilm",
    name: "NamtanFilm",
    artwork: "assets/home/namtanfilm-card-v1.webp",
    positions: [17],
  },
  {
    id: "pangjiemable",
    name: "PangjieMable",
    artwork: "assets/archive/posters/clairebell.webp",
    positions: [22, 23],
  },
  {
    id: "janekao",
    name: "JaneKao",
    artwork: "assets/home/janekao-card-v1.webp",
    positions: [30, 31, 32],
  },
  {
    id: "lingorm",
    name: "LingOrm",
    artwork: "assets/home/lingorm-card-v1.webp",
    positions: [33],
  },
  {
    id: "ginjay",
    name: "GinJay",
    artwork: "assets/home/ginjay-card-v1.webp",
    positions: [34, 35, 36, 37, 38, 39],
  },
  {
    id: "lookmheesonya",
    name: "LookmheeSonya",
    artwork: "assets/archive/posters/harmony-secret.webp",
    positions: [40, 41, 42, 43],
  },
];

async function readJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`网易云请求失败：${response.status} ${url}`);
  return response.json();
}

const playlistResponse = await readJson(`https://music.163.com/api/v6/playlist/detail?id=${playlistId}&n=1000`);
const playlist = playlistResponse.playlist;
const trackIds = playlist.trackIds.map(({ id }) => id);
const encodedIds = encodeURIComponent(JSON.stringify(trackIds));
const [songResponse, urlResponse] = await Promise.all([
  readJson(`https://music.163.com/api/song/detail?ids=${encodedIds}`),
  readJson(`https://music.163.com/api/song/enhance/player/url?ids=${encodedIds}&br=128000`),
]);

const songsById = new Map(songResponse.songs.map((song) => [song.id, song]));
const urlsById = new Map(urlResponse.data.map((item) => [item.id, item]));
const tracks = trackIds.map((id, index) => {
  const song = songsById.get(id);
  const playback = urlsById.get(id);
  const position = index + 1;
  const cp = cpGroups.find((group) => group.positions.includes(position));
  if (!cp) throw new Error(`歌单第 ${position} 首尚未配置 CP 关联：${song.name}`);
  return {
    id: String(id),
    position,
    name: song.name,
    artists: (song.artists ?? song.ar ?? []).map((artist) => artist.name),
    album: song.album?.name ?? song.al?.name ?? "网易云歌单",
    cover: (song.album?.picUrl ?? song.al?.picUrl ?? "").replace(/^http:/, "https:"),
    duration: song.duration ?? song.dt ?? 0,
    playable: Boolean(playback?.url),
    outerUrl: `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
    officialUrl: `https://music.163.com/song?id=${id}`,
    cpId: cp.id,
    cpName: cp.name,
    cpArtwork: cp.artwork,
  };
});

const output = {
  playlistId,
  name: playlist.name,
  syncedAt: new Date().toISOString(),
  trackCount: tracks.length,
  playableCount: tracks.filter((track) => track.playable).length,
  tracks,
};

const outputPath = resolve("src/data/netease-playlist.json");
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`已同步 ${output.trackCount} 首，当前可直接播放 ${output.playableCount} 首：${outputPath}`);
