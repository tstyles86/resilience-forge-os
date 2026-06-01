import { useState, useEffect, useCallback } from "react";

const modules = [
  { id: "home", label: "Command", icon: "⚡" },
  { id: "content", label: "Content Engine", icon: "✍️" },
  { id: "coaching", label: "Coaching Hub", icon: "🎯" },
  { id: "brand", label: "Brand", icon: "📡" },
  { id: "advocacy", label: "Advocacy", icon: "🤝" },
  { id: "book", label: "Book Lab", icon: "📖" },
  { id: "ideas", label: "Idea Forge", icon: "💡" },
  { id: "calendar", label: "Calendar", icon: "🗓️" },
  { id: "library", label: "Library", icon: "🗄️" },
];

const quotes = [
  "You don't have to be at 100% to show up. You just have to be honest about where you are and build from there.",
  "The cut gets them in. The bond keeps them for life.",
  "Legacy is just consistency over a long period of time.",
  "Who can this help — through me?",
  "The standard is the standard. No asterisks. No exceptions.",
  "Influence is what happens when your reputation walks into the room before you do.",
];

async function storageGet(key, fallback) {
  try {
    const v = localStorage.getItem("rfos:" + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
async function storageSet(key, value) {
  try {
    localStorage.setItem("rfos:" + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

async function callClaude(system, userContent) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, content: userContent }),
  });
  const data = await res.json();
  if (data.error) return data.error;
  return data.text || "No response.";
}

function TypewriterText({ text, speed = 30 }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);
  useEffect(() => { setDisplayed(""); setIdx(0); }, [text]);
  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => { setDisplayed((p) => p + text[idx]); setIdx((i) => i + 1); }, speed);
      return () => clearTimeout(t);
    }
  }, [idx, text, speed]);
  return <span>{displayed}<span className="cursor">|</span></span>;
}

