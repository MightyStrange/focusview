const sleepData = {
  microsleepCount  : 0,
  totalHours       : 0,
  sessionStartTime : null,
  sleepLog         : [],
  weeklyData : {
    microsleepCount      : 0,
    totalHours           : 0,
    totalMonitoredHours  : 0,
    log                  : [],
    lastReset            : new Date().toISOString(),
    sessionStartTime     : null  // Tambahan untuk tracking session
  },
  monthlyData: {
    microsleepCount      : 0,
    totalHours           : 0,
    totalMonitoredHours  : 0,
    log                  : [],
    lastReset            : new Date().toISOString(),
    sessionStartTime     : null 
  },
  dailyData : {
    microsleepCount : 0,
    date            : new Date().toDateString(),
    log             : [],
    sessionStartTime: null  
  }
};

const connectionState = {
  isConnected          : false,
  isConnecting         : false,
  device               : null,
  lastHeartbeat        : null,
  reconnectAttempts    : 0,
  maxReconnectAttempts : 5
};

const intervals = {
  dataCollection : null,
  dashboard      : null,
  countdown      : null,
  heartbeat      : null,
  monitoring     : null,
  qualityCheck   : null,
  statsUpdate    : null  // New interval for real-time stats updates
};

const eventListeners  = new Map();

/* -----------------------------  GLOBAL  -------------------------------*/
let liveSensorValue  = 0;
let lastTriggerTime  = 0;
const debounceInterval = 3000;     
const MAX_REASONABLE_RATE = 10;

function prettifyStats({ microsleepCount, monitoredHours, rate }) {

  // 1) Deteksi “belum ada data”
  const noData = microsleepCount === 0 && monitoredHours === 0;

  // 2) Teks untuk jam yang dipantau
  const hoursDisplay = noData ? '-'
    : monitoredHours === 0   ? '0.0'
    : monitoredHours < 0.1   ? '<0.1'
    : monitoredHours > 9999  ? '9999+'
    : monitoredHours.toFixed(1);

  // 3) Teks untuk rate microsleep
  const rateNum      = isFinite(rate) ? Number(rate) : 0;
  const rateDisplay  = noData ? '-'
    : monitoredHours === 0           ? '0.00'
    : monitoredHours < 0.1           ? '0.00'
    : rateNum > MAX_REASONABLE_RATE ? `>${MAX_REASONABLE_RATE}`
    : rateNum.toFixed(2);

  // 4) Teks untuk jumlah microsleep
  const microDisplay = noData ? '-' : microsleepCount.toLocaleString('en-US');

  return { microDisplay, hoursDisplay, rateDisplay };
}

function renderStatsSection(parentId, title, statsObj) {
  const { microDisplay, hoursDisplay, rateDisplay } = prettifyStats(statsObj);

  const html = `
    <h3 class="stats-title">${title}</h3>
    <ul class="stats-list">
      <li>${microDisplay} Total Microsleep Episodes</li>
      <li>${hoursDisplay} Hours Monitored</li>
      <li>${rateDisplay}/hr ${title.includes('Weekly') ? 'Weekly' : 'Monthly'} Microsleep Rate</li>
    </ul>`;

  const el = document.getElementById(parentId);
  if (el) el.innerHTML = html;
}

/* =======================================================================
 *  INITIALISATION
 * =======================================================================*/
function initializeRealTimeSystem() {
  console.log('🚀 Initializing FocusView system…');

  // Load saved data from localStorage if available
  loadSavedData();

  // dashboard refresh - more frequent updates for real-time feel
  intervals.dashboard = setInterval(() => {
    updateDashboard();
    updateConnectionStatus();
  }, 2000);

  // Real-time stats update interval
  intervals.statsUpdate = setInterval(() => {
    updateRealTimeStats();
  }, 10000);

  intervals.countdown = setInterval(updateDailyCountdown, 60000);

  intervals.qualityCheck = setInterval(() => {
    const q = calculateSleepQuality();
    if (q.quality === 'Very Poor' && q.metrics.weeklyMicrosleeps > 10) {
      showRealTimeAlert('Sleep quality is critically low!', 'error');
    }
  }, 30000);

  setupResponsiveLayout();
  
  // Make sure this is called
  setupRealTimeEventListeners();

  updateDashboard();
  startRealTimeDataCollection();

  console.log('✅ System ready');
}


// New function to update real-time stats
function updateRealTimeStats() {
  if (connectionState.isConnected && sleepData.weeklyData.sessionStartTime) {
    // Update current session duration for both weekly and monthly data
    const now = new Date();
    
    // Update weekly monitoring entry
    const lastWeeklyEntry = sleepData.weeklyData.log
      .filter(l => l.type === 'monitoring')
      .slice(-1)[0];
    
    if (lastWeeklyEntry && lastWeeklyEntry.startTime) {
      const sessionStart = new Date(lastWeeklyEntry.startTime);
      const currentHours = (now - sessionStart) / (1000 * 60 * 60);
      lastWeeklyEntry.duration = Math.max(0, currentHours);
    }
    
    // Update monthly monitoring entry
    const lastMonthlyEntry = sleepData.monthlyData.log
      .filter(l => l.type === 'monitoring')
      .slice(-1)[0];
    
    if (lastMonthlyEntry && lastMonthlyEntry.startTime) {
      const sessionStart = new Date(lastMonthlyEntry.startTime);
      const currentHours = (now - sessionStart) / (1000 * 60 * 60);
      lastMonthlyEntry.duration = Math.max(0, currentHours);
    }
  }
}

// Load saved data from localStorage
function loadSavedData() {
  try {
    const savedData = localStorage.getItem('focusViewData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (parsedData.weeklyData) sleepData.weeklyData = parsedData.weeklyData;
      if (parsedData.monthlyData) sleepData.monthlyData = parsedData.monthlyData;
      if (parsedData.dailyData) {
        // Only restore daily data if it's from today
        const savedDate = parsedData.dailyData.date;
        const today = new Date().toDateString();
        if (savedDate === today) {
          sleepData.dailyData = parsedData.dailyData;
        }
      }
      console.log('Loaded saved data from localStorage');
    }
  } catch (e) {
    console.error('Error loading saved data:', e);
  }
}

