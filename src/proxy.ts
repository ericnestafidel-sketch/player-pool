import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { canEditPlayer, canReadPlayer, isPlayerId } from "@/lib/player-access";
import { clerkConfigured, clerkSaysAdmin, resolveViewer, type Viewer } from "@/lib/viewer";

const isCoachSearch = createRouteMatcher(["/coach/search(.*)"]);
const isCoachMessages = createRouteMatcher(["/coach/messages(.*)"]);
const isPlayerRead = createRouteMatcher(["/players(.*)", "/api/players(.*)"]);
const isPlayerEdit = createRouteMatcher(["/parent/player(.*)"]);
const isParent = createRouteMatcher(["/parent(.*)"]);
const isAdmin = createRouteMatcher(["/admin(.*)"]);
const isCoachArea = createRouteMatcher(["/coach/profile(.*)", "/coach/pending(.*)", "/continue(.*)"]);
const isPrivate = createRouteMatcher([
  "/parent(.*)",
  "/coach(.*)",
  "/admin(.*)",
  "/players(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/continue(.*)",
  "/access-denied(.*)",
  "/api(.*)",
]);
const isPublic = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/conduct(.*)",
  "/code-of-conduct(.*)",
]);

function stamp(response: NextResponse, request: NextRequest) {
  if (isPrivate(request)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return stamp(NextResponse.redirect(url), request);
}

function isNewPlayer(request: NextRequest): boolean {
  const path = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  return path === "/parent/player/new";
}

function playerIdFrom(request: NextRequest): string | null {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  const id = parts.at(-1) ?? "";
  return isPlayerId(id) ? id : null;
}

async function gatePlayer(
  request: NextRequest,
  viewer: Viewer,
  mode: "read" | "edit",
) {
  const id = playerIdFrom(request);
  if (!id) return redirectTo(request, "/access-denied");
  let allowed = false;
  try {
    allowed = mode === "edit" ? await canEditPlayer(viewer, id) : await canReadPlayer(viewer, id);
  } catch {
    return redirectTo(request, "/access-denied");
  }
  if (allowed) return stamp(NextResponse.next(), request);
  if (viewer.role === "coach" && viewer.coachStatus !== "approved") {
    return redirectTo(request, "/coach/pending");
  }
  return redirectTo(request, "/access-denied");
}

async function authorize(request: NextRequest, userId: string | null) {
  if (isPublic(request)) return stamp(NextResponse.next(), request);
  const needsSession =
    isCoachSearch(request) ||
    isCoachMessages(request) ||
    isPlayerRead(request) ||
    isPlayerEdit(request) ||
    isParent(request) ||
    isAdmin(request) ||
    isCoachArea(request);
  if (!userId) {
    if (needsSession) return redirectTo(request, "/sign-in");
    return stamp(NextResponse.next(), request);
  }

  let viewer: Viewer;
  try {
    viewer = await resolveViewer(userId);
  } catch {
    if (needsSession) return redirectTo(request, "/access-denied");
    return stamp(NextResponse.next(), request);
  }

  if (isAdmin(request)) {
    if (viewer.role === "admin" || (await clerkSaysAdmin(userId))) {
      return stamp(NextResponse.next(), request);
    }
    return redirectTo(request, "/");
  }

  if (isCoachSearch(request)) {
    if (viewer.role === "admin") return stamp(NextResponse.next(), request);
    if (viewer.role === "coach" && viewer.coachStatus === "approved") {
      return stamp(NextResponse.next(), request);
    }
    if (viewer.role === "coach") return redirectTo(request, "/coach/pending");
    return redirectTo(request, "/access-denied");
  }

  if (isCoachMessages(request)) {
    if (viewer.role === "coach" && viewer.coachStatus === "approved") {
      return stamp(NextResponse.next(), request);
    }
    if (viewer.role === "coach") return redirectTo(request, "/coach/pending");
    return redirectTo(request, "/access-denied");
  }

  if (isNewPlayer(request)) {
    if (viewer.role === "parent" || viewer.role === "admin" || viewer.role === null) {
      if (viewer.role === null && viewer.signupIntent === "coach") {
        return redirectTo(request, "/coach/signup");
      }
      return stamp(NextResponse.next(), request);
    }
    return redirectTo(
      request,
      viewer.coachStatus === "approved" ? "/coach/search" : "/coach/pending",
    );
  }

  if (isPlayerRead(request)) return gatePlayer(request, viewer, "read");
  if (isPlayerEdit(request)) return gatePlayer(request, viewer, "edit");

  if (isParent(request)) {
    if (viewer.role === "parent" || viewer.role === "admin" || viewer.role === null) {
      if (viewer.role === null && viewer.signupIntent === "coach") {
        return redirectTo(request, "/coach/signup");
      }
      return stamp(NextResponse.next(), request);
    }
    return redirectTo(request, viewer.coachStatus === "approved" ? "/coach/search" : "/coach/pending");
  }

  if (isCoachArea(request)) return stamp(NextResponse.next(), request);
  return stamp(NextResponse.next(), request);
}

const withClerk = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  return authorize(request, userId);
});

/**
 * Next.js 16 proxy (the file previously called middleware).
 * Player routes fail closed: an approved coach, or the parent who owns the profile.
 */
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  if (path === "/api/stripe/webhook" || path === "/api/cron/season-expire") {
    return stamp(NextResponse.next(), request);
  }
  if (path === "/code-of-conduct") {
    return redirectTo(request, "/conduct");
  }
  if (!clerkConfigured()) {
    if (isPublic(request)) return stamp(NextResponse.next(), request);
    const locked =
      isCoachSearch(request) ||
      isCoachMessages(request) ||
      isPlayerRead(request) ||
      isPlayerEdit(request) ||
      isParent(request) ||
      isAdmin(request) ||
      isCoachArea(request);
    if (locked) return redirectTo(request, "/sign-in");
    return stamp(NextResponse.next(), request);
  }
  const response = await withClerk(request, event);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
