import { useEffect, useMemo, useRef, useState } from "react";
import { fetchApiVersion, fetchGameConfig, fetchHello, fetchJobs, fetchHealth } from "./api.js";
import { supabase } from "./supabase.js";

export default function App() {
  const [health, setHealth] = useState("checking");
  const [hello, setHello] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [apiVersion, setApiVersion] = useState("-");
  const [gameConfig, setGameConfig] = useState(null);
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
  const saveTimeoutRef = useRef(null);
  const isAuthDisabled = authLoading || !email || !password;
  const isCheckInDisabled = checkedIn || profileLoading;
  const healthTone = health === "error" ? "pill pill--error" : health === "checking" ? "pill pill--warn" : "pill pill--ok";

  useEffect(() => {
    fetchHealth().then((data) => setHealth(data.status)).catch(() => setHealth("error"));
    fetchHello().then((data) => setHello(data.message));
    setJobsLoading(true);
    setJobsError("");
    fetchJobs()
      .then((data) => setJobs(data))
      .catch(() => setJobsError("載入工作列表失敗，請稍後再試"))
      .finally(() => setJobsLoading(false));
    fetchApiVersion().then((data) => setApiVersion(data.version || "-")).catch(() => setApiVersion("error"));
    fetchGameConfig().then(setGameConfig).catch(() => setGameConfig(null));
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
    if (!profileKey || profileLoading || !isHydrated) return undefined;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
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
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [profileKey, stamina, gold, checkedIn, profileLoading, isHydrated]);

  useEffect(() => {
    if (session) return;
    if (!gameConfig?.initial) return;
    setStamina(gameConfig.initial.stamina ?? 20);
    setGold(gameConfig.initial.gold ?? 0);
    setCheckedIn(Boolean(gameConfig.initial.checkedIn));
  }, [gameConfig, session]);

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
    <>
      <a className="skip-link" href="#main-content">
        跳到主要內容
      </a>
      <main className="page" id="main-content">
      <header className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">放置人生</h1>
        <p className="meta">
          前端版本：{__APP_VERSION__}｜後端版本：{apiVersion}
        </p>
      </header>

      <section className="card" aria-labelledby="status-title" aria-live="polite">
        <h2 id="status-title">API 狀態</h2>
        <div className={healthTone} role="status">
          {health}
        </div>
        {hello && <p className="muted">{hello}</p>}
      </section>

      <section className="card" aria-labelledby="auth-title" aria-busy={authLoading || profileLoading}>
        <h2 id="auth-title">登入與雲端存檔</h2>
        {session ? (
          <div className="auth">
            <p className="muted">已登入：{session.user.email}</p>
            <button className="ghost" type="button" onClick={handleSignOut}>
              登出
            </button>
          </div>
        ) : (
          <div className="auth">
            <label className="field" htmlFor="email">
              <span>Email</span>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field" htmlFor="password">
              <span>Password</span>
              <input
                id="password"
                type="password"
                placeholder="請輸入密碼"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <div className="auth-actions">
              <button className="primary" type="button" onClick={handleSignIn} disabled={isAuthDisabled}>
                登入
              </button>
              <button className="ghost" type="button" onClick={handleSignUp} disabled={isAuthDisabled}>
                註冊
              </button>
            </div>
            <div className="auth-actions">
              <button
                className="ghost"
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={authLoading}
              >
                使用 Google 登入
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={authLoading}
              >
                使用 GitHub 登入
              </button>
            </div>
            {authLoading && (
              <p className="muted" aria-live="polite">
                登入中，請稍候…
              </p>
            )}
            {authError && (
              <p className="muted" role="alert" aria-live="assertive">
                {authError}
              </p>
            )}
          </div>
        )}
        <p className="muted">登入後會自動載入並同步存檔。</p>
      </section>

      <section className="card" aria-labelledby="player-title">
        <h2 id="player-title">玩家狀態</h2>
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
        <button className="primary" type="button" onClick={handleCheckIn} disabled={isCheckInDisabled}>
          {checkedIn ? "今日已打卡" : "每日打卡"}
        </button>
        {profileLoading && (
          <p className="muted" aria-live="polite">
            雲端同步中…
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="jobs-title" aria-busy={jobsLoading}>
        <h2 id="jobs-title">示範工作列表</h2>
        {jobsLoading ? (
          <p className="muted">載入工作中…</p>
        ) : jobsError ? (
          <p className="muted" role="alert">
            {jobsError}
          </p>
        ) : jobs.length === 0 ? (
          <p className="muted">尚無工作可執行</p>
        ) : (
          <ul>
            {jobs.map((job) => {
              const disabled = stamina < job.staminaCost;
              return (
                <li key={job.id}>
                  <strong>{job.title}</strong>
                  <span className="job-meta">{job.durationMinutes} 分鐘</span>
                  <span className="job-meta">{job.rewardGold} 金幣</span>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => handleWork(job)}
                    disabled={disabled}
                    aria-disabled={disabled}
                  >
                    消耗 {job.staminaCost} 體力
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="log-title">
        <h2 id="log-title">事件紀錄</h2>
        {log.length === 0 ? (
          <p className="muted">尚無紀錄</p>
        ) : (
          <ul className="log" aria-live="polite">
            {log.map((entry, index) => (
              <li key={`${entry.type}-${index}`}>{entry.message}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  </>
  );
}
