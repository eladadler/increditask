/* ===== shared category manager (used in Settings) ===== */
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
  function removeCat(key){
    const upd = { ...customCats };
    delete upd[key];
    onChange(upd);
  }

  const builtins = Object.entries(PM.CATEGORIES).filter(([k]) => PM.BUILTIN_CATS.has(k));
  const customs  = Object.entries(customCats);

  return (
    <div>
      <div className="cat-list">
        {builtins.map(([k,c])=>(
          <div key={k} className="cat-row">
            <span className="cat-row-dot" style={{background:c.color}}></span>
            <span className="cat-row-lbl">{c.label}</span>
            <span className="cat-row-tag">מובנה</span>
          </div>
        ))}
        {customs.map(([k,c])=>(
          <div key={k} className="cat-row">
            <span className="cat-row-dot" style={{background:c.color}}></span>
            <span className="cat-row-lbl">{c.label}</span>
            <button className="cat-row-del" onClick={()=>removeCat(k)} title="מחק">✕</button>
          </div>
        ))}
        {!customs.length && <div className="cat-empty">אין קטגוריות מותאמות עדיין</div>}
      </div>
      <div className="cat-add-row">
        <input value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") add(); }}
          placeholder="שם קטגוריה חדשה…" />
        <button onClick={add}>+</button>
      </div>
      <div className="cat-swatches">
        {CAT_COLORS.map(c=>(
          <button key={c} className={"cat-swatch"+(color===c?" on":"")}
            style={{background:c}} onClick={()=>setColor(c)} />
        ))}
      </div>
    </div>
  );
}

/* ===== icon generator (used in Settings) ===== */
function makeAppIcon(hex){
  const c = document.createElement('canvas');
  c.width = c.height = 180;
  const ctx = c.getContext('2d');
  const r=40, w=180, h=180;
  ctx.beginPath();
  ctx.moveTo(r,0); ctx.lineTo(w-r,0); ctx.quadraticCurveTo(w,0,w,r);
  ctx.lineTo(w,h-r); ctx.quadraticCurveTo(w,h,w-r,h);
  ctx.lineTo(r,h); ctx.quadraticCurveTo(0,h,0,h-r);
  ctx.lineTo(0,r); ctx.quadraticCurveTo(0,0,r,0);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 85px Rubik,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('פ', 90, 94);
  return c.toDataURL('image/png');
}

/* ===== Today & Income views ===== */

function TodayView({ projects, ...handlers }){
  const active = projects.filter(p=>!p.archived);
  const overdue = active.filter(p=>{ const n = PM.daysUntil(p.deadline); return n!=null && n<0; });
  const todayDue = active.filter(p=> PM.daysUntil(p.deadline) === 0);
  const tomorrow = active.filter(p=> PM.daysUntil(p.deadline) === 1);
  const week = active.filter(p=>{ const n=PM.daysUntil(p.deadline); return n!=null && n>=2 && n<=7; });
  const highUrg = active.filter(p=> p.urgency==="high");

  const attnSet = new Map();
  [...overdue, ...todayDue, ...tomorrow, ...highUrg].forEach(p=> attnSet.set(p.id, p));
  const attention = PM.sortProjects([...attnSet.values()]);

  const upcoming = PM.sortProjects(active.filter(p=> p.deadline && PM.daysUntil(p.deadline) >= 0))
    .sort((a,b)=> PM.daysUntil(a.deadline) - PM.daysUntil(b.deadline)).slice(0,5);

  const greeting = (()=>{ const h=new Date().getHours(); return h<12?"בוקר טוב":h<17?"צהריים טובים":h<21?"ערב טוב":"לילה טוב"; })();

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">{greeting} 👋</div>
          <div className="page-sub">{PM.fmtFull(new Date())}</div>
        </div>
      </div>

      <div className="today-hero">
        <div className={"stat "+(overdue.length?"danger":"ok")}>
          <div className="ico-bg"><Icon name="alert" /></div>
          <div className="num">{overdue.length}</div>
          <div className="lbl">{overdue.length ? "פרוייקטים באיחור" : "כלום לא באיחור 🎉"}</div>
        </div>
        <div className={"stat "+((todayDue.length+tomorrow.length)?"warn":"ok")}>
          <div className="ico-bg"><Icon name="clock" /></div>
          <div className="num">{todayDue.length + tomorrow.length}</div>
          <div className="lbl">דד-ליין היום / מחר</div>
        </div>
        <div className="stat flame">
          <div className="ico-bg"><Icon name="flame" /></div>
          <div className="num">{highUrg.length}</div>
          <div className="lbl">בדחיפות גבוהה</div>
        </div>
      </div>

      <h2 className="section-h"><Icon name="flame" /> דורש תשומת לב עכשיו</h2>
      <div className="proj-list" style={{marginBottom:34}}>
        {attention.length
          ? attention.map(p=> <ProjectCard key={p.id} project={p} {...handlers} />)
          : <div className="empty" style={{padding:"40px 20px"}}>
              <div className="empty-ico"><Icon name="sparkle" /></div>
              <h3>הכל רגוע</h3><p>אין פרוייקטים דחופים או באיחור. תיהנה מהשקט.</p>
            </div>}
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className="section-h"><Icon name="cal" /> דד-ליינים קרובים</h2>
          <div className="proj-list">
            {upcoming.map(p=> <ProjectCard key={p.id} project={p} {...handlers} />)}
          </div>
        </>
      )}
    </div>
  );
}

