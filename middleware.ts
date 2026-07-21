import { NextRequest, NextResponse } from "next/server";

const XY_HOST = "xy.gamming.salary.wearestilllhere.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const isXYHost = hostname === XY_HOST;

  if (!isXYHost) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 對外網址統一使用沒有 /xy 前綴的路徑，避免同一功能同時載入
  // 新、舊兩套版型。登入完成後若仍帶有舊前綴，直接導回新版頁面。
  if (pathname === "/xy/staff") {
    url.pathname = "/staff";
    return NextResponse.redirect(url);
  }

  if (pathname === "/xy/admin" || pathname.startsWith("/xy/admin/")) {
    url.pathname = pathname.slice(3) || "/admin";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/xy")) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    url.pathname = "/xy/login";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/login") {
    url.pathname = "/xy/login";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/staff") {
    return NextResponse.next();
  }

  if (pathname === "/admin-login") {
    url.pathname = "/xy/admin-login";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin") {
    return NextResponse.next();
  }

  if (pathname === "/admin/staff") {
    return NextResponse.next();
  }

  if (pathname === "/admin/salary") {
    return NextResponse.next();
  }

  if (pathname === "/admin/payroll") {
    return NextResponse.next();
  }

  if (pathname === "/admin/orders") {
    return NextResponse.next();
  }

  if (pathname === "/admin/salary-rank") {
    return NextResponse.next();
  }

  if (pathname === "/admin/approvals") {
    return NextResponse.next();
  }

  if (pathname === "/admin/accounting") {
    return NextResponse.next();
  }

  if (pathname === "/admin/settings") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
