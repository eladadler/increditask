/* ===== shared components ===== */
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const PM = window.PM;

function Icon({ name, cls }){
  return <svg className={"ico " + (cls||"")} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    dangerouslySetInnerHTML={{ __html: PM.I[name] || "" }} />;
}

function UrgencyBadge({ u }){
  const info = PM.URGENCY[u];
  return <span className={"badge b-"+info.cls}><span className="dot" style={{background:"currentColor"}}></span>{info.short}</span>;
}

function CategoryChip({ cat }){
  const c = PM.CATEGORIES[cat] || PM.CATEGORIES.other;
  return <span className="cat-chip" style={{ background: `color-mix(in oklch, ${c.color} 14%, white)`, color: c.color }}>{c.label}</span>;
}

function DeadlinePill({ deadline, done }){
  const info = PM.deadlineInfo(deadline, done);
  if(!info) return null;
  return <span className={"dl "+info.cls}><Icon name="clock" /> {info.label}</span>;
}

function ProgressBar({ p }){
  if(!p) return null;
  const full = p.pct === 100;
  return (
    <div className="prog">
      <div className="prog-bar"><div className={"prog-fill"+(full?" full":"")} style={{ width: p.pct+"%" }}></div></div>
      <span className="prog-txt">{p.done}/{p.total}</span>
    </div>
  );
}

/* ---- subtasks editor ---- */
function SubtaskList({ project, onChange }){
  const [text, setText] = useState("");
  const [prio, setPrio] = useState("mid");
  const ordered = useMemo(()=>{
    return [...project.subtasks].sort((a,b)=>{
      if(a.done !== b.done) return a.done ? 1 : -1;
      return PM.URGENCY[a.urgency].rank - PM.URGENCY[b.urgency].rank;
    });
  }, [project.subtasks]);

  function add(){
    const t = text.trim(); if(!t) return;
    onChange([...project.subtasks, { id: PM.uid(), title:t, urgency:prio, done:false }]);
    setText("");
  }
  function toggle(id){
    onChange(project.subtasks.map(s=> s.id===id ? {...s, done:!s.done} : s));
  }
  function del(id){
    onChange(project.subtasks.filter(s=> s.id!==id));
  }
  const prioColors = { high:"var(--u-high)", mid:"var(--u-mid)", low:"var(--u-low)" };

  return (
    <div>
      <div className="sub-list">
        {ordered.map(s=>(
          <div key={s.id} className={"sub"+(s.done?" done":"")}>
            <button className={"sub-check"+(s.done?" done":"")} onClick={()=>toggle(s.id)}>
              {s.done && <Icon name="check" />}
            </button>
            <span className="sub-prio" style={{ background: prioColors[s.urgency] }} title={PM.URGENCY[s.urgency].short}></span>
            <span className="sub-title">{s.title}</span>
            <button className="sub-del" onClick={()=>del(s.id)}><Icon name="trash" /></button>
          </div>
        ))}
        {!ordered.length && <div style={{fontSize:13.5, color:"var(--ink-3)", padding:"6px 2px"}}>אין עדיין תתי-משימות.</div>}
      </div>
      <div className="sub-add">
        <div className="prio-pick">
          {["high","mid","low"].map(p=>(
            <button key={p} className={"prio-btn"+(prio===p?" on":"")}
              style={prio===p?{color:prioColors[p]}:{}}
              onClick={()=>setPrio(p)} title={PM.URGENCY[p].short}>
              <span className="dot" style={{background:prioColors[p]}}></span>
            </button>
          ))}
        </div>
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") add(); }} placeholder="הוסף תת-משימה…" />
        <button className="mini-add" onClick={add}><Icon name="plus" /></button>
      </div>
    </div>
  );
}

