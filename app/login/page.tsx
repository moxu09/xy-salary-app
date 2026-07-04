"use client";

import { supabase } from "@/lib/supabase";
import { Sparkles, Heart, Gamepad2 } from "lucide-react";

export default function LoginPage() {
  async function loginWithDiscord() {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error(error);
      alert("Discord 登入失敗");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7ed] px-4 py-10 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-orange-100 bg-white shadow-sm shadow-orange-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-300 via-orange-400 to-amber-500 text-white shadow-md shadow-orange-200">
              <Gamepad2 size={30} />
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-orange-100 bg-white p-7 shadow-xl shadow-orange-100/70">
          <div className="flex items-center justify-center gap-2">
            <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              XY Staff
            </span>

            <span className="flex items-center gap-1 rounded-full border border-orange-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <Sparkles size={13} />
              Staff Only
            </span>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              XY陪玩薪資網
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              使用 Discord 登入後，系統會自動確認你的XY陪玩員工身分組，
              符合資格後即可查看薪資、獎金、接單狀態與可接遊戲。
            </p>
          </div>

          <button
            onClick={loginWithDiscord}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:from-orange-500 hover:to-amber-600 hover:shadow-orange-300"
          >
            <Heart size={18} fill="currentColor" />
            使用 Discord 登入
          </button>

          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/80 p-4 text-center">
            <p className="text-xs leading-6 text-slate-500">
              安心接單，清楚發薪。
              <br />
              XY陪玩專用員工薪資系統
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-semibold text-slate-400">
          © XY陪玩 We Are Still Here
        </p>
      </div>
    </main>
  );
}