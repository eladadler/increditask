/* ===== main app ===== */
const ACCENTS = {
  "#DD8470": { a:"oklch(0.66 0.11 40)",  a2:"oklch(0.62 0.115 33)", soft:"oklch(0.95 0.03 42)",  ink:"oklch(0.52 0.1 36)" },
  "#6E8AA0": { a:"oklch(0.57 0.06 242)", a2:"oklch(0.53 0.065 248)", soft:"oklch(0.95 0.022 245)", ink:"oklch(0.45 0.06 245)" },
  "#6E9580": { a:"oklch(0.58 0.07 160)", a2:"oklch(0.54 0.075 162)", soft:"oklch(0.95 0.025 160)", ink:"oklch(0.42 0.06 162)" },
  "#9A7186": { a:"oklch(0.56 0.08 350)", a2:"oklch(0.52 0.085 352)", soft:"oklch(0.95 0.025 350)", ink:"oklch(0.45 0.07 350)" },
};
const DENSITY = { "צפוף":0.78, "רגיל":1, "מרווח":1.25 };
const TWEAK_DEFAULTS = { accent:"#DD8470", density:"רגיל" };

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(()=>{
    const r = document.documentElement.style;
    const acc = ACCENTS[t.accent] || ACCENTS["#DD8470"];
    r.setProperty("--accent", acc.a); r.setProperty("--accent-2", acc.a2);
    r.setProperty("--accent-soft", acc.soft); r.setProperty("--accent-ink", acc.ink);
    r.setProperty("--pad", String(DENSITY[t.density] ?? 1));
  }, [t.accent, t.density]);

  const [projects, setProjects] = useState(()=> PM.load());
  const [view, setView] = useState("today");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [urgFilter, setUrgFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [cloudStatus, setCloudStatus] = useState("idle"); // idle | loading | synced | error

  // save to localStorage on every change
  useEffect(()=>{ PM.save(projects); }, [projects]);

  // load from Supabase on mount
  useEffect(()=>{
    setCloudStatus("loading");
    PM.loadFromCloud().then(cloudData=>{
      if(cloudData === null){
        // network/auth error — stay on localStorage
        setCloudStatus("error");
      } else if(cloudData.length > 0){
        // cloud has data — merge: keep anything user added before response arrived
        setProjects(current => {
          const cloudIds = new Set(cloudData.map(p => p.id));
          const userAdded = current.filter(p => !cloudIds.has(p.id));
          const merged = [...cloudData, ...userAdded];
          PM.save(merged);
          return merged;
        });
        setCloudStatus("synced");
      } else {
        // cloud is empty — upload current local data to cloud
        const local = PM.load();
        Promise.all(local.map(p => PM.upsertToCloud(p)))
          .then(()=> setCloudStatus("synced"));
      }
    });
  }, []);

  const update = (proj)=>{
    setProjects(ps=> ps.map(p=> p.id===proj.id ? proj : p));
    PM.upsertToCloud(proj);
  };
  const complete = (proj)=>{
    const updated = { ...proj, archived:true, completedAt: new Date().toISOString().slice(0,10) };
    setProjects(ps=> ps.map(p=> p.id===proj.id ? updated : p));
    PM.upsertToCloud(updated);
  };
  const restore = (proj)=>{
    const updated = { ...proj, archived:false, completedAt:null };
    setProjects(ps=> ps.map(p=> p.id===proj.id ? updated : p));
    PM.upsertToCloud(updated);
  };
  const remove = (proj)=>{
    if(confirm(`למחוק את "${proj.title}"?`)){
      setProjects(ps=> ps.filter(p=> p.id!==proj.id));
      PM.deleteFromCloud(proj.id);
    }
  };
  const edit = (proj)=> { setEditTarget(proj); setModal("edit"); };
  const saveProject = (proj)=>{
    const isNew = !projects.some(p=> p.id===proj.id);
    setProjects(ps=> ps.some(p=>p.id===proj.id) ? ps.map(p=> p.id===proj.id ? proj : p) : [...ps, proj]);
    PM.upsertToCloud(proj);
    setModal(null); setEditTarget(null);
    if(isNew) setView("projects"); // navigate to projects so user sees the new card
  };

  const handlers = { onUpdate:update, onComplete:complete, onEdit:edit, onDelete:remove, onRestore:restore };

  const active = projects.filter(p=>!p.archived);
  const archived = projects.filter(p=>p.archived);

  const counts = {
    today: active.filter(p=>{ const n=PM.daysUntil(p.deadline); return (n!=null&&n<=1) || p.urgency==="high"; }).length,
    projects: active.length,
    archive: archived.length,
  };

  const navItems = [
    { key:"today", label:"היום", icon:"today", count: counts.today },
    { key:"projects", label:"פרוייקטים", icon:"folder", count: counts.projects },
    { key:"income", label:"הכנסות", icon:"chart" },
    { key:"archive", label:"ארכיון", icon:"archive", count: counts.archive },
  ];

  return (
    <div className="app">
      <main className="main">
        {view==="today" && <TodayView projects={projects} {...handlers} />}
        {view==="projects" && <ProjectsView
          projects={active} search={search} setSearch={setSearch}
          catFilter={catFilter} setCatFilter={setCatFilter}
          urgFilter={urgFilter} setUrgFilter={setUrgFilter}
          onAdd={()=>{ setEditTarget(null); setModal("new"); }} handlers={handlers} />}
        {view==="income" && <IncomeView projects={projects} />}
        {view==="archive" && <ArchiveView projects={archived} handlers={handlers} />}
      </main>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">פ</div>
          <div>
            <div className="brand-name">הפרוייקטים שלי</div>
            <div className="brand-sub">ניהול עצמאי</div>
          </div>
        </div>
        {navItems.map(it=>(
          <button key={it.key} className={"nav-item"+(view===it.key?" active":"")} onClick={()=>setView(it.key)}>
            <Icon name={it.icon} />
            <span>{it.label}</span>
            {it.count != null && it.count > 0 && <span className="count">{it.count}</span>}
          </button>
        ))}
        <div className="sidebar-foot">
          <button className="add-btn" onClick={()=>{ setEditTarget(null); setModal("new"); }}>
            <Icon name="plus" /> פרוייקט חדש
          </button>
        </div>
      </aside>

      <button className="fab" onClick={()=>{ setEditTarget(null); setModal("new"); }}><Icon name="plus" /></button>

      {cloudStatus==="loading" && <div className="sync-toast">☁ מסנכרן…</div>}
      {cloudStatus==="synced"  && <div className="sync-toast synced" key={Date.now()}>☁ מסונכרן</div>}
      {cloudStatus==="error"   && <div className="sync-toast error">⚠ נכשל לסנכרן</div>}

      {modal && <ProjectModal initial={editTarget} onSave={saveProject} onClose={()=>{ setModal(null); setEditTarget(null); }} />}

      <TweaksPanel>
        <TweakSection label="מראה" />
        <TweakColor label="צבע מבטא" value={t.accent}
          options={["#DD8470","#6E8AA0","#6E9580","#9A7186"]}
          onChange={(v)=>setTweak("accent", v)} />
        <TweakRadio label="צפיפות" value={t.density}
          options={["צפוף","רגיל","מרווח"]}
          onChange={(v)=>setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

/* ---- Projects view ---- */
function ProjectsView({ projects, search, setSearch, catFilter, setCatFilter, urgFilter, setUrgFilter, onAdd, handlers }){
  let list = projects;
  if(search.trim()){
    const q = search.trim().toLowerCase();
    list = list.filter(p=> (p.title+" "+(p.client||"")+" "+(p.notes||"")).toLowerCase().includes(q));
  }
  if(catFilter!=="all") list = list.filter(p=> p.category===catFilter);
  if(urgFilter!=="all") list = list.filter(p=> p.urgency===urgFilter);

  const sorted = PM.sortProjects(list);
  const groups = [
    { key:"high", label:"דחיפות גבוהה", items: sorted.filter(p=>p.urgency==="high") },
    { key:"mid",  label:"דחיפות בינונית", items: sorted.filter(p=>p.urgency==="mid") },
    { key:"low",  label:"דחיפות נמוכה", items: sorted.filter(p=>p.urgency==="low") },
  ].filter(g=> g.items.length);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">פרוייקטים</div>
          <div className="page-sub">{projects.length} פרוייקטים פעילים · ממויינים לפי דחיפות ודד-ליין</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש פרוייקט או לקוח…" />
        </div>
        <div className="chip-row">
          <button className={"fchip"+(catFilter==="all"&&urgFilter==="all"?" on":"")}
            onClick={()=>{ setCatFilter("all"); setUrgFilter("all"); }}>הכל</button>
          {Object.entries(PM.CATEGORIES).map(([k,c])=>(
            <button key={k} className={"fchip"+(catFilter===k?" on":"")}
              onClick={()=>setCatFilter(catFilter===k?"all":k)}>
              <span className="dot" style={{background:c.color}}></span>{c.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length ? (
        <div>
          {groups.map(g=>(
            <div key={g.key}>
              <div className="group-label">
                <span className="dot" style={{width:9,height:9,borderRadius:99,background:`var(--u-${g.key})`}}></span>
                <span className="t">{g.label}</span>
                <span className="n" style={{background:`var(--u-${g.key})`}}>{g.items.length}</span>
                <span className="ln"></span>
              </div>
              <div className="proj-list">
                {g.items.map(p=> <ProjectCard key={p.id} project={p} {...handlers} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-ico"><Icon name="inbox" /></div>
          <h3>{projects.length ? "אין תוצאות" : "עדיין אין פרוייקטים"}</h3>
          <p>{projects.length ? "נסה לשנות את החיפוש או הסינון." : "הוסף את הפרוייקט הראשון שלך כדי להתחיל."}</p>
          {!projects.length && <button className="btn-primary" style={{marginTop:18}} onClick={onAdd}>+ פרוייקט חדש</button>}
        </div>
      )}
    </div>
  );
}

/* ---- Archive view ---- */
function ArchiveView({ projects, handlers }){
  const sorted = [...projects].sort((a,b)=> (b.completedAt||"").localeCompare(a.completedAt||""));
  const totalEarned = projects.reduce((s,p)=> s + (Number(p.income)||0), 0);
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">ארכיון</div>
          <div className="page-sub">{projects.length} פרוייקטים שהושלמו · {PM.fmtMoney(totalEarned)} סה״כ</div>
        </div>
      </div>
      {sorted.length ? (
        <div className="proj-list">
          {sorted.map(p=> <ProjectCard key={p.id} project={p} archived {...handlers} />)}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-ico"><Icon name="archive" /></div>
          <h3>הארכיון ריק</h3>
          <p>פרוייקטים שתסמן כהושלמו יופיעו כאן.</p>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
