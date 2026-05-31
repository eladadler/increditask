/* ===== welcome / onboarding screen ===== */
function WelcomeScreen({ onDone }){
  return (
    <div className="welcome">

      {/* blurred colour orbs in background */}
      <div className="welcome-orb o1"></div>
      <div className="welcome-orb o2"></div>
      <div className="welcome-orb o3"></div>

      {/* floating mini project cards */}
      <div className="welcome-art">
        <div className="wc-card c1">
          <span className="wc-dot" style={{background:"var(--u-high)"}}></span>
          <div className="wc-info">
            <div className="wc-name">אתר תדמית</div>
            <div className="wc-meta">דד-ליין: היום</div>
          </div>
          <span className="wc-amt">₪12,000</span>
        </div>
        <div className="wc-card c2">
          <span className="wc-dot" style={{background:"var(--u-mid)"}}></span>
          <div className="wc-info">
            <div className="wc-name">לוגו + מיתוג</div>
            <div className="wc-meta">3 משימות פתוחות</div>
          </div>
          <span className="wc-amt">₪4,500</span>
        </div>
        <div className="wc-card c3">
          <span className="wc-dot" style={{background:"var(--u-low)"}}></span>
          <div className="wc-info">
            <div className="wc-name">קמפיין מדיה</div>
            <div className="wc-meta">בתהליך</div>
          </div>
          <span className="wc-amt">₪6,500</span>
        </div>
      </div>

      {/* content card — slides up */}
      <div className="welcome-card">
        <div className="welcome-mark">פ</div>
        <h1 className="welcome-title">הפרוייקטים שלי</h1>
        <p className="welcome-sub">ריכוז כל הלקוחות, המשימות וההכנסות — במקום אחד</p>

        <div className="welcome-feats">
          <div className="wfeat">
            <span className="wfeat-ico"><Icon name="list" /></span>
            <span>מעקב פרוייקטים ומשימות</span>
          </div>
          <div className="wfeat">
            <span className="wfeat-ico"><Icon name="money" /></span>
            <span>ניהול הכנסות ותשלומים</span>
          </div>
          <div className="wfeat">
            <span className="wfeat-ico"><Icon name="flame" /></span>
            <span>עדיפויות ודד-ליינים</span>
          </div>
          <div className="wfeat">
            <span className="wfeat-ico"><Icon name="sparkle" /></span>
            <span>סנכרון בין מכשירים</span>
          </div>
        </div>

        <button className="welcome-cta" onClick={onDone}>בוא נתחיל</button>
        <p className="welcome-note">ניתן לשנות הגדרות בכל עת</p>
      </div>
    </div>
  );
}

window.WelcomeScreen = WelcomeScreen;
