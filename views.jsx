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

Object.assign(window, { TodayView, IncomeView });
