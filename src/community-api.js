import { ensureCommunitySession, isCommunityConfigured, supabase } from "./lib/supabase.js";
import { getTideTargetKey } from "./data/tide-words.js";

export { isCommunityConfigured };

function normalizeRpcRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

function throwIfError(error) {
  if (error) throw error;
}

export async function loadCommunityStats() {
  if (!supabase) return {};
  const { data, error } = await supabase.rpc("get_community_stats");
  throwIfError(error);

  return Object.fromEntries((data ?? []).map((row) => [
    getTideTargetKey(row.target_type, row.target_id),
    {
      comments: Number(row.comment_count ?? 0),
      likes: Number(row.reaction_count ?? 0),
      uniqueVisitors: Number(row.unique_visitor_count ?? 0),
      views: Number(row.view_count ?? 0),
    },
  ]));
}

export async function loadPublishedCommunityQuotes() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("community_quotes")
    .select("id,text,speaker,cover_path,sort_order,is_pinned,created_at")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  throwIfError(error);
  return data ?? [];
}

export async function recordCommunityView(targetType, targetId) {
  await ensureCommunitySession();
  const { data, error } = await supabase.rpc("record_community_view", {
    p_target_id: targetId,
    p_target_type: targetType,
  });
  throwIfError(error);
  return normalizeRpcRow(data);
}

export async function toggleCommunityReaction(targetType, targetId) {
  await ensureCommunitySession();
  const { data, error } = await supabase.rpc("toggle_community_reaction", {
    p_target_id: targetId,
    p_target_type: targetType,
  });
  throwIfError(error);
  const row = normalizeRpcRow(data);
  return {
    liked: Boolean(row?.liked),
    likes: Number(row?.reaction_count ?? 0),
  };
}

export async function loadCommunityReactionState() {
  if (!supabase) return [];
  await ensureCommunitySession();
  const { data, error } = await supabase.rpc("get_my_community_reactions");
  throwIfError(error);
  return (data ?? []).map((row) => getTideTargetKey(row.target_type, row.target_id));
}

export async function loadPublishedComments(targetType, targetId, limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("community_comments")
    .select("id,target_type,target_id,nickname,body,created_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIfError(error);
  return data ?? [];
}

export async function submitCommunityComment({ targetType, targetId, nickname, body }) {
  await ensureCommunitySession();
  const { data, error } = await supabase.rpc("submit_community_comment", {
    p_body: body,
    p_nickname: nickname,
    p_target_id: targetId,
    p_target_type: targetType,
  });
  throwIfError(error);
  return normalizeRpcRow(data);
}

export async function submitCommunityQuote({ speaker, text }) {
  await ensureCommunitySession();
  const { data, error } = await supabase.rpc("submit_community_quote", {
    p_speaker: speaker,
    p_text: text,
  });
  throwIfError(error);
  return {
    ...normalizeRpcRow(data),
    created_at: new Date().toISOString(),
    is_pinned: false,
  };
}
