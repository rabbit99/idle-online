import { useEffect, useMemo, useState } from "react";
import { fetchHello, fetchJobs, fetchHealth } from "./api.js";
import { supabase } from "./supabase.js";

export default function App() {
  const [health, setHealth] = useState("checking");
  const [hello, setHello] = useState("");
  const [jobs, setJobs] = useState([]);
  const [stamina, setStamina] = useState(20);
  const [gold, setGold] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [log, setLog] = useState([]);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    fetchHealth().then((data) => setHealth(data.status)).catch(() => setHealth("error"));
    fetchHello().then((data) => setHello(data.message));
    fetchJobs().then(setJobs);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfileLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const profileKey = useMemo(() => session?.user?.id, [session]);

  useEffect(() => {
    if (!profileKey) return;
    setIsHydrated(false);
    const loadProfile = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase.rpc("fetch_profile");

      const profile = Array.isArray(data) ? data[0] : data;
      if (error) {
        setLog((prev) => [{ type: "warn", message: `載入存檔失敗：${error.message}` }, ...prev]);
      } else if (profile) {
        setStamina(profile.stamina ?? 20);
        setGold(profile.gold ?? 0);
        setCheckedIn(Boolean(profile.checked_in));
        setLog((prev) => [{ type: "system", message: "已載入雲端存檔" }, ...prev]);
      } else {
        setLog((prev) => [{ type: "warn", message: "載入存檔失敗：未取得資料" }, ...prev]);
      }
      setProfileLoading(false);
      setIsHydrated(true);
    };

    loadProfile();
  }, [profileKey]);

  useEffect(() => {
    if (!profileKey || profileLoading || !isHydrated) return;
    const saveProfile = async () => {
      const { error } = await supabase.from("profiles").upsert({
        id: profileKey,
        stamina,
        gold,
        checked_in: checkedIn,
        updated_at: new Date().toISOString()
      });
      if (error) {
        setLog((prev) => [{ type: "warn", message: `儲存失敗：${error.message}` }, ...prev]);
      }
    };

    saveProfile();
  }, [profileKey, stamina, gold, checkedIn, profileLoading, isHydrated]);

  const handleCheckIn = () => {
    if (checkedIn) return;
    const run = async () => {
      const { data, error } = await supabase.rpc("check_in");
      const profile = Array.isArray(data) ? data[0] : data;
      if (error) {
        setLog((prev) => [{ type: "warn", message: `打卡失敗：${error.message}` }, ...prev]);
        return;
      }
      if (profile) {
        setStamina(profile.stamina ?? 20);
        setGold(profile.gold ?? 0);
        setCheckedIn(Boolean(profile.checked_in));
      }
      setLog((prev) => [{ type: "checkin", message: "完成每日打卡，體力 +20" }, ...prev]);
    };

    run();
  };

  const handleWork = (job) => {
    if (stamina < job.staminaCost) {
      setLog((prev) => [{ type: "warn", message: "體力不足，無法開始工作" }, ...prev]);
      return;
    }
    setStamina((prev) => prev - job.staminaCost);
    setGold((prev) => prev + job.rewardGold);
    setLog((prev) => [{ type: "work", message: `完成 ${job.title}，獲得 ${job.rewardGold} 金幣` }, ...prev]);
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleOAuth = async (provider) => {
    setAuthLoading(true);
    setAuthError("");
    const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <main className="page">
      <header className="hero">
        <h1>放置人生</h1>
        <p>前端：React + Vite｜後端：Express</p>
      </header>

      <section className="card">
        <h2>API 狀態</h2>
        <div className="pill">{health}</div>
        {hello && <p className="muted">{hello}</p>}
      </section>

      <section className="card">
        <h2>登入與雲端存檔</h2>
        {session ? (
          <div className="auth">
            <p className="muted">已登入：{session.user.email}</p>
            <button className="ghost" onClick={handleSignOut}>
              登出
            </button>
          </div>
        ) : (
          <div className="auth">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="auth-actions">
              <button className="primary" onClick={handleSignIn} disabled={authLoading}>
                登入
              </button>
              <button className="ghost" onClick={handleSignUp} disabled={authLoading}>
                註冊
              </button>
            </div>
            <div className="auth-actions">
              <button className="ghost" onClick={() => handleOAuth("google")} disabled={authLoading}>
                使用 Google 登入
              </button>
              <button className="ghost" onClick={() => handleOAuth("github")} disabled={authLoading}>
                使用 GitHub 登入
              </button>
            </div>
            {authError && <p className="muted">{authError}</p>}
          </div>
        )}
        <p className="muted">登入後會自動載入並同步存檔。</p>
      </section>

      <section className="card">
        <h2>玩家狀態</h2>
        <div className="stats">
          <div>
            <span className="label">體力</span>
            <strong>{stamina}</strong>
          </div>
          <div>
            <span className="label">金幣</span>
            <strong>{gold}</strong>
          </div>
        </div>
        <button className="primary" onClick={handleCheckIn} disabled={checkedIn}>
          {checkedIn ? "今日已打卡" : "每日打卡"}
        </button>
      </section>

      <section className="card">
        <h2>示範工作列表</h2>
        <ul>
          {jobs.map((job) => (
            <li key={job.id}>
              <strong>{job.title}</strong>
              <span>{job.durationMinutes} 分鐘</span>
              <span>{job.rewardGold} 金幣</span>
              <button className="ghost" onClick={() => handleWork(job)}>
                消耗 {job.staminaCost} 體力
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>事件紀錄</h2>
        {log.length === 0 ? (
          <p className="muted">尚無紀錄</p>
        ) : (
          <ul className="log">
            {log.map((entry, index) => (
              <li key={`${entry.type}-${index}`}>{entry.message}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
