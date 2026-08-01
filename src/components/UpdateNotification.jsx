import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Download, X, ArrowUpCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('1.01');
  const [apkUrl, setApkUrl] = useState('https://github.com/nimesh-kavindya/mediremind/releases/latest');
  const [dismissed, setDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // CURRENT_APP_VERSION stored in state / localStorage
  const CURRENT_VERSION = '1.01';

  useEffect(() => {
    // Check saved APK link from settings
    const savedApk = localStorage.getItem('custom_apk_download_url');
    if (savedApk) {
      setApkUrl(savedApk);
    }

    // Function to check version on server or GitHub
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data.apkDownloadUrl && !savedApk) {
            setApkUrl(data.apkDownloadUrl);
          }
          if (data.version && data.version !== CURRENT_VERSION) {
            setLatestVersion(data.version);
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        // Fallback check version.json
        try {
          const jsonRes = await fetch('/version.json?t=' + Date.now());
          if (jsonRes.ok) {
            const json = await jsonRes.json();
            if (json.version && json.version !== CURRENT_VERSION) {
              setLatestVersion(json.version);
              setUpdateAvailable(true);
            }
          }
        } catch (_) {}
      }
    };

    // Check on mount
    checkVersion();

    // Check periodically every 30 seconds for auto-pushed code changes
    const interval = setInterval(checkVersion, 30000);

    // Listen to custom update triggers or PWA SW register updates
    const handleCustomUpdateTrigger = (e) => {
      if (e.detail?.version) setLatestVersion(e.detail.version);
      if (e.detail?.apkUrl) setApkUrl(e.detail.apkUrl);
      setUpdateAvailable(true);
      setDismissed(false);
    };

    window.addEventListener('mediremind-update-available', handleCustomUpdateTrigger);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mediremind-update-available', handleCustomUpdateTrigger);
    };
  }, []);

  const handleAutoRefresh = () => {
    setIsRefreshing(true);
    toast.loading('Refreshing & applying update...', { duration: 1500 });
    setTimeout(() => {
      // Clear cache and hard reload
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.update();
          }
        });
      }
      window.location.reload(true);
    }, 1000);
  };

  const handleDownloadAPK = () => {
    const finalUrl = localStorage.getItem('custom_apk_download_url') || apkUrl;
    toast.success('Redirecting to APK Download...');
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 animate-bounce-short">
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border-2 border-teal-500/80 text-white shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/30 rounded-full blur-2xl pointer-events-none"></div>

        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 flex items-center justify-center shrink-0 shadow-lg">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center text-teal-400">
              <ArrowUpCircle size={22} className="animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm sm:text-base text-white">App Update Available!</h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                v{latestVersion}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              New features & performance enhancements ready. Choose how you want to update:
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleAutoRefresh}
            disabled={isRefreshing}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-teal-500/20"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? 'Refreshing...' : 'Auto Refresh Site'}</span>
          </button>

          <button
            onClick={handleDownloadAPK}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Download size={14} />
            <span>Download APK</span>
          </button>
        </div>
      </div>
    </div>
  );
}
