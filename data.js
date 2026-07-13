/* ===== data layer + helpers (plain JS, attached to window) ===== */
(function(){
  const STORE_KEY = "pm_projects_v1";

  const CATEGORIES = {
    design:    { label: "עיצוב",   color: "var(--c-design)" },
    dev:       { label: "פיתוח",   color: "var(--c-dev)" },
    consult:   { label: "ייעוץ",   color: "var(--c-consult)" },
    content:   { label: "תוכן",    color: "var(--c-content)" },
    marketing: { label: "שיווק",   color: "var(--c-marketing)" },
    other:     { label: "אחר",     color: "var(--c-other)" },
  };

  const URGENCY = {
    high: { label: "דחיפות גבוהה", short: "גבוהה", rank: 0, cls: "high" },
    mid:  { label: "דחיפות בינונית", short: "בינונית", rank: 1, cls: "mid" },
    low:  { label: "דחיפות נמוכה", short: "נמוכה", rank: 2, cls: "low" },
  };

  // ---- date helpers ----
  function today(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
  function parseDate(s){ if(!s) return null; const d = new Date(s+"T00:00:00"); return isNaN(d) ? null : d; }
  function daysUntil(s){
    const d = parseDate(s); if(!d) return null;
    return Math.round((d - today()) / 86400000);
  }
  function fmtDate(s){
    const d = parseDate(s); if(!d) return "";
    return d.toLocaleDateString("he-IL", { day:"numeric", month:"short" });
  }
  function fmtFull(d){
    return d.toLocaleDateString("he-IL", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  }
  function deadlineInfo(s, done){
    if(!s) return null;
    const n = daysUntil(s);
    if(done) return { cls:"dl-done", label: "הסתיים" };
    if(n < 0)  return { cls:"dl-over", label: `באיחור ${Math.abs(n)} י׳` };
    if(n === 0) return { cls:"dl-today", label: "היום!" };
    if(n === 1) return { cls:"dl-today", label: "מחר" };
    if(n <= 7)  return { cls:"dl-soon", label: `בעוד ${n} ימים` };
    return { cls:"dl-far", label: fmtDate(s) };
  }
  function fmtMoney(n){
    if(n == null || n === "" ) return "—";
    return "₪" + Number(n).toLocaleString("he-IL");
  }

  // ---- sorting: urgency then deadline ----
  function sortProjects(list){
    return [...list].sort((a,b)=>{
      const ua = URGENCY[a.urgency].rank, ub = URGENCY[b.urgency].rank;
      if(ua !== ub) return ua - ub;
      const da = daysUntil(a.deadline), db = daysUntil(b.deadline);
      if(da == null && db == null) return 0;
      if(da == null) return 1;
      if(db == null) return -1;
      return da - db;
    });
  }
  function progress(p){
    if(!p.subtasks || !p.subtasks.length) return null;
    const done = p.subtasks.filter(s=>s.done).length;
    return { done, total: p.subtasks.length, pct: Math.round(done/p.subtasks.length*100) };
  }

  // ---- storage ----
  function load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return [];
  }
  function save(data){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }catch(e){}
  }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  // ---- seed data ----
  function seed(){
    const t = today();
    const iso = (off)=>{ const d=new Date(t); d.setDate(d.getDate()+off); return d.toISOString().slice(0,10); };
    const thisMonth = t.getMonth(), thisYear = t.getFullYear();
    const monthISO = (mOff, day)=>{ const d=new Date(thisYear, thisMonth+mOff, day); return d.toISOString().slice(0,10); };
    return [
      { id: uid(), title: "אתר תדמית — סטודיו נוֹבָה", client: "נובה סטודיו", category:"dev",
        urgency:"high", deadline: iso(1), income: 12000, paid:false, archived:false,
        notes: "להעלות לשרת עד יום ה׳.\nקישור לפיגמה: figma.com/nova\nחסר: עמוד צור קשר + טופס.",
        subtasks:[
          { id:uid(), title:"עיצוב דף הבית", urgency:"low", done:true },
          { id:uid(), title:"פיתוח עמוד שירותים", urgency:"high", done:true },
          { id:uid(), title:"טופס יצירת קשר", urgency:"high", done:false },
          { id:uid(), title:"בדיקות מובייל", urgency:"mid", done:false },
        ], created: monthISO(0,3) },
      { id: uid(), title: "לוגו + מיתוג למאפייה", client: "לחם של אמא", category:"design",
        urgency:"high", deadline: iso(0), income: 4500, paid:false, archived:false,
        notes: "הלקוחה אוהבת גוונים חמים. שלוש חלופות לוגו לשלוח היום.",
        subtasks:[
          { id:uid(), title:"סקיצות ראשוניות", urgency:"high", done:true },
          { id:uid(), title:"3 חלופות לוגו", urgency:"high", done:false },
          { id:uid(), title:"מדריך מותג", urgency:"low", done:false },
        ], created: monthISO(0,8) },
      { id: uid(), title: "ייעוץ אסטרטגי לסטארטאפ", client: "FlowAI", category:"consult",
        urgency:"mid", deadline: iso(5), income: 8000, paid:false, archived:false,
        notes: "פגישת זום שבועית, יום שני 10:00.",
        subtasks:[
          { id:uid(), title:"מחקר שוק", urgency:"mid", done:true },
          { id:uid(), title:"מצגת המלצות", urgency:"mid", done:false },
        ], created: monthISO(0,1) },
      { id: uid(), title: "קמפיין רשתות חברתיות", client: "טבע בריא", category:"marketing",
        urgency:"mid", deadline: iso(12), income: 6500, paid:false, archived:false,
        notes: "", subtasks:[
          { id:uid(), title:"לוח תוכן חודשי", urgency:"high", done:false },
          { id:uid(), title:"15 פוסטים מעוצבים", urgency:"mid", done:false },
          { id:uid(), title:"כתיבת קופי", urgency:"low", done:false },
        ], created: monthISO(0,5) },
      { id: uid(), title: "כתיבת תוכן לבלוג", client: "פיננסים בקליק", category:"content",
        urgency:"low", deadline: iso(20), income: 2200, paid:false, archived:false,
        notes: "4 מאמרים, 800 מילים כל אחד.", subtasks:[], created: monthISO(0,2) },
      { id: uid(), title: "עדכון חנות אונליין", client: "בוטיק רוז", category:"dev",
        urgency:"low", deadline: null, income: 3000, paid:false, archived:false,
        notes: "ממתין לחומרים מהלקוח.", subtasks:[
          { id:uid(), title:"חיבור סליקה", urgency:"low", done:false },
        ], created: monthISO(0,6) },
      // archived (completed) — for income history
      { id: uid(), title: "דף נחיתה — אירוע השקה", client: "טק-קונף", category:"dev",
        urgency:"mid", deadline: monthISO(-1,15), income: 5500, paid:true, archived:true,
        notes:"", subtasks:[ {id:uid(),title:"בנייה",urgency:"mid",done:true} ], created: monthISO(-1,2),
        completedAt: monthISO(-1,15) },
      { id: uid(), title: "מצגת משקיעים", client: "FlowAI", category:"consult",
        urgency:"high", deadline: monthISO(-1,20), income: 7000, paid:true, archived:true,
        notes:"", subtasks:[], created: monthISO(-1,5), completedAt: monthISO(-1,22) },
      { id: uid(), title: "ריברנדינג מלא", client: "קפה נמל", category:"design",
        urgency:"mid", deadline: monthISO(-2,10), income: 14000, paid:true, archived:true,
        notes:"", subtasks:[], created: monthISO(-2,1), completedAt: monthISO(-2,12) },
      { id: uid(), title: "אפליקציית הזמנות", client: "פיצה ביתא", category:"dev",
        urgency:"high", deadline: monthISO(-2,25), income: 9500, paid:true, archived:true,
        notes:"", subtasks:[], created: monthISO(-2,3), completedAt: monthISO(-2,26) },
      { id: uid(), title: "סדרת באנרים", client: "טבע בריא", category:"marketing",
        urgency:"low", deadline: monthISO(-3,8), income: 3200, paid:true, archived:true,
        notes:"", subtasks:[], created: monthISO(-3,1), completedAt: monthISO(-3,9) },
    ];
  }

  // ---- custom categories ----
  const BUILTIN_CATS = new Set(['design','dev','consult','content','marketing','other']);
  const CATS_STORE = "pm_cats_v1";
  function loadCustomCats(){
    try{ return JSON.parse(localStorage.getItem(CATS_STORE)||'{}'); }catch(e){ return {}; }
  }
  function saveCustomCats(obj){
    localStorage.setItem(CATS_STORE, JSON.stringify(obj));
  }
  function applyCustomCats(obj){
    Object.keys(CATEGORIES).forEach(k=>{ if(!BUILTIN_CATS.has(k)) delete CATEGORIES[k]; });
    Object.entries(obj).forEach(([k,v])=>{ CATEGORIES[k] = v; });
  }
  applyCustomCats(loadCustomCats()); // apply on init

  // ---- cloud sync (Supabase) ----
  async function loadFromCloud(){
    try{
      const { data, error } = await window._sb.from('projects').select('data');
      if(error) throw error;
      return data.map(r => r.data);
    }catch(e){
      console.warn('[PM] cloud load failed, using localStorage:', e.message);
      return null;
    }
  }
  async function upsertToCloud(project){
    try{
      const { error } = await window._sb.from('projects').upsert({
        id: project.id,
        data: project,
        archived: !!project.completedAt,
        updated_at: new Date().toISOString()
      });
      if(error) throw error;
    }catch(e){
      console.warn('[PM] cloud upsert failed:', e.message);
    }
  }
  async function deleteFromCloud(id){
    try{
      const { error } = await window._sb.from('projects').delete().eq('id', id);
      if(error) throw error;
    }catch(e){
      console.warn('[PM] cloud delete failed:', e.message);
    }
  }

  // ---- icons (lucide-style, stroke) ----
  const I = {
    today:'<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M12 14v3M9 14h6" stroke-linecap="round"/>',
    folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
    chart:'<path d="M3 3v18h18M7 16v-5M12 16V8M17 16v-3" stroke-linecap="round"/>',
    archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
    plus:'<path d="M12 5v14M5 12h14" stroke-linecap="round"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" stroke-linecap="round"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>',
    cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    money:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
    chevron:'<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
    check:'<path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>',
    x:'<path d="M18 6 6 18M6 6l12 12" stroke-linecap="round"/>',
    trash:'<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-linecap="round" stroke-linejoin="round"/>',
    edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    archiveIn:'<path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" stroke-linecap="round" stroke-linejoin="round"/>',
    restore:'<path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8" stroke-linecap="round" stroke-linejoin="round"/>',
    alert:'<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" stroke-linecap="round" stroke-linejoin="round"/>',
    flame:'<path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 13 12 13c0-2-2-3-1-6 .5 .5 1 1 2 2 .5-2.5-1-4.5-1-7z" stroke-linecap="round" stroke-linejoin="round"/>',
    sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" stroke-linecap="round"/>',
    trend:'<path d="m3 17 6-6 4 4 8-8M21 7v5M21 7h-5" stroke-linecap="round" stroke-linejoin="round"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke-linecap="round"/>',
    inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6L5.5 5z" stroke-linecap="round" stroke-linejoin="round"/>',
    sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke-linecap="round" stroke-linejoin="round"/>',
    grip:'<circle cx="9" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1.5" fill="currentColor" stroke="none"/>',
  };
  function icon(name, cls){
    return `<svg class="ico ${cls||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor">${I[name]||''}</svg>`;
  }

  window.PM = {
    CATEGORIES, URGENCY, today, parseDate, daysUntil, fmtDate, fmtFull,
    deadlineInfo, fmtMoney, sortProjects, progress, load, save, uid, seed, icon, I, STORE_KEY,
    loadFromCloud, upsertToCloud, deleteFromCloud,
    loadCustomCats, saveCustomCats, applyCustomCats, BUILTIN_CATS,
  };
})();
