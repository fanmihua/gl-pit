import neteasePlaylist from "../../data/netease-playlist.json";

const stationPositions = {
  janjingjing: "station-east-south",
  emibonnie: "station-east-middle",
  janekao: "station-north",
  ginjay: "station-west-south",
};

const fallbackStationPositions = [
  "station-north",
  "station-east-middle",
  "station-east-south",
  "station-west-south",
];

export const pitRadioTrackCatalog = neteasePlaylist.tracks
  .filter((track) => track.playable)
  .map((track, index) => {
    const hasCpArtwork = track.cpArtwork?.startsWith("assets/home/");
    return {
      id: `netease:${track.id}`,
      source: "netease",
      audioUrl: track.outerUrl,
      trackTitle: track.name,
      trackArtist: track.artists.join(" / "),
      cover: track.cover,
      officialUrl: track.officialUrl,
      cpId: track.cpId,
      cpName: track.cpName,
      cpArtwork: hasCpArtwork ? track.cpArtwork : track.cover,
      hasCpArtwork,
      playlistPosition: index + 1,
      sourcePosition: track.position,
    };
  });

export const pitRadioStations = Array.from(
  pitRadioTrackCatalog.reduce((stations, track) => {
    if (!track.hasCpArtwork) return stations;
    const existing = stations.get(track.cpId);
    if (existing) {
      existing.trackIds.push(track.id);
      existing.trackCount += 1;
      return stations;
    }

    const stationIndex = stations.size;
    stations.set(track.cpId, {
      id: track.cpId,
      name: track.cpName,
      sticker: track.cpArtwork,
      position: stationPositions[track.cpId] ?? fallbackStationPositions[stationIndex % fallbackStationPositions.length],
      firstTrackId: track.id,
      trackIds: [track.id],
      trackCount: 1,
    });
    return stations;
  }, new Map()).values(),
);
