import { API_BASE_URL } from "./config";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string | null;
};

export type UserRole = "CLIENT" | "ARTIST" | "ADMIN" | "AGENCY" | "STAFF";

export type AuthUser = {
  userId?: string;
  id?: string;
  email: string;
  role: UserRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  role: UserRole;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  hasSociete?: boolean;
  societeName?: string;
  vatNumber?: string;
  billingAddress?: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

const SITE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function normalizeAssetPath(path?: string | null): string | null | undefined {
  if (path == null) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${SITE_BASE_URL}${path}`;
  return `${SITE_BASE_URL}/${path}`;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(errorPayload.message)) {
        message = errorPayload.message.join(", ");
      } else if (typeof errorPayload.message === "string") {
        message = errorPayload.message;
      }
    } catch {
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: payload
    }
  );
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload
  });
}

export function refreshSession(refreshToken: string) {
  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken }
  });
}

export function fetchAuthMe(accessToken: string) {
  return apiRequest<AuthUser>("/auth/me", { accessToken });
}

export function logout(accessToken: string) {
  return apiRequest<{ success: boolean }>("/auth/logout", {
    method: "POST",
    accessToken
  });
}

export function fetchRelease(slug: string, accessToken?: string | null) {
  return apiRequest(`/releases/${encodeURIComponent(slug)}`, { accessToken });
}

export function fetchReleases() {
  return apiRequest<Array<Record<string, unknown>>>("/releases");
}

export function fetchTrendingReleases() {
  return apiRequest<Array<Record<string, unknown>>>("/releases/trending");
}

export function fetchArtists() {
  return apiRequest<Array<Record<string, unknown>>>("/artists");
}

export function fetchArtist(idOrSlug: string) {
  return apiRequest<Record<string, unknown>>(`/artists/${encodeURIComponent(idOrSlug)}`);
}

export function fetchComments(params: { releaseId?: string; dubpackId?: string }) {
  const query = new URLSearchParams();
  if (params.releaseId) query.set("releaseId", params.releaseId);
  if (params.dubpackId) query.set("dubpackId", params.dubpackId);
  const suffix = query.toString();
  return apiRequest<Array<Record<string, unknown>>>(`/comments${suffix ? `?${suffix}` : ""}`);
}

export function fetchNotifications(accessToken?: string | null) {
  return apiRequest<Array<Record<string, unknown>>>("/notifications", { accessToken });
}

export function createComment(
  payload: { releaseId?: string; dubpackId?: string; parentId?: string; body: string },
  accessToken: string
) {
  return apiRequest<Record<string, unknown>>("/comments", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export function toggleCommentLike(commentId: string, accessToken: string) {
  return apiRequest<{ liked: boolean }>(`/comments/${encodeURIComponent(commentId)}/like`, {
    method: "POST",
    accessToken
  });
}

export function fetchEngagementSummary(releaseId: string) {
  return apiRequest<Record<string, unknown>>(`/engagement/release/${encodeURIComponent(releaseId)}/summary`);
}

export function trackEngagementView(
  payload: { releaseId: string; scope?: "PREVIEW" | "FULL"; playlistPath?: string },
  accessToken?: string | null
) {
  return apiRequest<{ success: boolean }>("/engagement/view", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export function recordHeatmap(releaseId: string, secondMark: number, accessToken?: string | null) {
  return apiRequest<{ success?: boolean; skip?: boolean }>(`/engagement/heatmap/${encodeURIComponent(releaseId)}`, {
    method: "POST",
    body: { secondMark },
    accessToken
  });
}

export function shareRelease(releaseId: string, accessToken: string, message?: string) {
  return apiRequest<Record<string, unknown>>("/engagement/share", {
    method: "POST",
    body: { releaseId, message },
    accessToken
  });
}

export function markNotificationRead(id: string, accessToken: string) {
  return apiRequest<{ success: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    accessToken
  });
}

export function markAllNotificationsRead(accessToken: string) {
  return apiRequest<{ success: boolean }>("/notifications/read-all/all", {
    method: "PATCH",
    accessToken
  });
}

export function fetchUserProfile(accessToken: string) {
  return apiRequest<Record<string, unknown>>("/users/me", { accessToken });
}

export function updateUserProfile(payload: Record<string, unknown>, accessToken: string) {
  return apiRequest<Record<string, unknown>>("/users/me", {
    method: "PATCH",
    body: payload,
    accessToken
  });
}

export function changeUserPassword(newPassword: string, accessToken: string) {
  return apiRequest<{ success: boolean }>("/users/me/password", {
    method: "PATCH",
    body: { newPassword },
    accessToken
  });
}

export function forgotPassword(email: string) {
  return apiRequest<{ success: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: { email }
  });
}

export function fetchMyOrders(accessToken: string) {
  return apiRequest<Array<Record<string, unknown>>>("/orders/me", { accessToken });
}

export function fetchMyFollows(accessToken: string) {
  return apiRequest<Array<Record<string, unknown>>>("/follows/me", { accessToken });
}

export function followArtist(artistId: string, accessToken: string) {
  return apiRequest<{ following: boolean }>(`/follows/artist/${encodeURIComponent(artistId)}`, {
    method: "POST",
    accessToken
  });
}

export function unfollowArtist(artistId: string, accessToken: string) {
  return apiRequest<{ following: boolean }>(`/follows/artist/${encodeURIComponent(artistId)}`, {
    method: "DELETE",
    accessToken
  });
}

export function fetchMyReleases(accessToken: string) {
  return apiRequest<Array<Record<string, unknown>>>("/releases/mine", { accessToken });
}

export function fetchMyArtistProfile(accessToken: string) {
  return apiRequest<Record<string, unknown>>("/artists/me", { accessToken });
}

export function fetchMyArtistStats(accessToken: string) {
  return apiRequest<Record<string, unknown>>("/artists/me/stats", { accessToken });
}

export function fetchMyFavorites(accessToken: string) {
  return apiRequest<Record<string, unknown>>("/premium/favorites/me", { accessToken });
}

export function fetchFavoriteStatus(releaseId: string, accessToken: string) {
  return apiRequest<{ saved: boolean; playlistId?: string }>(`/premium/favorites/${encodeURIComponent(releaseId)}/status`, {
    accessToken
  });
}

export function saveFavorite(releaseId: string, accessToken: string) {
  return apiRequest<{ saved: boolean; playlistId?: string }>(`/premium/favorites/${encodeURIComponent(releaseId)}`, {
    method: "POST",
    accessToken
  });
}

export function removeFavorite(releaseId: string, accessToken: string) {
  return apiRequest<{ saved: boolean; playlistId?: string }>(`/premium/favorites/${encodeURIComponent(releaseId)}/remove`, {
    method: "POST",
    accessToken
  });
}

export { normalizeAssetPath, SITE_BASE_URL };