function IncomeView({ projects }){
  const earning = projects.filter(p=> p.income);
  const months = useMemo(()=>{
    const now = new Date(); now.setDate(1); now.setHours(0,0,0,0);
    const arr = [];
    for(let i=5;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      arr.push({ y:d.getFullYear(), m:d.getMonth(),
        label: d.toLocaleDateString("he-IL",{month:"short"}),
        full: d.toLocaleDateString("he-IL",{month:"long", year:"numeric"}),
        total:0, paid:0, count:0, items:[] });
    }
    earning.forEach(p=>{
      const ref = p.completedAt || p.deadline || p.created;
      const d = PM.parseDate(ref); if(!d) return;
      const b = arr.find(x=> x.y===d.getFullYear() && x.m===d.getMonth());
      if(b){ b.total += Number(p.income); if(p.paid) b.paid += Number(p.income); b.count++; b.items.push(p); }
    });
    return arr;
  }, [projects]);

  const max = Math.max(1, ...months.map(m=>m.total));
  const curIdx = months.length-1;
  const cur = months[curIdx];
  const totalAll = months.reduce((s,m)=>s+m.total,0);
  const avg = Math.round(totalAll / months.length);
  const pending = earning.filter(p=>!p.paid).reduce((s,p)=>s+Number(p.income),0);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">הכנסות</div>
          <div className="page-sub">סיכום 6 החודשים האחרונים</div>
        </div>
      </div>

      <div className="inc-summary">
        <div className="stat ok">
          <div className="ico-bg"><Icon name="money" /></div>
          <div className="num">{PM.fmtMoney(cur.total)}</div>
          <div className="lbl">החודש ({cur.full})</div>
        </div>
        <div className="stat flame">
          <div className="ico-bg"><Icon name="trend" /></div>
          <div className="num">{PM.fmtMoney(avg)}</div>
          <div className="lbl">ממוצע חודשי</div>
        </div>
        <div className="stat warn">
          <div className="ico-bg"><Icon name="clock" /></div>
          <div className="num">{PM.fmtMoney(pending)}</div>
          <div className="lbl">ממתין לתשלום</div>
        </div>
      </div>

      <div className="chart-card">
        <h3>הכנסה חודשית</h3>
        <div className="sub">לפי חודש סיום / דד-ליין הפרוייקט</div>
        <div className="bars">
          {months.map((m,i)=>(
            <div className="bar-col" key={i}>
              <div className="bar-val">{m.total ? PM.fmtMoney(m.total) : ""}</div>
              <div className={"bar"+(i===curIdx?" cur":"")} style={{ height: (m.total/max*100)+"%" }}></div>
              <div className={"bar-lbl"+(i===curIdx?" cur":"")}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <h3>פירוט {cur.full}</h3>
        <div className="sub">{cur.count} פרוייקטים · סה״כ {PM.fmtMoney(cur.total)}</div>
        {cur.items.length ? (
          <table className="inc-table">
            <thead><tr><th>פרוייקט</th><th>לקוח</th><th>קטגוריה</th><th>סכום</th><th>תשלום</th></tr></thead>
            <tbody>
              {cur.items.map(p=>(
                <tr key={p.id}>
                  <td style={{fontWeight:600}}>{p.title}</td>
                  <td>{p.client||"—"}</td>
                  <td><CategoryChip cat={p.category} /></td>
                  <td className="amt">{PM.fmtMoney(p.income)}</td>
                  <td><span className={"pay-tag "+(p.paid?"pay-paid":"pay-wait")}>{p.paid?"שולם":"ממתין"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{color:"var(--ink-3)", fontSize:14, padding:"10px 0"}}>אין הכנסות רשומות לחודש זה.</div>}
      </div>
    </div>
  );
}

/* ---- Settings view ---- */
const ICON_THEMES = [
  { key:"#DD8470", label:"ורוד" },
  { key:"#6E8AA0", label:"כחול" },
  { key:"#6E9580", label:"ירוק" },
  { key:"#9A7186", label:"סגול" },
];

function SettingsView({ customCats, onCatsChange }){
  const [activeIcon, setActiveIcon] = useState(
    () => localStorage.getItem("pm_icon_v1") || "#DD8470"
  );
  const [customIconUrl, setCustomIconUrl] = useState(
    () => localStorage.getItem("pm_icon_custom_v1") || null
  );
  const fileInputRef = useRef(null);

  function setLink(dataUrl){
    let link = document.querySelector('link[rel="apple-touch-icon"]');
    if(!link){ link = document.createElement('link'); link.rel = 'apple-touch-icon'; document.head.appendChild(link); }
    link.href = dataUrl;
  }

  function applyIcon(hex){
    setActiveIcon(hex);
    localStorage.setItem("pm_icon_v1", hex);
    setLink(makeAppIcon(hex));
  }

  function applyCustomIcon(dataUrl){
    setActiveIcon("custom");
    setCustomIconUrl(dataUrl);
    localStorage.setItem("pm_icon_v1", "custom");
    localStorage.setItem("pm_icon_custom_v1", dataUrl);
    setLink(dataUrl);
  }

  function handleUpload(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 180;
        const ctx = c.getContext('2d');
        // crop center square
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        ctx.drawImage(img, sx, sy, s, s, 0, 0, 180, 180);
        applyCustomIcon(c.toDataURL('image/png'));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  useEffect(()=>{
    const saved = localStorage.getItem("pm_icon_v1") || "#DD8470";
    if(saved === "custom"){
      const url = localStorage.getItem("pm_icon_custom_v1");
      if(url) setLink(url);
    } else {
      setLink(makeAppIcon(saved));
    }
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">הגדרות</div>
          <div className="page-sub">התאמה אישית של האפליקציה</div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-h"><Icon name="folder" /><span>תוויות פרוייקטים</span></div>
        <CategoryManager customCats={customCats} onChange={onCatsChange} />
      </div>

      <div className="settings-card">
        <div className="settings-h"><Icon name="sparkle" /><span>אייקון האפליקציה</span></div>
        <p className="settings-hint">האייקון שיוצג כשתוסיף את האפליקציה לדף הבית.</p>
        <div className="ip-grid">
          {ICON_THEMES.map(th=>(
            <button key={th.key} className={"ip-item"+(activeIcon===th.key?" on":"")}
              style={{background: th.key}}
              onClick={()=>applyIcon(th.key)}>
              <span className="ip-letter">פ</span>
              {activeIcon===th.key && <span className="ip-check">✓</span>}
              <span className="ip-lbl">{th.label}</span>
            </button>
          ))}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleUpload} />
        <button
          className={"ip-upload-btn"+(activeIcon==="custom"?" on":"")}
          onClick={()=>fileInputRef.current.click()}>
          {activeIcon==="custom" && customIconUrl
            ? <img src={customIconUrl} className="ip-upload-preview" alt="" />
            : <span className="ip-upload-ico"><Icon name="plus" /></span>}
          <span>{activeIcon==="custom" ? "תמונה מותאמת אישית ✓" : "העלה תמונה משלך…"}</span>
        </button>

        <p className="settings-hint" style={{marginTop:12}}>
          לאחר הבחירה, הוסף לדף הבית דרך הדפדפן כדי לראות את האייקון החדש.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { TodayView, IncomeView, SettingsView, CategoryManager });
