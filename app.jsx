/* ===== custom category manager ===== */
const CAT_COLORS = [
  "#E07B5A","#5A8FD6","#5DB37E","#B05AD6",
  "#D6A83A","#5ABCD6","#D65A7E","#7B8A6A",
];

function CategoryManager({ customCats, onChange }){
  const [name, setName] = useState("");
  const [color, setColor] = useState(CAT_COLORS[0]);

  function add(){
    const label = name.trim();
    if(!label) return;
    const key = "c_" + PM.uid();
    onChange({ ...customCats, [key]: { label, color } });
    setName("");
  }
  function remove(key){
    const updated = { ...customCats };
    delete updated[key];
    onChange(updated);
  }

  const builtins = Object.entries(PM.CATEGORIES).filter(([k]) => PM.BUILTIN_CATS.has(k));
  const customs  = Object.entries(customCats);

  return (
    <div>
      <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:8}}>
        {builtins.map(([k,c])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:7,padding:"2px 0"}}>
            <span style={{width:9,height:9,borderRadius:3,background:c.color,flexShrink:0,display:"inline-block"}}></span>
            <span style={{flex:1,fontSize:11.5}}>{c.label}</span>
            <span style={{fontSize:10,color:"rgba(41,38,27,.35)"}}>מובנה</span>
          </div>
        ))}
        {customs.map(([k,c])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:7,padding:"2px 0"}}>
            <span style={{width:9,height:9,borderRadius:3,background:c.color,flexShrink:0,display:"inline-block"}}></span>
            <span style={{flex:1,fontSize:11.5}}>{c.label}</span>
            <button onClick={()=>remove(k)}
              style={{appearance:"none",border:0,background:"none",cursor:"pointer",
                padding:"1px 4px",color:"rgba(41,38,27,.45)",fontSize:12,lineHeight:1,
                borderRadius:4}} title="מחק קטגוריה">✕</button>
          </div>
        ))}
        {!customs.length && (
          <div style={{fontSize:11,color:"rgba(41,38,27,.38)",paddingTop:2}}>אין קטגוריות מותאמות עדיין</div>
        )}
      </div>
      <div style={{display:"flex",gap:5,marginBottom:6}}>
        <input value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") add(); }}
          placeholder="שם קטגוריה…" className="twk-field" style={{flex:1}} />
        <button onClick={add} className="twk-btn secondary"
          style={{padding:"0 10px",flexShrink:0}}>+</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {CAT_COLORS.map(c=>(
          <button key={c} onClick={()=>setColor(c)}
            style={{width:22,height:22,borderRadius:5,background:c,padding:0,
              border:color===c?"2.5px solid rgba(0,0,0,.72)":"2px solid rgba(0,0,0,.1)",
              cursor:"pointer",flexShrink:0,appearance:"none"}} />
        ))}
      </div>
    </div>
  );
}

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
  const [customCats, setCustomCats] = useState(() => PM.loadCustomCats());

  // apply + save custom categories whenever they change
  useEffect(() => {
    PM.applyCustomCats(customCats);
    PM.saveCustomCats(customCats);
  }, [customCats]);

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
        // cloud is the source of truth — replace local state completely
        setProjects(cloudData);
        PM.save(cloudData);
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

  const reorder = (draggedId, toGroup, toIdx) => {
    setProjects(ps => {
      const dragged = ps.find(p => p.id === draggedId);
      if(!dragged) return ps;
      const groupItems = ps
        .filter(p => p.urgency === toGroup && p.id !== draggedId)
        .sort((a, b) => (a.manualOrder ?? 999999) - (b.manualOrder ?? 999999));
      let newOrder;
      if(toIdx === 0){
        newOrder = (groupItems[0]?.manualOrder ?? 1000) - 1000;
      } else if(toIdx >= groupItems.length){
        newOrder = (groupItems[groupItems.length-1]?.manualOrder ?? 0) + 1000;
      } else {
        const prev = groupItems[toIdx-1].manualOrder ?? (toIdx-1)*1000;
        const next = groupItems[toIdx].manualOrder ?? toIdx*1000;
        newOrder = (prev + next) / 2;
      }
      const updated = { ...dragged, urgency: toGroup, manualOrder: newOrder };
      PM.upsertToCloud(updated);
      return ps.map(p => p.id === draggedId ? updated : p);
    });
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
          onAdd={()=>{ setEditTarget(null); setModal("new"); }}
          handlers={handlers} onReorder={reorder} />}
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
        <TweakSection label="קטגוריות" />
        <CategoryManager customCats={customCats} onChange={setCustomCats} />
      </TweaksPanel>
    </div>
  );
}

/* ---- Projects view ---- */
function ProjectsView({ projects, search, setSearch, catFilter, setCatFilter, urgFilter, setUrgFilter, onAdd, handlers, onReorder }){
  let list = projects;
  if(search.trim()){
    const q = search.trim().toLowerCase();
    list = list.filter(p=> (p.title+" "+(p.client||"")+" "+(p.notes||"")).toLowerCase().includes(q));
  }
  if(catFilter!=="all") list = list.filter(p=> p.category===catFilter);
  if(urgFilter!=="all") list = list.filter(p=> p.urgency===urgFilter);

  const groups = [
    { key:"high", label:"דחיפות גבוהה" },
    { key:"mid",  label:"דחיפות בינונית" },
    { key:"low",  label:"דחיפות נמוכה" },
  ].map(g => ({
    ...g,
    items: list
      .filter(p=> p.urgency===g.key)
      .sort((a,b)=> (a.manualOrder??999999)-(b.manualOrder??999999))
  })).filter(g=> g.items.length);

  // SortableJS drag-and-drop
  const reorderRef = useRef(onReorder);
  reorderRef.current = onReorder;

  const listRef = useCallback((el) => {
    if(!el || el._sortable) return;
    let dragOriginParent = null;
    let dragOriginNext   = null;
    el._sortable = Sortable.create(el, {
      group:            'projects-dnd',
      animation:        200,
      ghostClass:       'drag-ghost',
      chosenClass:      'drag-chosen',
      delay:            120,
      delayOnTouchOnly: true,
      touchStartThreshold: 8,
      onStart(evt){
        dragOriginParent = evt.item.parentNode;
        dragOriginNext   = evt.item.nextSibling;
      },
      onEnd(evt){
        // Revert DOM — let React re-render from state
        dragOriginParent.insertBefore(evt.item, dragOriginNext);
        dragOriginParent = null; dragOriginNext = null;
        const id      = evt.item.dataset.projectId;
        const toGroup = evt.to.dataset.urgency;
        const toIdx   = evt.newDraggableIndex ?? 0;
        reorderRef.current(id, toGroup, toIdx);
      }
    });
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">פרוייקטים</div>
          <div className="page-sub">{projects.length} פרוייקטים פעילים · גרור כדי לסדר מחדש</div>
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

      {list.length ? (
        <div>
          {groups.map(g=>(
            <div key={g.key}>
              <div className="group-label">
                <span className="dot" style={{width:9,height:9,borderRadius:99,background:`var(--u-${g.key})`}}></span>
                <span className="t">{g.label}</span>
                <span className="n" style={{background:`var(--u-${g.key})`}}>{g.items.length}</span>
                <span className="ln"></span>
              </div>
              <div className="proj-list" data-urgency={g.key} ref={listRef}>
                {g.items.map(p=> (
                  <div key={p.id} data-project-id={p.id} className="drag-item">
                    <ProjectCard project={p} {...handlers} />
                  </div>
                ))}
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
