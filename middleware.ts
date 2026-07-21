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
    url.pathname = "/xy/staff";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin-login") {
    url.pathname = "/xy/admin-login";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin") {
    url.pathname = "/xy/admin";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/staff") {
    url.pathname = "/xy/admin/staff";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/salary") {
    url.pathname = "/xy/admin/salary";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/payroll") {
    url.pathname = "/xy/admin/payroll";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/orders") {
    url.pathname = "/xy/admin/orders";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/salary-rank") {
    url.pathname = "/xy/admin/salary-rank";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/approvals") {
    url.pathname = "/xy/admin/approvals";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/accounting") {
    url.pathname = "/xy/admin/accounting";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/admin/settings") {
    url.pathname = "/xy/admin/settings";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