/* ---- project card ---- */
function ProjectCard({ project, onUpdate, onComplete, onEdit, onDelete, onRestore, archived, defaultOpen, draggable }){
  const [open, setOpen] = useState(!!defaultOpen);
  const [confirming, setConfirming] = useState(false);
  const p = project;
  const prog = PM.progress(p);
  const cat = PM.CATEGORIES[p.category] || PM.CATEGORIES.other;

  function patch(fields){ onUpdate({ ...p, ...fields }); }

  return (
    <div className={"card urg-"+p.urgency+(open?" open":"")}>
      {confirming && (
        <div className="confirm-overlay" onClick={()=>setConfirming(false)}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="confirm-title">האם אתה בטוח?</div>
            <div className="confirm-sub">הפרוייקט יועבר לארכיון ולא יופיע יותר ברשימת הפעילים.</div>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={()=>setConfirming(false)}>ביטול</button>
              <button className="btn-primary" onClick={()=>{ setConfirming(false); onComplete(p); }}>כן, סיים</button>
            </div>
          </div>
        </div>
      )}
      <div className="card-top" onClick={()=>setOpen(o=>!o)}>
        {archived && (
          <span className="card-check done" style={{cursor:"default"}}><Icon name="check" /></span>
        )}
        <div className="card-body">
          <div className="card-title-row">
            <span className="card-title">{p.title}</span>
            <CategoryChip cat={p.category} />
            {!archived && <UrgencyBadge u={p.urgency} />}
          </div>
          <div className="card-meta">
            {p.client && <span className="m"><Icon name="user" /> {p.client}</span>}
            {p.income != null && p.income !== "" && <span className="m card-money"><Icon name="money" /> {PM.fmtMoney(p.income)}</span>}
            {!archived && p.deadline && <DeadlinePill deadline={p.deadline} />}
            {archived && p.completedAt && <span className="m"><Icon name="check" /> הושלם {PM.fmtDate(p.completedAt)}</span>}
          </div>
          {!archived && prog && <ProgressBar p={prog} />}
        </div>
        <div className="card-right">
          {draggable && (
            <span className="drag-handle" onClick={e=>e.stopPropagation()} title="גרור לשינוי סדר">
              <Icon name="grip" />
            </span>
          )}
          <Icon name="chevron" cls="expand-ico" />
        </div>
      </div>

      {open && (
        <div className="card-detail">
          <div className="detail-grid">
            <div>
              <div className="detail-h"><span>תתי-משימות {prog && <span style={{color:"var(--accent-ink)"}}>· {prog.pct}%</span>}</span></div>
              {!archived
                ? <SubtaskList project={p} onChange={(subs)=>patch({ subtasks: subs })} />
                : <div className="sub-list">
                    {p.subtasks.map(s=>(
                      <div key={s.id} className={"sub"+(s.done?" done":"")}>
                        <span className={"sub-check"+(s.done?" done":"")}>{s.done && <Icon name="check" />}</span>
                        <span className="sub-title">{s.title}</span>
                      </div>
                    ))}
                    {!p.subtasks.length && <div style={{fontSize:13.5,color:"var(--ink-3)"}}>—</div>}
                  </div>}
            </div>
            <div>
              <div className="detail-h">הערות וקישורים</div>
              {!archived
                ? <textarea className="notes-area" value={p.notes||""} placeholder="הערות, קישורים, פרטי קשר…"
                    onChange={e=>patch({ notes: e.target.value })} />
                : <div className="notes-area" style={{whiteSpace:"pre-wrap", background:"var(--surface-2)"}}>{p.notes||"—"}</div>}
              <div className="detail-meta">
                <div className="dm-row"><span className="k">לקוח</span><span className="v">{p.client||"—"}</span></div>
                <div className="dm-row"><span className="k">הכנסה</span><span className="v">{PM.fmtMoney(p.income)}</span></div>
                <div className="dm-row"><span className="k">דד-ליין</span><span className="v">{p.deadline ? PM.fmtDate(p.deadline) : "ללא"}</span></div>
                <div className="dm-row"><span className="k">תשלום</span><span className="v">
                  <span className={"pay-tag "+(p.paid?"pay-paid":"pay-wait")}>{p.paid?"שולם":"ממתין"}</span></span></div>
              </div>
            </div>
          </div>
          <div className="detail-actions">
            {!archived && <>
              <button className="btn-ghost" onClick={()=>onEdit(p)}><Icon name="edit" /> עריכה</button>
              <button className="btn-ghost" onClick={()=>setConfirming(true)}><Icon name="archiveIn" /> סיים והעבר לארכיון</button>
              <button className="btn-ghost danger" onClick={()=>onDelete(p)}><Icon name="trash" /> מחק</button>
            </>}
            {archived && <>
              <button className="btn-ghost" onClick={()=>onRestore(p)}><Icon name="restore" /> שחזר לפעילים</button>
              <button className="btn-ghost danger" onClick={()=>onDelete(p)}><Icon name="trash" /> מחק לצמיתות</button>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Icon, UrgencyBadge, CategoryChip, DeadlinePill, ProgressBar, SubtaskList, ProjectCard });
