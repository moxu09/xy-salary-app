"use client";

import { supabase } from "@/lib/supabase";
import { Gamepad2, Sparkles, UserRound } from "lucide-react";

export default function XYLoginPage() {
  async function loginWithDiscord() {
    const redirectTo = `${window.location.origin}/auth/callback?next=/xy/staff`;

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
    <main className="flex min-h-screen items-center justify-center bg-[#fff7ed] px-4 text-slate-900">
      <div className="w-full max-w-md rounded-[32px] border border-orange-100 bg-white p-8 text-center shadow-sm shadow-orange-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-orange-600">
          <Gamepad2 size={32} />
        </div>

        <p className="mt-6 text-sm font-black text-orange-600">
          XY陪玩｜Salary System
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          員工登入
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          使用 Discord 登入後，系統會自動確認你的 XY 員工身分組。
          通過後會自動建立員工資料，並進入薪資中心。
        </p>

        <button
          onClick={loginWithDiscord}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600"
        >
          <UserRound size={18} />
          使用 Discord 登入
        </button>

        <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-left">
          <p className="flex items-center gap-2 text-xs font-black text-orange-700">
            <Sparkles size={15} />
            登入提醒
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            若顯示沒有員工身分組，請確認你在 XY Discord 群內，且擁有系統設定的員工身分組。
          </p>
        </div>
      </div>
    </main>
  );
}