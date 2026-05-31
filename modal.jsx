/* ===== add / edit project modal ===== */
function ProjectModal({ initial, onSave, onClose }){
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title || "");
  const [titleTouched, setTitleTouched] = useState(false);
  const [client, setClient] = useState(initial?.client || "");
  const [category, setCategory] = useState(initial?.category || "dev");
  const [urgency, setUrgency] = useState(initial?.urgency || "mid");
  const [deadline, setDeadline] = useState(initial?.deadline || "");
  const [income, setIncome] = useState(initial?.income ?? "");
  const [paid, setPaid] = useState(initial?.paid || false);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [detailsOpen, setDetailsOpen] = useState(editing);
  const titleRef = useRef(null);

  useEffect(()=>{ titleRef.current?.focus(); }, []);
  useEffect(()=>{
    const h = (e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return ()=> window.removeEventListener("keydown", h);
  }, []);

  function submit(){
    if(!title.trim()) return;
    onSave({
      ...(initial||{ id: PM.uid(), subtasks: [], archived:false, created: new Date().toISOString().slice(0,10) }),
      title: title.trim(), client: client.trim(), category, urgency,
      deadline: deadline || null, income: income === "" ? null : Number(income),
      paid, notes,
    });
  }

  return (
    <div className="modal-bg" onMouseDown={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{editing ? "עריכת פרוייקט" : "פרוייקט חדש"}</span>
          <button className="modal-close" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">

          {/* ── primary fields ── */}
          <div className="field">
            <label>שם הפרוייקט <span className="req-star">*</span></label>
            <input ref={titleRef} value={title}
              onChange={e=>{ setTitle(e.target.value); setTitleTouched(true); }}
              onBlur={()=>setTitleTouched(true)}
              placeholder="לדוגמה: אתר תדמית — סטודיו נובה"
              className={titleTouched && !title.trim() ? "input-error" : ""}
              onKeyDown={e=>{ if(e.key==="Enter" && (e.metaKey||e.ctrlKey)) submit(); }} />
            {titleTouched && !title.trim() && <span className="field-err">שדה חובה</span>}
          </div>

          <div className="field">
            <label>דחיפות</label>
            <div className="seg">
              {["high","mid","low"].map(u=>(
                <button key={u} className={"seg-btn"+(urgency===u?" on-"+PM.URGENCY[u].cls:"")}
                  onClick={()=>setUrgency(u)}>
                  <span className="dot" style={{background:`var(--u-${PM.URGENCY[u].cls})`}}></span>
                  {PM.URGENCY[u].short}
                </button>
              ))}
            </div>
          </div>

          {/* ── details toggle ── */}
          <button className={"details-toggle"+(detailsOpen?" open":"")}
            onClick={()=>setDetailsOpen(o=>!o)}>
            <Icon name="chevron" cls="details-chevron" />
            <span>{detailsOpen ? "פחות פרטים" : "פרטים נוספים"}</span>
          </button>

          {/* ── collapsible details ── */}
          {detailsOpen && (
            <div className="details-body">
              <div className="field-row">
                <div className="field">
                  <label>לקוח</label>
                  <input value={client} onChange={e=>setClient(e.target.value)} placeholder="שם הלקוח" />
                </div>
                <div className="field input-money">
                  <label>הכנסה</label>
                  <span className="cur" style={{top:"calc(50% + 12px)"}}>₪</span>
                  <input type="number" min="0" value={income} onChange={e=>setIncome(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="field">
                <label>קטגוריה</label>
                <div className="cat-pick">
                  {Object.entries(PM.CATEGORIES).map(([key,c])=>(
                    <button key={key} className={"cat-opt"+(category===key?" on":"")}
                      style={category===key ? { background:c.color } : { color:c.color, borderColor:`color-mix(in oklch, ${c.color} 35%, white)` }}
                      onClick={()=>setCategory(key)}>{c.label}</button>
                  ))}
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>דד-ליין</label>
                  <input type="date" value={deadline||""} onChange={e=>setDeadline(e.target.value)} />
                </div>
                <div className="field">
                  <label>סטטוס תשלום</label>
                  <div className="seg">
                    <button className={"seg-btn"+(!paid?" on-mid":"")} onClick={()=>setPaid(false)}>ממתין</button>
                    <button className={"seg-btn"+(paid?" on-low":"")} onClick={()=>setPaid(true)}>שולם</button>
                  </div>
                </div>
              </div>

              <div className="field">
                <label>הערות וקישורים</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows="3"
                  placeholder="פרטים, קישורים, נקודות לזכור…" style={{resize:"vertical", minHeight:70}} />
              </div>
            </div>
          )}

          <div className="modal-foot">
            <button className="btn-secondary" onClick={onClose}>ביטול</button>
            <button className="btn-primary" disabled={!title.trim()} onClick={submit}>
              {editing ? "שמירה" : "הוספת פרוייקט"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ProjectModal = ProjectModal;
