export const collectedQuotes = [
  { id: "q-01", text: "这次真的不一样。", speaker: "匿名坑底人" },
  { id: "q-02", text: "两眼一睁就是磕。", speaker: "匿名坑底人" },
  { id: "q-03", text: "正主虚情热演，粉丝假意上头。", speaker: "匿名坑底人" },
  { id: "q-04", text: "卖得专业就打赏，惹怒粉丝就换推。", speaker: "匿名坑底人" },
  { id: "q-05", text: "只是售后，入坑三月都懂。", speaker: "匿名坑底人" },
  { id: "q-06", text: "可以嗑，但不要嗑得那么执着。", speaker: "匿名坑底人" },
  { id: "q-07", text: "每对 CP 在自己 CP 粉眼中都是真情侣。", speaker: "匿名坑底人" },
  { id: "q-08", text: "在别家 CP 粉眼里都一眼假。", speaker: "匿名坑底人" },
  { id: "q-09", text: "路过的狗都得说一句好配。", speaker: "匿名坑底人" },
  { id: "q-10", text: "谁家 CP 这么好磕？哦，原来是我家的。", speaker: "匿名坑底人" },
  { id: "q-11", text: "般配，已经说累了。", speaker: "匿名坑底人" },
  { id: "q-12", text: "剧外也是一种浪漫。", speaker: "匿名坑底人" },
  { id: "q-13", text: "我不入蛊谁入蛊？", speaker: "匿名坑底人" },
  { id: "q-14", text: "滞后磕 CP 就是爽。", speaker: "匿名坑底人" },
  { id: "q-15", text: "早期的糖也是糖。", speaker: "匿名坑底人" },
  { id: "q-16", text: "只是同事？只是姐妹？谈了两年了？", speaker: "匿名坑底人" },
  { id: "q-17", text: "谁嗑谁上头。", speaker: "匿名坑底人" },
  { id: "q-18", text: "现实比剧本会写。", speaker: "匿名坑底人" },
];

export const tideWordsPageTarget = {
  targetType: "page",
  targetId: "tide-words",
};

export function getTideTargetKey(targetType, targetId) {
  return `${targetType}:${targetId}`;
}