// Save data to localStorage
function saveDataToLocalStorage() {
  try {
    localStorage.setItem('focusViewData', JSON.stringify({
      weeklyData: sleepData.weeklyData,
      monthlyData: sleepData.monthlyData,
      dailyData: sleepData.dailyData,
      savedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
  }
}
function realTimeLoop() {
  updateRealTimeStats();
  updateDashboard();
  updateConnectionStatus();
  requestAnimationFrame(realTimeLoop);
}

/* =======================================================================
 *  RESPONSIVE LAYOUT & LISTENER
 * =======================================================================*/
function setupResponsiveLayout () {
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');

  let isMobile = window.innerWidth <= 768;

  function updateLayout () {
    isMobile = window.innerWidth <= 768;
    
    if (sidebar) {
      sidebar.classList.remove('open', 'collapsed', 'mobile-open');
      if (!isMobile) {
        sidebar.classList.remove('mobile-open');
      }
    }
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  window.addEventListener('resize', () => {
    updateLayout(); 
    updateDashboard();
  });
  
  updateLayout();

  // Mobile sidebar toggle
  function toggleSidebar(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Toggle clicked, isMobile:', isMobile);
    
    if (isMobile) {
      const isOpen = sidebar.classList.contains('mobile-open');
      console.log('Sidebar currently open:', isOpen);
      
      if (isOpen) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }

  if (toggleBtn) {
    // Simple click event - no need to hold down
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar(e);
    });
    
    // Touch event for mobile - single tap only
    let touchStartTime = 0;
    toggleBtn.addEventListener('touchstart', function(e) {
      touchStartTime = Date.now();
    });
    
    toggleBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Only trigger if it's a quick tap (not a long press)
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 500) {
        toggleSidebar(e);
      }
    });
  }

  overlay?.addEventListener('click', () => {
    if (isMobile) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', e=>{
    if (e.key==='Escape' && isMobile && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

function setupRealTimeEventListeners() {
  // Existing event listeners
  document.getElementById('connect')?.addEventListener('click', handleConnectionToggle);
  document.getElementById('resetData')?.addEventListener('click', handleDataReset);
  document.getElementById('exportData')?.addEventListener('click', handleDataExport);
  document.getElementById('manualMicrosleep')?.addEventListener('click', () => {
    addSleepLogEntry('microsleep', true);
    showRealTimeAlert('Manual microsleep recorded', 'warning');
  });
  document.getElementById('saveActivity')?.addEventListener('click', saveActivity);
  
  // Add this line with proper error handling
  const resetAllBtn = document.getElementById('resetAllData');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', handleAllDataReset);
    console.log('Reset All Data button listener attached');
  } else {
    console.warn('Reset All Data button not found in the DOM');
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', () => showRealTimeAlert('Connection restored', 'success'));
  window.addEventListener('offline', () => showRealTimeAlert('Connection lost – offline', 'warning'));
  
  // Add beforeunload event to save data before page is closed
  window.addEventListener('beforeunload', saveDataToLocalStorage);
}

/* =======================================================================
 *  HELPERS – DAILY / WEEK / MONTH 
 * =======================================================================*/
function getTodayMicrosleepCount () {
  const start = new Date(); start.setHours(0,0,0,0);
  return sleepData.dailyData.log
          .filter(l=> l.type==='microsleep' && new Date(l.timestamp)>=start)
          .length;
}

function getWeeklyStats () {
  const now = new Date();
  const startOfWeek = new Date(now); 
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const logs = sleepData.weeklyData.log
               .filter(l => new Date(l.timestamp) >= startOfWeek);

  const microsleepCount = logs.filter(l => l.type === 'microsleep').length;
  
  let totalMonitoredHours = 0;
  
  // Include current active session in real-time
  if (sleepData.weeklyData.sessionStartTime) {
    const sessionStart = new Date(sleepData.weeklyData.sessionStartTime);
    const currentHours = (now - sessionStart) / (1000 * 60 * 60);
    totalMonitoredHours += Math.max(0, currentHours);
  }
  
  // Add completed monitoring sessions
  const monitoringLogs = logs.filter(l => l.type === 'monitoring' && l.duration);
  totalMonitoredHours += monitoringLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
  
  // Ensure we have some hours if there are microsleeps
  if (totalMonitoredHours === 0 && microsleepCount > 0) {
    totalMonitoredHours = 0.5; 
  }

  const rate = (totalMonitoredHours > 0.1) ? microsleepCount / totalMonitoredHours : 0;

  return {
    microsleepCount,
    monitoredHours: totalMonitoredHours,
    rate: rate
  };
}


function getMonthlyStats () {
  const now          = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  /* -------------- filter log bulan ini ------------- */
  const logs = sleepData.monthlyData.log.filter(l => {
    const t = new Date(l.timestamp);
    return t >= startOfMonth && t < nextMonth;
  });

  /* -------------- hitung microsleep ---------------- */
  const microsleepCount = logs.filter(l => l.type === 'microsleep').length;

  /* -------------- jam monitoring ------------------- */
  let totalMonitoredHours = 0;

  // 1) monitoring yang SUDAH selesai
  const monitoringLogs = logs.filter(l => l.type === 'monitoring' && l.duration);
  totalMonitoredHours += monitoringLogs.reduce((s,l)=> s + (l.duration||0), 0);

  // 2) sesi YANG MASIH AKTIF
  if (sleepData.monthlyData.sessionStartTime) {
    const currentHours = (now - new Date(sleepData.monthlyData.sessionStartTime)) / 36e5;
    totalMonitoredHours += Math.max(0, currentHours);
  }

  // fallback agar tidak ÷0
  if (totalMonitoredHours === 0 && microsleepCount > 0) totalMonitoredHours = 0.5;

  const rate = totalMonitoredHours > 0.1 ? microsleepCount / totalMonitoredHours : 0;

  /* -------------- distribusi harian ---------------- */
  const microsleepsPerDay = Array(daysInMonth).fill(0);       // index 0 → tgl 1
  const daysWithActivity  = new Set();                         // hari yang MINIMAL ada log

  logs.forEach(l => {
    const idx = new Date(l.timestamp).getDate() - 1;
    if (idx < 0 || idx >= daysInMonth) return;

    if (l.type === 'microsleep')  microsleepsPerDay[idx]++;
    if (l.type !== 'aktivitas')   daysWithActivity.add(idx);   // ‘monitoring’ / ‘microsleep’
  });

  const daysMonitored = daysWithActivity.size || 1;            // hindari /0
  const avgPerDay     = microsleepCount / daysMonitored;

  /* -------------- zero-days & streak ---------------- */
  // Hitung hari tanpa microsleep dari hari-hari yang ada aktivitas
  const zeroDays = [...daysWithActivity].filter(i => microsleepsPerDay[i] === 0).length;

  // Hitung streak terpanjang hari tanpa microsleep
  let longestStreak = 0, cur = 0;
  for (let d = 0; d < daysInMonth; d++) {
    if (daysWithActivity.has(d) && microsleepsPerDay[d] === 0) {
      cur++; 
      longestStreak = Math.max(longestStreak, cur);
    } else {
      cur = 0;
    }
  }
  
  // Jika belum ada aktivitas sama sekali, tampilkan info yang lebih informatif
  const finalZeroDays = daysWithActivity.size === 0 ? 0 : zeroDays;
  const finalLongestStreak = daysWithActivity.size === 0 ? 0 : longestStreak;

  return {
    microsleepCount,
    monitoredHours : totalMonitoredHours,
    rate,
    avgPerDay,
    zeroDays: finalZeroDays,
    longestStreak: finalLongestStreak,
    dailyDistribution : microsleepsPerDay
  };
}

function calculateSleepQuality () {
  const daily     = getTodayMicrosleepCount();
  const weekly    = getWeeklyStats();
  const monthly   = getMonthlyStats();

  const levels = [
    { max:2 , quality:'Excellent', desc:'Tidur Anda sangat optimal. Tubuh dan otak mendapatkan waktu pemulihan yang maksimal, yang memungkinkan Anda tetap fokus, produktif, dan bugar sepanjang hari.',
      tips:['Pertahankan 7-8 jam tidur','Lanjutkan kebiasaan sehat: olahraga rutin, hindari kafein larut malam'] },
    { max:5 , quality:'Good',      desc:'Kualitas tidur Anda cukup baik. Ada sedikit gangguan seperti kelelahan ringan di siang hari, namun tidak terlalu berdampak besar terhadap aktivitas harian.',
      tips:['Tidur pada jam yang konsisten','Pastikan kamar gelap & sejuk'] },
    { max:10, quality:'Fair',      desc:'Kualitas tidur Anda mulai menurun. Mungkin muncul rasa kantuk ringan di siang hari, konsentrasi berkurang, atau suasana hati yang kurang stabil.',
      tips:['Tambah durasi tidur 30-60 m','Batasi layar 1 jam sebelum tidur'] },
    { max:15, quality:'Poor',      desc:'Tidur Anda tidak cukup berkualitas. Terjadi gangguan signifikan seperti sering mengantuk di siang hari, sulit fokus, bahkan potensi microsleep saat beraktivitas.',
      tips:['Kurangi kafein','Pertimbangkan teknik relaksasi sebelum tidur (meditasi, pernapasan dalam)'] }
  ];

  let sel = levels.find(l=> daily<=l.max);
  if (!sel) sel = { quality:'Very Poor', desc:'Kualitas tidur Anda sangat memprihatinkan. Risiko kesehatan seperti kelelahan kronis, stres, bahkan kecelakaan akibat microsleep meningkat tajam.',
                    tips:['Segera ambil waktu istirahat yang cukup','Pertimbangkan konsultasi dokter'] };

  return {
    quality : sel.quality,
    description:sel.desc,
    recommendations:[
      ...sel.tips,
      `Hari ini: ${daily} microsleep`,
      `Minggu ini: ${weekly.microsleepCount}`,
      `Bulan ini: ${monthly.microsleepCount}`
    ],
    className: sel.quality.toLowerCase().replace(' ','-'),
    metrics:{
      dailyMicrosleepCount:daily,
      weeklyMicrosleeps:weekly.microsleepCount,
      monthlyMicrosleeps:monthly.microsleepCount
    }
  };
}

// Tampilkan "-" jika value kosong / nol
function dash(value, digits = 0) {
  if (value === 0 || value === null || value === undefined || !isFinite(value)) {
    return '-';
  }
  return (typeof value === 'number')
         ? value.toFixed(digits)
         : value.toString();
}

/* =======================================================================
 *  DASHBOARD (IMPROVED FOR REAL-TIME)
 * =======================================================================*/
function updateDashboard () {
  checkDailyReset();
  
  // Update real-time stats before displaying
  updateRealTimeStats();

  // Update last update time
  const lastUpdateEl = document.getElementById('lastUpdate');
  if (lastUpdateEl) {
    lastUpdateEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }

  // Update daily microsleep count
  updateElementWithAnimation('dailyMicrosleepCount', getTodayMicrosleepCount());

  // Get weekly and monthly stats
  const w = getWeeklyStats();
  const m = getMonthlyStats();
  
 updateElementWithAnimation('weeklyCount',          dash(w.microsleepCount));
updateElementWithAnimation('sleepHours',           dash(w.monitoredHours, 1));
updateElementWithAnimation('microsleepRate',       w.monitoredHours === 0 ? '-' : `${dash(w.rate, 2)}/hr`);

updateElementWithAnimation('monthlyCount',         dash(m.microsleepCount));
updateElementWithAnimation('monthlyHours',         dash(m.monitoredHours, 1));
updateElementWithAnimation('monthlyMicrosleepRate',m.monitoredHours === 0 ? '-' : `${dash(m.rate, 2)}/hr`);

updateElementWithAnimation('monthlyAvgPerDay',     dash(m.avgPerDay, 2));
updateElementWithAnimation('monthlyZeroDays',      m.zeroDays.toString());
updateElementWithAnimation('monthlyLongestStreak', `${m.longestStreak} hari`);

  // Update quality indicators
  const q = calculateSleepQuality();
  const qInd = document.getElementById('qualityIndicator');
  const qDesc= document.getElementById('qualityDescription');
  const qList= document.getElementById('sleepRecommendations');
  if (qInd && qDesc && qList) {
    qInd.className = `quality-indicator ${q.className}`;
    qInd.textContent = `Quality: ${q.quality}`;
    qDesc.textContent = q.description;
    qList.innerHTML = q.recommendations.map(r=>`<li>${r}</li>`).join('');
  }

  // Update sleep log
  updateSleepLog();
  
  // Save data after updates
  saveDataToLocalStorage();
  
  // Update chart if available
  if (document.getElementById('microsleepChart')) {
    renderMicrosleepChart();
  }
}

function updateElementWithAnimation (id, val) {
  const el = document.getElementById(id);
  if (el && el.textContent !== val.toString()) {
    el.style.transition = 'all .3s'; 
    el.style.transform = 'scale(1.15)';
    el.textContent = val; 
    setTimeout(() => el.style.transform = 'scale(1)', 300);
  }
}


/* =======================================================================
 *  LOG HANDLING (IMPROVED FOR REAL-TIME)
 * =======================================================================*/
function addSleepLogEntry (type, manual=false) {
  // Gunakan timestamp yang konsisten dengan saveSleepDataToMySQL()
  const timestamp = new Date().toISOString();
  const timestampMs = Date.now(); // Add milliseconds timestamp for server sync
  const entry = { timestamp, timestampMs, type, manual };
  
  // Add to daily log
  sleepData.dailyData.log.push(entry);

  if (type === 'microsleep') {
    // Update counters
    sleepData.dailyData.microsleepCount++;
    sleepData.weeklyData.microsleepCount++;
    sleepData.monthlyData.microsleepCount++;
    
    // Add to weekly and monthly logs
    sleepData.weeklyData.log.push(entry);
    sleepData.monthlyData.log.push(entry);

    // Check for multiple microsleeps in short time
    const recent = sleepData.dailyData.log
                    .filter(l => l.type === 'microsleep')
                    .slice(-3);
    if (recent.length === 3) {
      const span = new Date(recent[2].timestamp) - new Date(recent[0].timestamp);
      if (span < 600000) { // 10 minutes
        showRealTimeAlert('⚠️ CRITICAL: Multiple microsleeps in short time!', 'error', 10000);
      }
    }
    
    // Save to server
    saveSleepDataToMySQL();
  } else {
    // For normal readings, also add to weekly and monthly logs
    // This helps track days with activity for statistics
    sleepData.weeklyData.log.push(entry);
    sleepData.monthlyData.log.push(entry);
  }

  // Update dashboard immediately for real-time feedback
  updateDashboard();
  
  // Emit event for any listeners
  emitRealTimeEvent('sleepLogUpdate', { entry });
}

function updateSleepLog () {
  const cont = document.getElementById('sleepLog'); 
  if (!cont) return;

  // Combine and sort logs for display
  const logs = [...sleepData.weeklyData.log, ...sleepData.dailyData.log]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              
  // Remove duplicates (entries might be in both weekly and daily logs)
  const uniqueLogs = [];
  const seen = new Set();
  
  for (const log of logs) {
    const key = `${log.timestamp}-${log.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLogs.push(log);
    }
  }
  
  if (!uniqueLogs.length) {
    cont.innerHTML = '<div style="text-align:center;color:#666;font-style:italic;">No activity yet</div>';
    return;
  }
  
  cont.innerHTML = uniqueLogs.slice(0, 15).map((e, i) => {
    const d = new Date(e.timestamp);
    return `<div class="sleep-log-item ${e.type === 'microsleep' ? 'microsleep' : ''}" style="animation-delay:${i*50}ms">
              <span>${e.type === 'microsleep' ? '⚠️ Microsleep' : '✅ Normal'}</span>
              <span>${d.toLocaleString()}</span>
            </div>`;
  }).join('');
}

/* =======================================================================
 *  DAILY RESET & COUNTDOWN
 * =======================================================================*/
function checkDailyReset () {
  const today = new Date().toDateString();
  if (sleepData.dailyData.date !== today) {
    // Save yesterday's data before reset
    const yesterday = {...sleepData.dailyData};
    
    // Reset daily data
    sleepData.dailyData = {
      microsleepCount: 0,
      date: today,
      log: [], 
      sessionStartTime: sleepData.dailyData.sessionStartTime // Maintain active session
    };
    
    showRealTimeAlert(`New day started! Yesterday: ${yesterday.microsleepCount} microsleeps`, 'info');
    
    // Save the reset
    saveDataToLocalStorage();
    saveSleepDataToMySQL();
  }
}

function updateDailyCountdown () {
  const now = new Date(); 
  const mid = new Date(); 
  mid.setHours(24, 0, 0, 0);
  
  const diff = mid - now;
  const h = Math.floor(diff / 36e5);
  const m = Math.floor(diff % 36e5 / 6e4);
  const s = Math.floor(diff % 6e4 / 1e3);
  
  const el = document.getElementById('dailyTimeRemaining');
  if (el) {
    el.textContent = `Resets in ${h}h ${m}m ${s}s`;
    el.style.color = (h === 0 && m < 60) ? '#f59e0b' : '';
  }
}

/* =======================================================================
 *  MONITORING SESSION (IMPROVED FOR REAL-TIME)
 * =======================================================================*/
function startMonitoringSession () {
  const start = new Date();
  const startIso = start.toISOString();
  
  // Set session start time for tracking
  sleepData.weeklyData.sessionStartTime = startIso;
  sleepData.monthlyData.sessionStartTime = startIso;
  sleepData.dailyData.sessionStartTime = startIso;
  
  // Create monitoring entries with real-time duration tracking
  const wEntry = {
    type: 'monitoring', 
    timestamp: startIso, 
    startTime: startIso, 
    duration: 0,
    isActive: true
  };
  
  const mEntry = {...wEntry};

  sleepData.weeklyData.log.push(wEntry);
  sleepData.monthlyData.log.push(mEntry);

  // Update duration every minute
  intervals.monitoring = setInterval(() => {
    const d = (Date.now() - start) / (1000 * 60 * 60); // hours
    wEntry.duration = d; 
    mEntry.duration = d;
    
    // Update dashboard to reflect real-time changes
    updateDashboard();
  }, 60000);

  // Heartbeat for connection status
  intervals.heartbeat = setInterval(() => {
    connectionState.lastHeartbeat = new Date();
    updateConnectionStatus();
  }, 10000);

  // Start data collection if not already running
  if (!intervals.dataCollection) {
    startRealTimeDataCollection();
  }
  
  showRealTimeAlert('Monitoring session started', 'success');
  saveDataToLocalStorage();
}

function endMonitoringSession () {
  // Finalize session duration
  if (sleepData.weeklyData.sessionStartTime) {
    const sessionEnd = new Date();
    const sessionStart = new Date(sleepData.weeklyData.sessionStartTime);
    const sessionDuration = (sessionEnd - sessionStart) / (1000 * 60 * 60);
    
    // Update weekly entry with final duration
    const lastWeeklyEntry = sleepData.weeklyData.log
      .filter(l => l.type === 'monitoring' && l.isActive)
      .slice(-1)[0];
      
    if (lastWeeklyEntry) {
      lastWeeklyEntry.duration = sessionDuration;
      lastWeeklyEntry.isActive = false;
      lastWeeklyEntry.endTime = sessionEnd.toISOString();
    }
    
    // Update monthly entry with final duration
    const lastMonthlyEntry = sleepData.monthlyData.log
      .filter(l => l.type === 'monitoring' && l.isActive)
      .slice(-1)[0];
      
    if (lastMonthlyEntry) {
      lastMonthlyEntry.duration = sessionDuration;
      lastMonthlyEntry.isActive = false;
      lastMonthlyEntry.endTime = sessionEnd.toISOString();
    }
  }
  
  // Reset session start times
  sleepData.weeklyData.sessionStartTime = null;
  sleepData.monthlyData.sessionStartTime = null;
  sleepData.dailyData.sessionStartTime = null;
  
  // Clear intervals
  clearInterval(intervals.monitoring);
  clearInterval(intervals.dataCollection);
  clearInterval(intervals.heartbeat);
  intervals.monitoring = intervals.dataCollection = intervals.heartbeat = null;
  
  showRealTimeAlert('Monitoring session ended', 'info');
  updateDashboard();
  
  // Save final state
  saveDataToLocalStorage();
  saveSleepDataToMySQL();
}

/* =======================================================================
 *  REAL-TIME DATA COLLECTION
 * =======================================================================*/
function startRealTimeDataCollection () {
  intervals.dataCollection = setInterval(() => {
    if (!connectionState.isConnected) return;
    
    const val = liveSensorValue;
    handleRealTimeSensorData(val);

    const now = Date.now();
    if ((val === 1 || val === '1') && now - lastTriggerTime > debounceInterval) {
      lastTriggerTime = now; 
      triggerMicrosleepEvent();
    }
  }, 3000);
}

/* ---------------------  SENSOR DATA HANDLER (REAL-TIME) -------------------*/
function handleRealTimeSensorData (value) {
  const ts = new Date().toLocaleTimeString();
  
  if (value === 1 || value === '1' || value === 'microsleep') { 
    triggerMicrosleepEvent(); 
  } else {
    const outputEl = document.getElementById('output');
    if (outputEl) {
      outputEl.innerHTML = `<div style="display:flex;gap:10px;">
                              <span style="font-size:24px;">✅</span>
                              <div>
                                <div>Monitoring: All clear at ${ts}</div>
                                <div style="font-size:0.9em;opacity:.8;">System status: Active</div>
                              </div>
                            </div>`;
      outputEl.className = 'status-connected';
    }
    
    // Log normal reading
    addSleepLogEntry('normal');
  }
  
  // Update connection status
  connectionState.lastHeartbeat = new Date();
  updateConnectionStatus();
}

/* ---------------------  TRIGGER MICROSLEEP ALERT (REAL-TIME) --------------------*/
function triggerMicrosleepEvent () {
  const ts = new Date().toLocaleTimeString();
  
  // Vibrate device if supported
  if ('vibrate' in navigator) navigator.vibrate([300]);

  // Show alert notification
  showRealTimeAlert('🚨 Microsleep detected! Immediate action required.', 'error');

  // Update output display
  const outputEl = document.getElementById('output');
  if (outputEl) {
    outputEl.innerHTML = `<div style="display:flex;gap:10px;animation:alertPulse 1s infinite;">
                           <span style="font-size:24px;">🚨</span>
                           <div>
                             <div>Microsleep detected at ${ts}!</div>
                             <div style="font-size:0.9em;opacity:.8;">Alert level: High</div>
                           </div>
                         </div>`;
    outputEl.className = 'status-alert';
  }
  
  // Log microsleep event
  addSleepLogEntry('microsleep');
  
  // Play alert sound if available
  playAlertSound();
}

// Function to play alert sound
function playAlertSound() {
  try {
    const audio = new Audio('alert.mp3');
    audio.volume = 0.7;
    audio.play().catch(e => console.log('Audio play failed:', e));
  } catch (e) {
    console.log('Audio not supported');
  }
}

/* =======================================================================
 *  BLE CONNECT / DISCONNECT / NOTIFICATION
 * =======================================================================*/
async function handleConnectionToggle () {
  if (connectionState.isConnected) {
    await disconnectFromDevice();
  } else {
    await connectToFocusView();
  }
}

async function connectToFocusView () {
  if (!navigator.bluetooth) {
    showRealTimeAlert('Bluetooth not supported. Use Chrome/Edge/Opera.', 'error');
    return;
  }
  
  connectionState.isConnecting = true;
  updateConnectionButton();
  
  try {
    showRealTimeAlert('Select your FocusView device…', 'info');
    
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
    });
    
    const server = await device.gatt.connect();

    // Save device info to server
    await saveDeviceInfoToServer({
      name: device.name || 'Unknown',
      id: device.id
    });

    // Update connection state
    connectionState.isConnected = true;
    connectionState.isConnecting = false;
    connectionState.device = device;
    connectionState.reconnectAttempts = 0;
    
    updateConnectionButton();
    showRealTimeAlert(`✅ Connected to ${device.name || 'Device'}`, 'success');

    // Setup notifications and start monitoring
    await setupDeviceNotifications(device);
    startMonitoringSession();
    
  } catch (e) {
    console.error('Connection error:', e);
    connectionState.isConnected = false;
    connectionState.isConnecting = false;
    updateConnectionButton();
    showRealTimeAlert('Connection failed/cancelled.', 'error');
  }
}

async function setupDeviceNotifications (device) {
  try {
    const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
    const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
    const char = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
    
    // Set up notification handler
    char.addEventListener('characteristicvaluechanged', e => {
      const v = new TextDecoder('utf-8').decode(e.target.value.buffer);
      liveSensorValue = v.trim();
      handleRealTimeSensorData(liveSensorValue);
    });
    
    await char.startNotifications();
    showRealTimeAlert('Sensor notifications activated', 'success');

    // Set up disconnect handler
    device.addEventListener('gattserverdisconnected', handleDeviceDisconnect);
    
  } catch (e) {
    console.error('Notification setup error:', e);
    showRealTimeAlert('Failed to setup notifications', 'error');
  }
}

// Handle device disconnect with auto-reconnect
function handleDeviceDisconnect() {
  console.log('Device disconnected');
  connectionState.isConnected = false;
  updateConnectionButton();
  updateConnectionStatus();
  showRealTimeAlert('Device disconnected', 'warning');
  
  // Try to reconnect if not manually disconnected
  if (connectionState.device && connectionState.reconnectAttempts < connectionState.maxReconnectAttempts) {
    connectionState.reconnectAttempts++;
    showRealTimeAlert(`Attempting to reconnect (${connectionState.reconnectAttempts}/${connectionState.maxReconnectAttempts})...`, 'info');
    
    setTimeout(async () => {
      try {
        if (connectionState.device) {
          await connectionState.device.gatt.connect();
          await setupDeviceNotifications(connectionState.device);
          connectionState.isConnected = true;
          connectionState.reconnectAttempts = 0;
          updateConnectionButton();
          updateConnectionStatus();
          showRealTimeAlert('Reconnected successfully', 'success');
        }
      } catch (e) {
        console.error('Reconnect failed:', e);
        if (connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts) {
          showRealTimeAlert('Reconnection failed after multiple attempts', 'error');
          endMonitoringSession();
        }
      }
    }, 2000);
  } else {
    endMonitoringSession();
  }
}

async function disconnectFromDevice () {
  try {
    if (connectionState.device?.gatt?.connected) {
      connectionState.device.gatt.disconnect();
    }
  } catch (e) {
    console.error('Disconnect error:', e);
  }
  
  connectionState.isConnected = false;
  connectionState.device = null;
  connectionState.reconnectAttempts = 0;
  
  endMonitoringSession();
  updateConnectionButton();
  showRealTimeAlert('Disconnected', 'info');
  
  // Save data on disconnect
  await saveSleepDataToMySQL();
}

function updateConnectionButton () {
  const btn = document.getElementById('connect');
  if (!btn) return;
  
  if (connectionState.isConnecting) {
    btn.textContent = '🔄 Connecting…';
    btn.disabled = true;
    btn.className = 'btn btn-connecting';
  } else if (connectionState.isConnected) {
    btn.textContent = '🔌 Disconnect';
    btn.disabled = false;
    btn.className = 'btn btn-disconnect';
  } else {
    btn.textContent = '📡 Connect to FocusView';
    btn.disabled = false;
    btn.className = 'btn btn-connect';
  }
}

function updateConnectionStatus () {
  const el = document.getElementById('connectionStatus');
  if (!el) return;
  
  if (connectionState.isConnected) {
    const diff = connectionState.lastHeartbeat
                ? Date.now() - connectionState.lastHeartbeat.getTime() : 0;
                
    if (diff > 30000) {
      el.textContent = '⚠️ Connection unstable';
      el.className = 'status-warning';
    } else {
      el.textContent = '🟢 Connected & Active';
      el.className = 'status-connected';
    }
  } else if (connectionState.isConnecting) {
    el.textContent = '🔄 Connecting…';
    el.className = 'status-connecting';
  } else {
    el.textContent = '🔴 Disconnected';
    el.className = 'status-disconnected';
  }
}


// Add this new function to handle resetting all data
async function handleAllDataReset() {
  console.log('handleAllDataReset called'); // Debug log
  
  try {
    if (await showConfirmDialog('Reset ALL Data', 'Delete ALL data including daily, weekly, and monthly records? This cannot be undone.', 'destructive')) {
      // Reset all data structures
      const now = new Date();
      
      sleepData.dailyData = {
        microsleepCount: 0,
        date: now.toDateString(),
        log: [],
        sessionStartTime: null
      };
      
      sleepData.weeklyData = {
        microsleepCount: 0,
        totalHours: 0,
        totalMonitoredHours: 0,
        log: [],
        lastReset: now.toISOString(),
        sessionStartTime: null
      };
      
      sleepData.monthlyData = {
        microsleepCount: 0,
        totalHours: 0,
        totalMonitoredHours: 0,
        log: [],
        lastReset: now.toISOString(),
        sessionStartTime: null
      };
      
      // If currently connected, restart monitoring session
      if (connectionState.isConnected) {
        // End current session
        clearInterval(intervals.monitoring);
        
        // Start new session
        startMonitoringSession();
      }
      
      // Update UI
      updateDashboard();
      showRealTimeAlert('✅ ALL data has been reset', 'success');
      
      // Save reset state
      saveDataToLocalStorage();
      
      // Also clear data on server if possible
      try {
        const response = await fetch('reset_all_data.php', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            timestamp: now.getTime(), // Use milliseconds for consistency
            action: 'reset_all'
          })
        });
        
        const result = await response.json();
        console.log('Server reset response:', result);
        
      } catch (e) {
        console.error('Server reset error:', e);
      }
    }
  } catch (error) {
    console.error('Error in handleAllDataReset:', error);
    showRealTimeAlert('Error resetting data', 'error');
  }
}


// contoh fungsi render history item
function renderHistory(data) {
  const cont = document.getElementById('historyContainer');
  cont.innerHTML = data.map(item => {
    // buat Date dari ISO timestamp
    const dt = new Date(item.timestamp);
    // format "j/n/Y, HH.mm.ss"
    const datePart = dt.toLocaleDateString('id-ID', {
      day:   'numeric',
      month: 'numeric',
      year:  'numeric'
    });
    const timePart = dt.toLocaleTimeString('id-ID', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '.');
    
    return `
      <div class="history-item">
        <span>✅ Normal</span>
        <span>${datePart}, ${timePart}</span>
      </div>
    `;
  }).join('');
}

// kemudian panggil fetch + render:
fetch('get_sleep_data.php')
  .then(r => r.json())
  .then(res => {
    if (res.status === 'success') {
      renderHistory(res.data);
    }
  });


/* =======================================================================
 *  DATA SAVE / EXPORT / RESET
 * =======================================================================*/
async function saveDeviceInfoToServer (info) {
  try {
    const response = await fetch('save_device_info.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        nama_bluetooth: info.name,
        id_bluetooth: info.id
      })
    });
    
    const data = await response.json();
    if (data.status !== 'success') {
      console.error('Server error saving device info:', data);
    }
  } catch (e) {
    console.error('Save device error:', e);
  }
}

async function saveSleepDataToMySQL() {
  try {
    // --- hitung statistik terkini ---------------
    const dailyMicrosleeps = getTodayMicrosleepCount();
    const weekly   = getWeeklyStats();
    const monthly  = getMonthlyStats();
    const quality  = calculateSleepQuality();

    // --- susun payload --------------------------
    // Gunakan timestamp dari entry terbaru jika ada, atau gunakan current time
    const latestEntry = sleepData.dailyData.log[sleepData.dailyData.log.length - 1];
    const currentTimestamp = latestEntry?.timestampMs || Date.now();
    
    const payload = {
      // ambil timestamp dari entry terbaru atau current time
      timestamp: currentTimestamp,
      // offset menit dari UTC (positif: UTC−Offset)
      timezoneOffset: new Date().getTimezoneOffset(),
      // (opsional) nama timezone IANA, jika diperlukan
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      deviceName: connectionState.device?.name || null,

      // Harian
      dailyMicrosleeps,

      // Mingguan
      weeklyMicrosleeps: weekly.microsleepCount,
      weeklyHours:       weekly.monitoredHours,
      weeklyRate:        weekly.rate,

      // Bulanan
      monthlyMicrosleeps: monthly.microsleepCount,
      monthlyHours:       monthly.monitoredHours,
      monthlyRate:        monthly.rate,
      monthlyAvgPerDay:   monthly.avgPerDay,
      monthlyZeroDays:    monthly.zeroDays,
      monthlyLongestStreak: monthly.longestStreak,

      // Ringkasan
      sleepQuality: quality.quality,

      // Raw dump
      dailyData:   sleepData.dailyData,
      weeklyData:  sleepData.weeklyData,
      monthlyData: sleepData.monthlyData
    };

    // --- kirim ke PHP ---------------------------
    const res = await fetch('save_sleep_data.php', {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body:    JSON.stringify(payload)
    });

    const server = await res.json();
    if (server.status !== 'success') {
      console.error('Server responded with error:', server);
    }
  } catch (e) {
    console.error('saveSleepDataToMySQL – error:', e);
    saveDataToLocalStorage();
  }
}

async function handleDataReset() {
  if (await showConfirmDialog('Reset Weekly Data', 'Delete weekly and monthly data? Daily data will be preserved.', 'destructive')) {
    // Reset data structures
    const now = new Date();
    
    sleepData.weeklyData = {
      microsleepCount: 0,
      totalHours: 0,
      totalMonitoredHours: 0,
      log: [],
      lastReset: now.toISOString(),
      sessionStartTime: connectionState.isConnected ? now.toISOString() : null
    };
    
    sleepData.monthlyData = {
      microsleepCount: 0,
      totalHours: 0,
      totalMonitoredHours: 0,
      log: [],
      lastReset: now.toISOString(),
      sessionStartTime: connectionState.isConnected ? now.toISOString() : null
    };
    
    // If currently monitoring, add new monitoring entry
    if (connectionState.isConnected) {
      const startIso = now.toISOString();
      
      const monitoringEntry = {
        type: 'monitoring',
        timestamp: startIso,
        startTime: startIso,
        duration: 0,
        isActive: true
      };
      
      sleepData.weeklyData.log.push({...monitoringEntry});
      sleepData.monthlyData.log.push({...monitoringEntry});
    }
    
    updateDashboard();
    showRealTimeAlert('✅ Weekly and monthly data reset complete', 'success');
    
    // Save reset state
    saveDataToLocalStorage();
    saveSleepDataToMySQL();
  }
}

async function handleDataExport () {
  try {
    showRealTimeAlert('Preparing export…', 'info');
    
    // Get current stats
    const weekly = getWeeklyStats();
    const monthly = getMonthlyStats();
    
    // Create export data
    const exportData = {
      daily: sleepData.dailyData,
      weekly: sleepData.weeklyData,
      monthly: sleepData.monthlyData,
      stats: {
        weekly: {
          microsleepCount: weekly.microsleepCount,
          monitoredHours: weekly.monitoredHours,
          rate: weekly.rate
        },
        monthly: {
          microsleepCount: monthly.microsleepCount,
          monitoredHours: monthly.monitoredHours,
          rate: monthly.rate,
          avgPerDay: monthly.avgPerDay,
          zeroDays: monthly.zeroDays,
          longestStreak: monthly.longestStreak
        }
      },
      exportDate: new Date().toISOString(),
      version: '2.2',
      device: connectionState.device ? {
        name: connectionState.device.name || 'Unknown',
        id: connectionState.device.id
      } : null
    };
    
    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusview_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showRealTimeAlert('✅ Data exported successfully', 'success');
  } catch (e) {
    console.error('Export error:', e);
    showRealTimeAlert('Export failed', 'error');
  }
}

/* =======================================================================
 *  NOTIFICATION + CONFIRM DIALOG
 * =======================================================================*/
function showRealTimeAlert (msg, type = 'info', dur = 4000) {
  console.log(`${type.toUpperCase()}:`, msg);
  
  let cont = document.getElementById('notificationContainer');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'notificationContainer';
    cont.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;max-width:400px;';
    document.body.appendChild(cont);
  }
  
  const id = 'noti_' + Date.now();
  const style = {
    success: {bg: '#10b981', ic: '✅'},
   error: {bg: '#ef4444', ic: '❌'},
    warning: {bg: '#f59e0b', ic: '⚠️'},
    info: {bg: '#3b82f6', ic: 'ℹ️'}
  }[type] || style.info;
  
  const n = document.createElement('div');
  n.id = id;
  n.style.cssText = `background:${style.bg};color:#fff;padding:12px 16px;margin-bottom:8px;border-radius:8px;
                     box-shadow:0 4px 12px rgba(0,0,0,.3);transform:translateX(100%);transition:.3s;display:flex;gap:8px;cursor:pointer`;
  n.innerHTML = `<span>${style.ic}</span><span>${msg}</span><span style="margin-left:auto;opacity:.8;">×</span>`;
  n.onclick = () => dismissNotification(id);
  
  cont.appendChild(n);
  setTimeout(() => n.style.transform = 'translateX(0)', 100);
  setTimeout(() => dismissNotification(id), dur);
}

function dismissNotification(id) {
  const n = document.getElementById(id);
  if (n) {
    n.style.transform = 'translateX(100%)';
    n.style.opacity = '0';
    setTimeout(() => n.remove(), 300);
  }
}

function showConfirmDialog(title, msg, type = 'normal') {
  return new Promise(res => {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:10001;display:flex;align-items:center;justify-content:center;opacity:0;transition:.3s';
    
    const d = document.createElement('div');
    d.style.cssText = 'background:#1e293b;color:#fff;padding:24px;border-radius:12px;max-width:400px;width:90%;text-align:center;transform:translateY(-20px);transition:.3s;border:1px solid rgba(255,255,255,.1)';
    
    const titleColor = type === 'destructive' ? '#ef4444' : '#f8fafc';
    d.innerHTML = `<h3 style="margin:0 0 15px;color:${titleColor};font-size:1.5em;">${title}</h3>
                   <p style="margin-bottom:25px;line-height:1.5;">${msg}</p>
                   <div style="display:flex;gap:10px;">
                     <button id="confirmCancel" style="flex:1;padding:10px;border:none;background:#64748b;color:#fff;border-radius:8px;cursor:pointer;">Cancel</button>
                     <button id="confirmOk" style="flex:1;padding:10px;border:none;background:${type === 'destructive' ? '#ef4444' : '#3b82f6'};color:#fff;border-radius:8px;cursor:pointer;">OK</button>
                   </div>`;
    
    o.appendChild(d);
    document.body.appendChild(o);
    
    setTimeout(() => {
      o.style.opacity = '1';
      d.style.transform = 'translateY(0)';
    }, 20);
    
    const close = r => {
      d.style.transform = 'translateY(-20px)';
      o.style.opacity = '0';
      setTimeout(() => {
        o.remove();
        res(r);
      }, 300);
    };
    
    d.querySelector('#confirmCancel').onclick = () => close(false);
    d.querySelector('#confirmOk').onclick = () => close(true);
    o.onclick = e => {
      if (e.target === o) close(false);
    };
    
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close(false);
    }, {once: true});
  });
}

/* =======================================================================
 *  VISIBILITY CHANGE & REAL-TIME UPDATES
 * =======================================================================*/
function handleVisibilityChange() {
  if (document.hidden) {
    // Pause data collection when tab is not visible to save resources
    clearInterval(intervals.dataCollection);
    intervals.dataCollection = null;
  } else {
    // Resume data collection when tab becomes visible
    if (connectionState.isConnected && !intervals.dataCollection) {
      startRealTimeDataCollection();
    }
    
    // Immediately update the dashboard and countdown
    updateRealTimeStats();
    updateDashboard();
    updateDailyCountdown();
  }
}

// Function to emit real-time events to any listeners
function emitRealTimeEvent(eventName, data) {
  const listeners = eventListeners.get(eventName) || [];
  listeners.forEach(callback => {
    try {
      callback(data);
    } catch (e) {
      console.error(`Error in ${eventName} listener:`, e);
    }
  });
}

// Add event listener for real-time events
function addRealTimeEventListener(eventName, callback) {
  if (!eventListeners.has(eventName)) {
    eventListeners.set(eventName, []);
  }
  eventListeners.get(eventName).push(callback);
  
  // Return function to remove listener
  return () => {
    const listeners = eventListeners.get(eventName) || [];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

/* =======================================================================
 *  SAVE ACTIVITY (MANUAL WITH REAL-TIME UPDATES)
 * =======================================================================*/
function saveActivity() {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    type: 'aktivitas',
    manual: true,
    details: 'User recorded activity'
  };
  
  // Add to logs
  sleepData.dailyData.log.push(entry);
  sleepData.weeklyData.log.push(entry);
  sleepData.monthlyData.log.push(entry);
  
  // Update UI
  updateDashboard();
  showRealTimeAlert('Aktivitas disimpan', 'success');
  
  // Save to server
  saveSleepDataToMySQL();
}

/* =======================================================================
 *  CHART VISUALIZATION FOR REAL-TIME DATA
 * =======================================================================*/
function renderMicrosleepChart() {
  const chartContainer = document.getElementById('microsleepChart');
  if (!chartContainer) return;
  
  // Get monthly data for chart
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Prepare data array (one entry per day of month)
  const dailyData = Array(daysInMonth).fill(0);
  
  // Count microsleeps per day
  sleepData.monthlyData.log
    .filter(l => l.type === 'microsleep' && new Date(l.timestamp) >= startOfMonth)
    .forEach(entry => {
      const day = new Date(entry.timestamp).getDate() - 1; // 0-indexed
      if (day >= 0 && day < daysInMonth) {
        dailyData[day]++;
      }
    });
  
  // Generate labels (1-31)
  const labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
  
  // Clear previous chart
  chartContainer.innerHTML = '';
  
  // Create canvas
  const canvas = document.createElement('canvas');
  chartContainer.appendChild(canvas);
  
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    // Fallback to simple visualization if Chart.js not available
    renderSimpleChart(chartContainer, labels, dailyData);
    return;
  }
  
  // Create chart with Chart.js
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Microsleeps',
        data: dailyData,
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          },
          ticks: {
            precision: 0
          }
        },
        x: {
          title: {
            display: true,
            text: 'Day of Month'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Distribusi Microsleep Bulanan',
          font: {
            size: 16
          }
        },
        tooltip: {
          callbacks: {
            title: function(tooltipItems) {
              const dayNum = tooltipItems[0].label;
              const date = new Date(now.getFullYear(), now.getMonth(), dayNum);
              return date.toLocaleDateString();
            }
          }
        }
      }
    }
  });
}

// Simple chart fallback when Chart.js is not available
function renderSimpleChart(container, labels, data) {
  const maxValue = Math.max(...data, 1); // Ensure non-zero for scaling
  
  const html = `
    <div class="simple-chart">
      <h3>Distribusi Microsleep Bulanan</h3>
      <div class="chart-bars">
        ${data.map((value, i) => {
          const height = (value / maxValue) * 100;
          return `
            <div class="chart-bar-container" title="${labels[i]}: ${value} microsleeps">
              <div class="chart-bar" style="height: ${height}%"></div>
              <div class="chart-label">${labels[i]}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="chart-y-axis">
        <span>${maxValue}</span>
        <span>${Math.floor(maxValue/2)}</span>
        <span>0</span>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Add CSS for simple chart
  if (!document.getElementById('simple-chart-css')) {
    const style = document.createElement('style');
    style.id = 'simple-chart-css';
    style.textContent = `
      .simple-chart {
        position: relative;
        height: 250px;
        margin-top: 20px;
      }
      .chart-bars {
        display: flex;
        height: 200px;
        align-items: flex-end;
        gap: 2px;
        margin-left: 30px;
      }
      .chart-bar-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .chart-bar {
        width: 100%;
        background: rgba(239, 68, 68, 0.7);
        transition: height 0.5s;
      }
      .chart-label {
        font-size: 10px;
        margin-top: 5px;
      }
      .chart-y-axis {
        position: absolute;
        left: 0;
        top: 0;
        height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }
}

/* =======================================================================
 *  START
 * =======================================================================*/
document.addEventListener('DOMContentLoaded', initializeRealTimeSystem);