function HomeModule() {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [intention, setIntention] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [loaded, setLoaded] = useState(false);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const savedIntention = await storageGet(`intention:${todayKey}`, "");
      const savedTasks = await storageGet("tasks", []);
      setIntention(savedIntention);
      setTasks(savedTasks);
      setLoaded(true);
    })();
  }, [todayKey]);

  useEffect(() => { if (loaded) storageSet(`intention:${todayKey}`, intention); }, [intention, loaded, todayKey]);
  useEffect(() => { if (loaded) storageSet("tasks", tasks); }, [tasks, loaded]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((t) => [...t, { id: Date.now(), text: newTask.trim(), done: false }]);
    setNewTask("");
  };
  const toggleTask = (id) => setTasks((t) => t.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  const removeTask = (id) => setTasks((t) => t.filter((x) => x.id !== id));

  const stats = [
    { label: "Years Behind the Chair", value: "35+" },
    { label: "Open Tasks", value: String(tasks.filter((t) => !t.done).length) },
    { label: "Days to Full Return", value: "90" },
    { label: "Book Chapters", value: "12" },
  ];

  return (
    <div className="home-module">
      <div className="welcome-bar">
        <div>
          <div className="date-label">{today}</div>
          <h1 className="welcome-heading">Welcome back, <span className="accent">Travis.</span></h1>
        </div>
        <div className="next-quote-btn" onClick={() => setQuoteIdx((i) => (i + 1) % quotes.length)}>Next Quote →</div>
      </div>

      <div className="quote-card">
        <div className="quote-mark">"</div>
        <div className="quote-text"><TypewriterText text={quotes[quoteIdx]} key={quoteIdx} /></div>
        <div className="quote-source">— The Architecture of Authority</div>
      </div>

      <div className="planner-row">
        <div className="planner-col">
          <div className="section-label">TODAY'S INTENTION</div>
          <textarea
            className="input-field intention-field"
            placeholder="What's the one thing that matters most today?"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            rows={2}
          />
          <div className="save-note">{loaded ? "Saved automatically" : "Loading..."}</div>
        </div>
        <div className="planner-col">
          <div className="section-label">TASKS</div>
          <div className="task-input-row">
            <input
              className="input-field"
              placeholder="Add a task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <button className="task-add-btn" onClick={addTask}>+</button>
          </div>
          <div className="task-list">
            {tasks.length === 0 && <div className="task-empty">No tasks yet.</div>}
            {tasks.map((t) => (
              <div key={t.id} className={`task-item ${t.done ? "done" : ""}`}>
                <span className="task-check" onClick={() => toggleTask(t.id)}>{t.done ? "✓" : "○"}</span>
                <span className="task-text">{t.text}</span>
                <span className="task-remove" onClick={() => removeTask(t.id)}>×</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneratorResult({ result, kind, saveToLibrary, scheduleItem }) {
  const [saved, setSaved] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduled, setScheduled] = useState(false);
  if (!result) return null;

  const doSchedule = async () => {
    await scheduleItem({ kind, text: result, date });
    setScheduled(true); setScheduling(false);
    setTimeout(() => setScheduled(false), 2500);
  };

  return (
    <div className="result-card">
      <div className="result-label">{kind.toUpperCase()}</div>
      <div className="result-text">{result}</div>
      <div className="result-actions">
        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(result)}>Copy</button>
        <button
          className="copy-btn"
          onClick={async () => { await saveToLibrary({ kind, text: result }); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        >
          {saved ? "✓ Saved to Library" : "Save to Library"}
        </button>
        {scheduleItem && (
          scheduling ? (
            <span className="schedule-inline">
              <input className="schedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className="copy-btn schedule-confirm" onClick={doSchedule}>Add →</button>
              <button className="copy-btn" onClick={() => setScheduling(false)}>Cancel</button>
            </span>
          ) : (
            <button className="copy-btn" onClick={() => setScheduling(true)}>{scheduled ? "✓ Scheduled" : "🗓️ Schedule"}</button>
          )
        )}
      </div>
    </div>
  );
}

function ContentModule({ saveToLibrary, scheduleItem }) {
  const [type, setType] = useState("instagram");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const types = [
    { id: "instagram", label: "Instagram Caption" },
    { id: "youtube", label: "YouTube Script Hook" },
    { id: "quote", label: "Shareable Quote" },
    { id: "caption_reel", label: "Reel Caption" },
  ];

  const systemPrompt = `You are writing content for Travis Sanders — Master Barber, Peer Advocate for Amputees, and Author of "The Architecture of Authority." 
Travis's voice is: direct, philosophical, warm, street-wise but deeply wise, grounded in barbershop culture and resilience. 
He uses short punchy sentences mixed with deeper reflective ones. He references the chair, the cape, showing up, building from scratch.
His Instagram is @resilience_forge. His brand is Travis Talks Philosophy.
Write only the content requested — no preamble, no explanation.`;

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true); setResult("");
    const promptMap = {
      instagram: `Write an Instagram caption for @resilience_forge about: ${topic}. Include relevant hashtags at the end. Make it authentic to Travis's voice.`,
      youtube: `Write a 30-second YouTube video hook script (what Travis says in the first 30 seconds) for a video about: ${topic}. Make it gripping and true to his voice.`,
      quote: `Write 3 powerful shareable quotes Travis could post about: ${topic}. Each should be short, punchy, and sound like Travis.`,
      caption_reel: `Write a short Instagram Reel caption (under 100 words) for a video about: ${topic}. Include a call to action and hashtags.`,
    };
    try { setResult(await callClaude(systemPrompt, promptMap[type])); }
    catch { setResult("Something went wrong. Try again."); }
    setLoading(false);
  }

  return (
    <div className="module-content">
      <div className="module-header"><h2>Content Engine</h2><p>Generate on-brand content in your voice — fast.</p></div>
      <div className="type-tabs">
        {types.map((t) => (
          <button key={t.id} className={`type-tab ${type === t.id ? "active" : ""}`} onClick={() => setType(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="input-area">
        <label className="input-label">What's the topic or theme?</label>
        <textarea className="input-field" placeholder="e.g. coming back stronger after a setback, the importance of showing up..." value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} />
        <button className="generate-btn" onClick={generate} disabled={loading || !topic.trim()}>{loading ? "Generating..." : "Generate →"}</button>
      </div>
      <GeneratorResult result={result} kind={`Content · ${types.find((t) => t.id === type).label}`} saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />
    </div>
  );
}

function CoachingModule() {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeClient, setActiveClient] = useState(null);
  const [newClientName, setNewClientName] = useState("");
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => { setClients(await storageGet("clients", [])); setLoaded(true); })(); }, []);
  useEffect(() => { if (loaded) storageSet("clients", clients); }, [clients, loaded]);

  const frameworks = [
    "The Pivot Framework — acknowledging what changed and building forward",
    "The Mirror Before the Mirror — self-honesty and blind spots",
    "Know Your Why — reconnecting to purpose",
    "The Standard Is the Standard — accountability without excuses",
    "Building Bridges — moving from transaction to relationship",
  ];

  const addClient = () => {
    if (!newClientName.trim()) return;
    const c = { id: Date.now(), name: newClientName.trim(), notes: [] };
    setClients((cs) => [...cs, c]);
    setActiveClient(c.id);
    setNewClientName("");
  };

  const current = clients.find((c) => c.id === activeClient);

  async function generate() {
    if (!situation.trim()) return;
    setLoading(true); setResult("");
    try {
      const r = await callClaude(
        `You are assisting Travis Sanders, a Life Coaching Master Barber. Travis coaches people using principles from barbershop philosophy — resilience, showing up, holding the standard, building from scratch. 
Generate a coaching session prep: key questions to ask, what framework to apply, and 2-3 conversation starters. Be direct, warm, and practical. Sound like Travis thinks.`,
        `Client${current ? ` named ${current.name}` : ""} situation: ${situation}

Generate session prep for Travis.`
      );
      setResult(r);
    } catch { setResult("Something went wrong. Try again."); }
    setLoading(false);
  }

  const saveNote = () => {
    if (!current || !result) return;
    setClients((cs) => cs.map((c) => c.id === current.id ? { ...c, notes: [...c.notes, { id: Date.now(), date: new Date().toLocaleDateString(), situation, prep: result }] } : c));
    setResult(""); setSituation("");
  };

  return (
    <div className="module-content">
      <div className="module-header"><h2>Coaching Hub</h2><p>Your client notebook. Prep sessions. Track history.</p></div>

      <div className="client-bar">
        {clients.map((c) => (
          <button key={c.id} className={`client-chip ${activeClient === c.id ? "active" : ""}`} onClick={() => setActiveClient(c.id)}>
            {c.name} {c.notes.length > 0 && <span className="chip-count">{c.notes.length}</span>}
          </button>
        ))}
        <div className="client-add">
          <input className="client-add-input" placeholder="+ New client" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addClient()} />
        </div>
      </div>

      {current && current.notes.length > 0 && (
        <div className="notes-history">
          <div className="section-label">{current.name.toUpperCase()} · SESSION HISTORY</div>
          {current.notes.slice().reverse().map((n) => (
            <details key={n.id} className="note-entry">
              <summary><span className="note-date">{n.date}</span> {n.situation.slice(0, 60)}{n.situation.length > 60 ? "..." : ""}</summary>
              <div className="note-prep">{n.prep}</div>
            </details>
          ))}
        </div>
      )}

      <div className="frameworks-list" style={{ marginTop: "1.5rem" }}>
        <div className="section-label">YOUR FRAMEWORKS</div>
        {frameworks.map((f, i) => (
          <div key={i} className="framework-item"><span className="framework-num">0{i + 1}</span><span>{f}</span></div>
        ))}
      </div>

      <div className="input-area" style={{ marginTop: "1.5rem" }}>
        <label className="input-label">{current ? `What's going on with ${current.name}?` : "What's their situation? (select or add a client to save history)"}</label>
        <textarea className="input-field" placeholder="Describe what the client is going through — setback, lack of direction, career crossroads..." value={situation} onChange={(e) => setSituation(e.target.value)} rows={4} />
        <button className="generate-btn" onClick={generate} disabled={loading || !situation.trim()}>{loading ? "Preparing..." : "Prep Session →"}</button>
      </div>

      {result && (
        <div className="result-card">
          <div className="result-label">SESSION PREP</div>
          <div className="result-text">{result}</div>
          <div className="result-actions">
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(result)}>Copy</button>
            {current && <button className="copy-btn" onClick={saveNote}>Save to {current.name}'s History</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function AdvocacyModule({ saveToLibrary, scheduleItem }) {
  const [patientSituation, setPatientSituation] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const reminders = [
    "You sat in that same bed. Bring that truth.",
    "Don't rush past their fear. Sit in it first.",
    "Your prosthetic is visible proof. Let it speak.",
    "You didn't get a peer advocate. You are what you never had.",
    "90 days is real. Don't hide it — share the plan.",
  ];

  async function generate() {
    if (!patientSituation.trim()) return;
    setLoading(true); setResult("");
    try {
      const r = await callClaude(
        `You are helping Travis Sanders prepare for a peer advocacy visit at Kennestone Hospital. Travis is an above-the-knee amputee who returned to work full time within 90 days. He sits with newly amputated patients to give them hope and lived perspective. 
Generate talking points, questions to ask, things to watch for emotionally, and how Travis might share his own story in a way that's helpful for this specific patient. Be warm, real, and trauma-informed. Travis doesn't minimize — he validates and then shows what's possible.`,
        `Patient situation: ${patientSituation}

Help Travis prepare for this visit.`
      );
      setResult(r);
    } catch { setResult("Something went wrong. Try again."); }
    setLoading(false);
  }

  return (
    <div className="module-content">
      <div className="module-header"><h2>Advocacy Prep</h2><p>Prepare for hospital visits. Show up with the right words.</p></div>
      <div className="frameworks-list">
        <div className="section-label">REMINDERS BEFORE YOU WALK IN</div>
        {reminders.map((r, i) => (<div key={i} className="framework-item"><span className="framework-num accent-dot">•</span><span>{r}</span></div>))}
      </div>
      <div className="input-area" style={{ marginTop: "1.5rem" }}>
        <label className="input-label">Patient Situation</label>
        <textarea className="input-field" placeholder="What do you know about this patient? Age, amputation type, emotional state, support system, fears..." value={patientSituation} onChange={(e) => setPatientSituation(e.target.value)} rows={4} />
        <button className="generate-btn" onClick={generate} disabled={loading || !patientSituation.trim()}>{loading ? "Preparing..." : "Prep Visit →"}</button>
      </div>
      <GeneratorResult result={result} kind="Advocacy · Visit Prep" saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />
    </div>
  );
}

function BookModule({ saveToLibrary, scheduleItem }) {
  const [chapter, setChapter] = useState("");
  const [angle, setAngle] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const chapters = [
    "Know Your Why", "The Mirror Before the Mirror", "The Standard Is the Standard",
    "The Art of the Listen", "The Art of the Pivot", "Building Bridges, Not Transactions",
    "From Chair to Community", "The Weight of the Cape", "The Reputation That Precedes You",
    "The Master's Code", "What You Leave in the Chair", "The Name That Outlasts You",
  ];

  async function generate() {
    if (!chapter || !angle.trim()) return;
    setLoading(true); setResult("");
    try {
      const r = await callClaude(
        `You are helping Travis Sanders expand content from his book "The Architecture of Authority." Travis is a Master Barber, Peer Advocate, and Author from Marietta, Georgia. His voice is philosophical, direct, warm, and grounded in barbershop wisdom and lived resilience. He lost his leg in 2023 and returned to work full time in 90 days. Write in his voice — punchy but deep, personal but universal.`,
        `Chapter: "${chapter}"
Angle/expansion: ${angle}

Write a 200-300 word expansion or new section in Travis's voice.`
      );
      setResult(r);
    } catch { setResult("Something went wrong. Try again."); }
    setLoading(false);
  }

  return (
    <div className="module-content">
      <div className="module-header"><h2>Book Lab</h2><p>Expand chapters. Draft new content. Keep building.</p></div>
      <div className="input-area">
        <label className="input-label">Select a Chapter</label>
        <select className="input-field" value={chapter} onChange={(e) => setChapter(e.target.value)}>
          <option value="">— Choose a chapter —</option>
          {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="input-label" style={{ marginTop: "1rem" }}>What angle or expansion?</label>
        <textarea className="input-field" placeholder="e.g. add a story about a client who had a career breakthrough, expand on silence as a listening tool..." value={angle} onChange={(e) => setAngle(e.target.value)} rows={4} />
        <button className="generate-btn" onClick={generate} disabled={loading || !chapter || !angle.trim()}>{loading ? "Writing..." : "Generate Content →"}</button>
      </div>
      <GeneratorResult result={result} kind={chapter ? `Book · ${chapter}` : "Book Draft"} saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />
    </div>
  );
}

function BrandModule({ saveToLibrary, scheduleItem }) {
  const [task, setTask] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const brandAssets = [
    { label: "Instagram", value: "@resilience_forge" },
    { label: "Platform", value: "Travis Talks Philosophy" },
    { label: "Book", value: "The Architecture of Authority" },
    { label: "Location", value: "Marietta, Georgia" },
    { label: "Documentary", value: "Black Barbershop" },
  ];

  async function generate() {
    if (!task.trim()) return;
    setLoading(true); setResult("");
    try {
      const r = await callClaude(
        `You are Travis Sanders's brand strategist. Travis is a Master Barber, Life Coaching Barber, Peer Advocate for Amputees, and Author from Marietta, Georgia. His brand is "Travis Talks Philosophy." His Instagram is @resilience_forge. His book is "The Architecture of Authority." He appeared in the documentary Black Barbershop. His brand pillars are: resilience, discipline, legacy, community, and barbershop wisdom. Help with any brand-related task.`,
        task
      );
      setResult(r);
    } catch { setResult("Something went wrong. Try again."); }
    setLoading(false);
  }

  return (
    <div className="module-content">
      <div className="module-header"><h2>Brand Dashboard</h2><p>Your platform. Your identity. Your reach.</p></div>
      <div className="brand-assets">
        <div className="section-label">BRAND ASSETS</div>
        <div className="assets-grid">
          {brandAssets.map((a) => (<div key={a.label} className="asset-card"><div className="asset-label">{a.label}</div><div className="asset-value">{a.value}</div></div>))}
        </div>
      </div>
      <div className="input-area" style={{ marginTop: "1.5rem" }}>
        <label className="input-label">What do you need?</label>
        <textarea className="input-field" placeholder="e.g. write a speaker bio, draft a podcast pitch, create a LinkedIn post about the book..." value={task} onChange={(e) => setTask(e.target.value)} rows={4} />
        <button className="generate-btn" onClick={generate} disabled={loading || !task.trim()}>{loading ? "Working..." : "Generate →"}</button>
      </div>
      <GeneratorResult result={result} kind="Brand · Output" saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />
    </div>
  );
}

function IdeasModule({ saveToLibrary, scheduleItem }) {
  const [mode, setMode] = useState("coaching");
  const [seed, setSeed] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { (async () => { setSaved(await storageGet("savedIdeas", [])); setLoaded(true); })(); }, []);
  useEffect(() => { if (loaded) storageSet("savedIdeas", saved); }, [saved, loaded]);

  const modes = [
    { id: "coaching", label: "Coaching Angles" },
    { id: "niche", label: "Niche Content" },
    { id: "skool", label: "Grow Resilience Forge" },
    { id: "offer", label: "Offers & Challenges" },
  ];

  const baseVoice = `You are an ideas strategist for Travis Sanders — Master Barber (35+ years), Life Coaching Barber, Peer Advocate for Amputees, and Author of "The Architecture of Authority." 
His niche is resilience and discipline, taught through barbershop philosophy and his own comeback story (above-the-knee amputation in 2023, back to full-time work in 90 days). 
His Skool community is called Resilience Forge. His Instagram is @resilience_forge. His brand is Travis Talks Philosophy.
Travis's audience: men and people facing setbacks, people rebuilding, barbers, those who want discipline and grit. 
Generate ideas that are specific, original, and actionable — not generic. Number them. Keep each idea to 1-3 sentences with a clear hook.`;

  const skoolContext = `Skool growth levers to draw from when relevant: gamification (points, levels, leaderboards, public celebration of wins), a free-to-paid funnel (free community as lead magnet → paid tier), paid challenges priced $47–$197 as a "trust bridge," weekly live sessions and recurring rituals, the Classroom feature for structured courses/modules, rotating post types (wins, personal questions, tutorials, polls), and retention-first thinking. Tie ideas to Travis's resilience niche.`;

  async function generate() {
    setLoading(true); setResult("");
    const prompts = {
      coaching: `Give Travis 6 fresh coaching ideas — new angles, exercises, frameworks, or session themes he could use with clients on resilience and discipline.${seed ? ` Focus around: ${seed}.` : ""}`,
      niche: `Give Travis 6 fresh content ideas in his niche (resilience, discipline, barbershop wisdom, comeback stories) — for YouTube, Instagram @resilience_forge, or short-form. Make them specific and hook-driven.${seed ? ` Focus around: ${seed}.` : ""}`,
      skool: `${skoolContext}\n\nGive Travis 6 specific, actionable ideas to grow and energize his Skool community "Resilience Forge" — engagement moves, rituals, content, gamification, or funnel ideas.${seed ? ` Focus around: ${seed}.` : ""}`,
      offer: `${skoolContext}\n\nGive Travis 5 ideas for offers, paid challenges, or programs he could run inside or alongside Resilience Forge — built on his resilience/discipline niche. Include a rough format and why it would convert.${seed ? ` Focus around: ${seed}.` : ""}`,
    };
    try { setResult(await callClaude(baseVoice, prompts[mode])); }
    catch { setResult("Something went wrong. Try again."); }
    setLoading(false);
  }

  const pin = () => {
    if (!result) return;
    setSaved((s) => [...s, { id: Date.now(), mode: modes.find((m) => m.id === mode).label, text: result, date: new Date().toLocaleDateString() }]);
  };
  const unpin = (id) => setSaved((s) => s.filter((x) => x.id !== id));

  return (
    <div className="module-content">
      <div className="module-header"><h2>Idea Forge</h2><p>Fresh angles for coaching, your niche, and growing Resilience Forge.</p></div>
      <div className="type-tabs">
        {modes.map((m) => (
          <button key={m.id} className={`type-tab ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>
      <div className="input-area">
        <label className="input-label">Narrow it down? (optional)</label>
        <input className="input-field" placeholder="e.g. discipline for men, morning routines, comeback after failure, leaderboard ideas..." value={seed} onChange={(e) => setSeed(e.target.value)} />
        <button className="generate-btn" onClick={generate} disabled={loading}>{loading ? "Forging ideas..." : "Generate Ideas →"}</button>
      </div>

      {result && (
        <div className="result-card">
          <div className="result-label">{modes.find((m) => m.id === mode).label.toUpperCase()}</div>
          <div className="result-text">{result}</div>
          <div className="result-actions">
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(result)}>Copy</button>
            <button className="copy-btn" onClick={pin}>📌 Pin These Ideas</button>
            <button className="copy-btn" onClick={async () => { await saveToLibrary({ kind: `Idea · ${modes.find((m) => m.id === mode).label}`, text: result }); }}>Save to Library</button>
            <button className="copy-btn" onClick={async () => { await scheduleItem({ kind: `Idea · ${modes.find((m) => m.id === mode).label}`, text: result, date: new Date().toISOString().slice(0, 10) }); }}>🗓️ Schedule Today</button>
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className="section-label">PINNED IDEAS</div>
          <div className="notes-history">
            {saved.slice().reverse().map((s) => (
              <details key={s.id} className="note-entry">
                <summary><span className="note-date">{s.mode}</span> {s.date}<span className="task-remove" style={{ float: "right" }} onClick={(e) => { e.preventDefault(); unpin(s.id); }}>×</span></summary>
                <div className="note-prep">{s.text}</div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarModule({ scheduled, updateScheduled, removeScheduled, scheduleItem }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [view, setView] = useState("month");
  const [selected, setSelected] = useState(null);
  const [draftDate, setDraftDate] = useState(new Date().toISOString().slice(0, 10));
  const [draftKind, setDraftKind] = useState("Instagram");
  const [draftText, setDraftText] = useState("");

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const todayStr = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateKey = (d) => `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const itemsFor = (key) => scheduled.filter((s) => s.date === key);

  const prevMonth = () => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  const nextMonth = () => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });

  const kindColor = (kind) => {
    const k = kind.toLowerCase();
    if (k.includes("instagram") || k.includes("reel")) return "#c9a84c";
    if (k.includes("youtube")) return "#c0392b";
    if (k.includes("idea")) return "#5b8c5a";
    if (k.includes("book")) return "#7a6cc4";
    if (k.includes("brand")) return "#3b8ea5";
    return "#888";
  };

  const upcoming = scheduled.slice().filter((s) => s.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));

  const addManual = async () => {
    if (!draftText.trim()) return;
    await scheduleItem({ kind: `Content · ${draftKind}`, text: draftText.trim(), date: draftDate });
    setDraftText("");
  };

  return (
    <div className="module-content" style={{ maxWidth: "920px" }}>
      <div className="module-header"><h2>Content Calendar</h2><p>Everything you've scheduled — planned, then posted.</p></div>

      <div className="cal-view-tabs">
        <button className={`type-tab ${view === "month" ? "active" : ""}`} onClick={() => setView("month")}>Month</button>
        <button className={`type-tab ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>Upcoming List</button>
      </div>

      {view === "month" && (
        <>
          <div className="cal-nav">
            <button className="cal-arrow" onClick={prevMonth}>←</button>
            <div className="cal-month-label">{monthNames[cursor.m]} {cursor.y}</div>
            <button className="cal-arrow" onClick={nextMonth}>→</button>
          </div>
          <div className="cal-grid cal-weekdays">
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="cal-weekday">{d}</div>)}
          </div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="cal-cell empty" />;
              const key = dateKey(d);
              const items = itemsFor(key);
              const isToday = key === todayStr;
              return (
                <div key={i} className={`cal-cell ${isToday ? "today" : ""} ${selected === key ? "selected" : ""}`} onClick={() => { setSelected(key); setDraftDate(key); }}>
                  <div className="cal-daynum">{d}</div>
                  <div className="cal-dots">
                    {items.slice(0, 4).map((it) => <span key={it.id} className="cal-dot" style={{ background: kindColor(it.kind), opacity: it.status === "posted" ? 0.35 : 1 }} />)}
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="cal-day-detail">
              <div className="section-label">{selected}{selected === todayStr ? " · TODAY" : ""}</div>
              {itemsFor(selected).length === 0 && <div className="task-empty">Nothing scheduled.</div>}
              {itemsFor(selected).map((it) => (
                <div key={it.id} className={`cal-item ${it.status === "posted" ? "posted" : ""}`}>
                  <div className="cal-item-head">
                    <span className="cal-item-kind" style={{ color: kindColor(it.kind) }}>{it.kind}</span>
                    <div className="library-item-actions">
                      <span className="cal-status-toggle" onClick={() => updateScheduled(it.id, { status: it.status === "posted" ? "planned" : "posted" })}>
                        {it.status === "posted" ? "✓ Posted" : "Mark posted"}
                      </span>
                      <span className="task-remove" onClick={() => removeScheduled(it.id)}>×</span>
                    </div>
                  </div>
                  <div className="cal-item-text">{it.text}</div>
                </div>
              ))}

              <div className="cal-add">
                <div className="section-label" style={{ marginTop: "1rem" }}>QUICK ADD TO {selected}</div>
                <div className="cal-add-row">
                  <select className="input-field cal-kind-select" value={draftKind} onChange={(e) => setDraftKind(e.target.value)}>
                    {["Instagram","YouTube","Reel","Quote","Skool Post","Other"].map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <textarea className="input-field" rows={2} placeholder="Caption, hook, or note..." value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                <button className="generate-btn" onClick={addManual} disabled={!draftText.trim()}>Add to Calendar →</button>
              </div>
            </div>
          )}
        </>
      )}

      {view === "list" && (
        <div className="cal-list">
          {upcoming.length === 0 && <div className="task-empty" style={{ padding: "2rem 0" }}>Nothing upcoming. Schedule content from any module — or add it here on the Month view.</div>}
          {upcoming.map((it) => (
            <div key={it.id} className={`cal-item ${it.status === "posted" ? "posted" : ""}`}>
              <div className="cal-item-head">
                <span className="cal-item-kind" style={{ color: kindColor(it.kind) }}>{it.kind}</span>
                <div className="library-item-actions">
                  <span className="cal-date-badge">{it.date}</span>
                  <span className="cal-status-toggle" onClick={() => updateScheduled(it.id, { status: it.status === "posted" ? "planned" : "posted" })}>
                    {it.status === "posted" ? "✓ Posted" : "Mark posted"}
                  </span>
                  <span className="task-remove" onClick={() => removeScheduled(it.id)}>×</span>
                </div>
              </div>
              <div className="cal-item-text">{it.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryModule({ library, removeFromLibrary }) {
  const [filter, setFilter] = useState("all");
  const categories = ["all", ...Array.from(new Set(library.map((i) => i.kind.split(" · ")[0])))];
  const filtered = filter === "all" ? library : library.filter((i) => i.kind.startsWith(filter));

  return (
    <div className="module-content">
      <div className="module-header"><h2>Library</h2><p>Everything you've saved — across every module.</p></div>
      {library.length === 0 ? (
        <div className="task-empty" style={{ padding: "2rem 0" }}>Nothing saved yet. Generate content and hit "Save to Library."</div>
      ) : (
        <>
          <div className="type-tabs">
            {categories.map((c) => (<button key={c} className={`type-tab ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c === "all" ? "All" : c}</button>))}
          </div>
          <div className="library-list">
            {filtered.slice().reverse().map((item) => (
              <div key={item.id} className="library-item">
                <div className="library-item-head">
                  <span className="library-kind">{item.kind}</span>
                  <div className="library-item-actions">
                    <span className="library-date">{item.date}</span>
                    <span className="task-remove" onClick={() => removeFromLibrary(item.id)}>×</span>
                  </div>
                </div>
                <div className="library-text">{item.text}</div>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(item.text)}>Copy</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TravisAIOS() {
  const [activeModule, setActiveModule] = useState("home");
  const [library, setLibrary] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { (async () => {
    setLibrary(await storageGet("library", []));
    setScheduled(await storageGet("scheduled", []));
    setLoaded(true);
  })(); }, []);
  useEffect(() => { if (loaded) storageSet("library", library); }, [library, loaded]);
  useEffect(() => { if (loaded) storageSet("scheduled", scheduled); }, [scheduled, loaded]);

  const saveToLibrary = useCallback(async ({ kind, text }) => {
    const item = { id: Date.now(), kind, text, date: new Date().toLocaleDateString() };
    setLibrary((l) => [...l, item]);
  }, []);
  const removeFromLibrary = useCallback((id) => setLibrary((l) => l.filter((x) => x.id !== id)), []);

  const scheduleItem = useCallback(async ({ kind, text, date }) => {
    const item = { id: Date.now() + Math.random(), kind, text, date, status: "planned" };
    setScheduled((s) => [...s, item]);
  }, []);
  const updateScheduled = useCallback((id, patch) => setScheduled((s) => s.map((x) => x.id === id ? { ...x, ...patch } : x)), []);
  const removeScheduled = useCallback((id) => setScheduled((s) => s.filter((x) => x.id !== id)), []);

  const renderModule = () => {
    switch (activeModule) {
      case "home": return <HomeModule />;
      case "content": return <ContentModule saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />;
      case "coaching": return <CoachingModule />;
      case "brand": return <BrandModule saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />;
      case "advocacy": return <AdvocacyModule saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />;
      case "book": return <BookModule saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />;
      case "ideas": return <IdeasModule saveToLibrary={saveToLibrary} scheduleItem={scheduleItem} />;
      case "calendar": return <CalendarModule scheduled={scheduled} updateScheduled={updateScheduled} removeScheduled={removeScheduled} scheduleItem={scheduleItem} />;
      case "library": return <LibraryModule library={library} removeFromLibrary={removeFromLibrary} />;
      default: return <HomeModule />;
    }
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#0a0a0a", minHeight: "100vh", display: "flex", color: "#e8e0d0", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cursor { animation: blink 1s step-end infinite; color: #c9a84c; }
        @keyframes blink { 50% { opacity: 0; } }

        .sidebar { width: 220px; min-width: 220px; background: #111; border-right: 1px solid #222; display: flex; flex-direction: column; padding: 2rem 0; z-index: 10; }
        .logo-area { padding: 0 1.5rem 2rem; border-bottom: 1px solid #222; }
        .logo-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 900; color: #c9a84c; letter-spacing: 0.02em; line-height: 1.3; }
        .logo-sub { font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; color: #555; margin-top: 0.3rem; letter-spacing: 0.1em; text-transform: uppercase; }
        .nav-items { padding: 1.5rem 0; flex: 1; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; color: #666; letter-spacing: 0.05em; transition: all 0.2s; border-left: 2px solid transparent; }
        .nav-item:hover { color: #e8e0d0; background: #161616; }
        .nav-item.active { color: #c9a84c; border-left-color: #c9a84c; background: #161616; }
        .nav-icon { font-size: 1rem; }
        .sidebar-footer { padding: 1.5rem; border-top: 1px solid #222; font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; color: #444; letter-spacing: 0.05em; }
        .main-content { flex: 1; overflow-y: auto; padding: 2.5rem; background: #0a0a0a; }

        .home-module { max-width: 900px; }
        .welcome-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
        .date-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: #555; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.4rem; }
        .welcome-heading { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: #e8e0d0; }
        .accent { color: #c9a84c; }
        .next-quote-btn { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: #c9a84c; cursor: pointer; letter-spacing: 0.05em; padding: 0.5rem 1rem; border: 1px solid #333; border-radius: 2px; transition: all 0.2s; }
        .next-quote-btn:hover { background: #1a1a1a; }
        .quote-card { background: #111; border: 1px solid #222; border-left: 3px solid #c9a84c; padding: 2rem; margin-bottom: 2rem; position: relative; min-height: 100px; }
        .quote-mark { font-family: 'Playfair Display', serif; font-size: 4rem; color: #c9a84c; opacity: 0.3; position: absolute; top: 0.5rem; left: 1rem; line-height: 1; }
        .quote-text { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: #d4c9b0; line-height: 1.7; padding-left: 1rem; font-style: italic; }
        .quote-source { font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; color: #555; margin-top: 1rem; padding-left: 1rem; letter-spacing: 0.05em; }

        .planner-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
        .planner-col { background: #111; border: 1px solid #222; padding: 1.25rem; }
        .intention-field { margin-top: 0.5rem; }
        .save-note { font-family: 'IBM Plex Mono', monospace; font-size: 0.6rem; color: #444; margin-top: 0.4rem; letter-spacing: 0.05em; }
        .task-input-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .task-add-btn { background: #c9a84c; color: #0a0a0a; border: none; width: 40px; font-size: 1.2rem; cursor: pointer; font-weight: bold; }
        .task-add-btn:hover { background: #e0bc5a; }
        .task-list { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
        .task-empty { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: #444; }
        .task-item { display: flex; align-items: center; gap: 0.6rem; font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; color: #c8bfa8; padding: 0.3rem 0; }
        .task-item.done .task-text { text-decoration: line-through; color: #555; }
        .task-check { cursor: pointer; color: #c9a84c; min-width: 14px; }
        .task-text { flex: 1; }
        .task-remove { cursor: pointer; color: #555; font-size: 1.1rem; }
        .task-remove:hover { color: #c0392b; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .stat-card { background: #111; border: 1px solid #222; padding: 1.25rem; text-align: center; }
        .stat-value { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: #c9a84c; }
        .stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; color: #555; margin-top: 0.4rem; letter-spacing: 0.05em; text-transform: uppercase; }

        .section-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; color: #555; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 0.75rem; }

        .module-content { max-width: 800px; }
        .module-header { margin-bottom: 2rem; }
        .module-header h2 { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: #e8e0d0; margin-bottom: 0.4rem; }
        .module-header p { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #555; letter-spacing: 0.05em; }

        .type-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .type-tab { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; padding: 0.5rem 1rem; background: #111; border: 1px solid #222; color: #666; cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .type-tab:hover { color: #e8e0d0; border-color: #444; }
        .type-tab.active { background: #1a1500; border-color: #c9a84c; color: #c9a84c; }

        .input-area { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; color: #666; letter-spacing: 0.08em; text-transform: uppercase; }
        .input-field { background: #0d0d0d; border: 1px solid #222; color: #e8e0d0; padding: 0.85rem 1rem; font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; resize: vertical; outline: none; transition: border-color 0.2s; width: 100%; }
        .input-field:focus { border-color: #c9a84c; }
        .input-field option { background: #111; }
        .generate-btn { align-self: flex-start; margin-top: 0.5rem; padding: 0.75rem 2rem; background: #c9a84c; color: #0a0a0a; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; font-weight: 500; letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s; }
        .generate-btn:hover { background: #e0bc5a; }
        .generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .result-card { margin-top: 1.5rem; background: #0f0f0f; border: 1px solid #2a2a2a; border-left: 3px solid #c9a84c; padding: 1.5rem; animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .result-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; color: #c9a84c; letter-spacing: 0.15em; margin-bottom: 0.75rem; }
        .result-text { font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; color: #c8bfa8; line-height: 1.8; white-space: pre-wrap; }
        .result-actions { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
        .copy-btn { padding: 0.5rem 1rem; background: transparent; border: 1px solid #333; color: #666; font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .copy-btn:hover { border-color: #c9a84c; color: #c9a84c; }

        .frameworks-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .framework-item { display: flex; align-items: flex-start; gap: 1rem; padding: 0.85rem 1rem; background: #111; border: 1px solid #1e1e1e; font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; color: #888; line-height: 1.5; }
        .framework-num { font-size: 0.65rem; color: #c9a84c; min-width: 20px; letter-spacing: 0.05em; }
        .accent-dot { font-size: 1.2rem; line-height: 1; }

        .client-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; align-items: center; }
        .client-chip { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; padding: 0.5rem 0.9rem; background: #111; border: 1px solid #222; color: #888; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.4rem; }
        .client-chip:hover { border-color: #444; }
        .client-chip.active { background: #1a1500; border-color: #c9a84c; color: #c9a84c; }
        .chip-count { background: #c9a84c; color: #0a0a0a; border-radius: 8px; padding: 0 0.4rem; font-size: 0.6rem; }
        .client-add-input { background: #0d0d0d; border: 1px dashed #333; color: #c9a84c; padding: 0.5rem 0.9rem; font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; outline: none; width: 130px; }
        .client-add-input:focus { border-color: #c9a84c; }

        .notes-history { display: flex; flex-direction: column; gap: 0.5rem; }
        .note-entry { background: #111; border: 1px solid #1e1e1e; padding: 0.85rem 1rem; }
        .note-entry summary { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #c8bfa8; cursor: pointer; }
        .note-date { color: #c9a84c; margin-right: 0.5rem; }
        .note-prep { font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; color: #998f78; line-height: 1.7; white-space: pre-wrap; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #1e1e1e; }

        .brand-assets { margin-bottom: 0.5rem; }
        .assets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.5rem; }
        .asset-card { background: #111; border: 1px solid #1e1e1e; padding: 1rem; }
        .asset-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.6rem; color: #555; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.35rem; }
        .asset-value { font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: #c9a84c; }

        .library-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .library-item { background: #111; border: 1px solid #222; border-left: 3px solid #c9a84c; padding: 1.25rem; }
        .library-item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .library-kind { font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; color: #c9a84c; letter-spacing: 0.1em; }
        .library-item-actions { display: flex; align-items: center; gap: 0.75rem; }
        .library-date { font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; color: #555; }
        .library-text { font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: #c8bfa8; line-height: 1.7; white-space: pre-wrap; margin-bottom: 0.75rem; }

        .schedule-inline { display: inline-flex; align-items: center; gap: 0.4rem; }
        .schedule-date { background: #0d0d0d; border: 1px solid #333; color: #c9a84c; font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; padding: 0.35rem 0.5rem; outline: none; }
        .schedule-confirm { border-color: #c9a84c; color: #c9a84c; }

        .cal-view-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .cal-nav { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 1rem; }
        .cal-arrow { background: #111; border: 1px solid #333; color: #c9a84c; width: 36px; height: 36px; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
        .cal-arrow:hover { background: #1a1500; }
        .cal-month-label { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: #e8e0d0; min-width: 200px; text-align: center; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-weekdays { margin-bottom: 4px; }
        .cal-weekday { text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; color: #555; letter-spacing: 0.1em; padding: 0.3rem 0; }
        .cal-cell { background: #111; border: 1px solid #1e1e1e; min-height: 64px; padding: 0.4rem; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; }
        .cal-cell:hover { border-color: #444; background: #161616; }
        .cal-cell.empty { background: transparent; border: none; cursor: default; }
        .cal-cell.today { border-color: #c9a84c; }
        .cal-cell.selected { background: #1a1500; border-color: #c9a84c; }
        .cal-daynum { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: #888; }
        .cal-cell.today .cal-daynum { color: #c9a84c; font-weight: bold; }
        .cal-dots { display: flex; flex-wrap: wrap; gap: 3px; margin-top: auto; }
        .cal-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

        .cal-day-detail { margin-top: 1.5rem; background: #0f0f0f; border: 1px solid #2a2a2a; padding: 1.25rem; }
        .cal-item { background: #111; border: 1px solid #1e1e1e; border-left: 3px solid #c9a84c; padding: 0.85rem 1rem; margin-bottom: 0.5rem; }
        .cal-item.posted { opacity: 0.55; border-left-color: #444; }
        .cal-item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; gap: 0.5rem; }
        .cal-item-kind { font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; letter-spacing: 0.08em; }
        .cal-item-text { font-family: 'IBM Plex Mono', monospace; font-size: 0.76rem; color: #c8bfa8; line-height: 1.6; white-space: pre-wrap; }
        .cal-status-toggle { font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; color: #5b8c5a; cursor: pointer; letter-spacing: 0.05em; white-space: nowrap; }
        .cal-status-toggle:hover { color: #7ab079; }
        .cal-date-badge { font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; color: #c9a84c; }
        .cal-add-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
        .cal-kind-select { width: auto; }
        .cal-list { display: flex; flex-direction: column; gap: 0.5rem; }
      `}</style>

      <div className="sidebar">
        <div className="logo-area">
          <div className="logo-title">Travis Talks<br />Philosophy</div>
          <div className="logo-sub">AI Operating System</div>
        </div>
        <nav className="nav-items">
          {modules.map((m) => (
            <div key={m.id} className={`nav-item ${activeModule === m.id ? "active" : ""}`} onClick={() => setActiveModule(m.id)}>
              <span className="nav-icon">{m.icon}</span><span>{m.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">v4.0 · Calendar<br />@resilience_forge</div>
      </div>

      <main className="main-content">{renderModule()}</main>
    </div>
  );
}
