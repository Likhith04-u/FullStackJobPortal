import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness, Search, MapPin, Clock3, Building2, GraduationCap,
  LogOut, UserRound, Plus, Pencil, Trash2, FileText, LayoutDashboard,
  ArrowRight, CheckCircle2, X, Menu, LoaderCircle
} from "lucide-react";

const API = "http://localhost:5000/api";
const emptyJob = { title: "", company: "", location: "", type: "Full-time", salary: "", description: "", requirements: "" };
const readToken = () => localStorage.getItem("jobPortalToken") || "";

async function api(path, options = {}) {
  const token = readToken();
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function App() {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("jobPortalUser") || "null"); } catch { return null; }
  });
  const [page, setPage] = useState("jobs");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "student", company: "" });
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [editingJob, setEditingJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState({ name: "", phone: "", location: "", skills: "", education: "", experience: "", company: "", bio: "" });
  const [coverLetter, setCoverLetter] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const isLoggedIn = Boolean(token && user);
  const isStudent = user?.role === "student";
  const isRecruiter = user?.role === "recruiter";

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    loadProfile();
    if (user.role === "student") loadApplications();
    if (user.role === "recruiter") loadReceived();
  }, [token, user?.id, user?.role]);

  async function loadJobs() {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter !== "All") params.set("type", typeFilter);
      if (locationFilter.trim()) params.set("location", locationFilter.trim());
      const result = await api(`/jobs?${params.toString()}`);
      setJobs(result.jobs || []);
    } catch (err) { setNotice(err.message); }
  }

  async function loadProfile() {
    try {
      const result = await api("/profile");
      const p = result.profile;
      setProfile({
        name: p.name || "", phone: p.phone || "", location: p.location || "",
        skills: (p.skills || []).join(", "), education: p.education || "",
        experience: p.experience || "", company: p.company || "", bio: p.bio || ""
      });
    } catch (err) { setNotice(err.message); }
  }

  async function loadApplications() {
    try { setApplications((await api("/applications/mine")).applications || []); }
    catch (err) { setNotice(err.message); }
  }

  async function loadReceived() {
    try { setApplications((await api("/applications/received")).applications || []); }
    catch (err) { setNotice(err.message); }
  }

  async function submitAuth(e) {
    e.preventDefault();
    setBusy(true); setAuthError("");
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const result = await api(path, { method: "POST", body: JSON.stringify(authForm) });
      localStorage.setItem("jobPortalToken", result.token);
      localStorage.setItem("jobPortalUser", JSON.stringify(result.user));
      setToken(result.token); setUser(result.user);
      setPage(result.user.role === "recruiter" ? "manage" : "jobs");
      setNotice(`Welcome, ${result.user.name}!`);
    } catch (err) { setAuthError(err.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("jobPortalToken");
    localStorage.removeItem("jobPortalUser");
    setToken(""); setUser(null); setApplications([]);
    setPage("jobs"); setSelectedJob(null); setNotice("You have been logged out.");
  }

  async function saveProfile(e) {
    e.preventDefault(); setBusy(true);
    try {
      const result = await api("/profile", { method: "PUT", body: JSON.stringify({ ...profile, skills: profile.skills }) });
      const nextUser = { ...user, name: result.profile.name };
      setUser(nextUser); localStorage.setItem("jobPortalUser", JSON.stringify(nextUser));
      setNotice("Profile saved successfully.");
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }

  async function saveJob(e) {
    e.preventDefault(); setBusy(true);
    try {
      const path = editingJob ? `/jobs/${editingJob}` : "/jobs";
      const result = await api(path, { method: editingJob ? "PUT" : "POST", body: JSON.stringify(jobForm) });
      setNotice(result.message); setJobForm(emptyJob); setEditingJob(null);
      await loadJobs(); setPage("manage");
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }

  function startEdit(job) {
    setJobForm({
      title: job.title || "", company: job.company || "", location: job.location || "",
      type: job.type || "Full-time", salary: job.salary || "", description: job.description || "",
      requirements: job.requirements || ""
    });
    setEditingJob(job._id); setPage("post");
  }

  async function deleteJob(job) {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      const result = await api(`/jobs/${job._id}`, { method: "DELETE" });
      setNotice(result.message); await loadJobs();
    } catch (err) { setNotice(err.message); }
  }

  async function applyToJob(jobId) {
    try {
      const result = await api("/applications", { method: "POST", body: JSON.stringify({ jobId, coverLetter }) });
      setNotice(result.message); setCoverLetter(""); setSelectedJob(null); await loadApplications();
    } catch (err) { setNotice(err.message); }
  }

  async function updateStatus(applicationId, status) {
    try {
      const result = await api(`/applications/${applicationId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(result.message); await loadReceived();
    } catch (err) { setNotice(err.message); }
  }

  const myJobs = useMemo(() => jobs.filter(j => j.recruiter?._id === user?.id || j.recruiter === user?.id), [jobs, user]);
  const filteredJobs = jobs;

  const navItems = [
    { id: "jobs", label: "Find jobs", icon: Search, show: true },
    { id: "applications", label: isRecruiter ? "Applicants" : "My applications", icon: FileText, show: isLoggedIn },
    { id: "manage", label: "Manage jobs", icon: BriefcaseBusiness, show: isRecruiter },
    { id: "post", label: "Post a job", icon: Plus, show: isRecruiter },
    { id: "profile", label: "My profile", icon: UserRound, show: isLoggedIn }
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={e => { e.preventDefault(); setPage("jobs"); }}>
          <span className="brand-mark"><BriefcaseBusiness size={21}/></span>
          <span>Career<span className="brand-accent">Spring</span><small>YOUR NEXT CHAPTER STARTS HERE</small></span>
        </a>
        <button className="mobile-toggle icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu/></button>
        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          {navItems.filter(n => n.show).map(n => {
            const Icon = n.icon;
            return <button key={n.id} className={page === n.id ? "nav-link active" : "nav-link"} onClick={() => { setPage(n.id); setMobileMenu(false); setSelectedJob(null); }}>
              <Icon size={16}/>{n.label}
            </button>;
          })}
        </nav>
        <div className="top-actions">
          {isLoggedIn ? <><span className="user-chip"><span className="avatar">{user.name?.[0]?.toUpperCase()}</span><span>{user.name}<small>{user.role}</small></span></span><button className="btn btn-ghost btn-small" onClick={logout}><LogOut size={15}/> Logout</button></> :
            <><button className="btn btn-ghost btn-small" onClick={() => { setAuthMode("login"); setPage("auth"); }}>Log in</button><button className="btn btn-primary btn-small" onClick={() => { setAuthMode("register"); setPage("auth"); }}>Get started <ArrowRight size={15}/></button></>}
        </div>
      </header>

      {notice && <div className="toast" role="status"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}

      <main>
        {page === "jobs" && <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot"/> THE FUTURE OF WORK STARTS HERE</div>
              <h1>Find work that<br/><em>moves you forward.</em></h1>
              <p>Discover opportunities that match your ambition. Your next great career story starts with one search.</p>
              <div className="hero-stats"><div><strong>{jobs.length}+</strong><span>Open roles</span></div><div><strong>2</strong><span>Ways to grow</span></div><div><strong>24/7</strong><span>Explore anytime</span></div></div>
            </div>
            <div className="hero-art">
              <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
              <div className="art-card main-art-card"><div className="art-card-top"><span className="mini-logo"><BriefcaseBusiness size={18}/></span><span className="pill pill-green">Hiring now</span></div><div className="art-lines"><i/><i/><i/></div><div className="art-bottom"><span className="art-avatar">CS</span><span><b>Career opportunity</b><small>Make your next move</small></span><ArrowRight size={19}/></div></div>
              <div className="floating-note note-top"><span className="note-icon"><CheckCircle2 size={18}/></span><span><b>New opportunities</b><small>Waiting for you</small></span></div>
              <div className="floating-note note-bottom"><span className="note-number">01</span><span><b>Your next chapter</b><small>Starts right here</small></span></div>
              <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div>
            </div>
          </section>

          <section className="search-panel">
            <div className="search-field"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadJobs()} placeholder="Job title, company, or keyword"/></div>
            <div className="search-field"><MapPin size={19}/><input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} onKeyDown={e => e.key === "Enter" && loadJobs()} placeholder="City or remote"/></div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="Job type"><option>All</option><option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option></select>
            <button className="btn btn-primary search-button" onClick={loadJobs}><Search size={17}/> Search jobs</button>
          </section>

          <section className="content-section">
            <div className="section-heading"><div><div className="eyebrow">CURATED FOR YOUR NEXT MOVE</div><h2>Explore opportunities</h2><p>Roles from teams looking for fresh perspectives.</p></div><span className="result-count">{filteredJobs.length} jobs found</span></div>
            {filteredJobs.length ? <div className="job-grid">{filteredJobs.map(job => <article className="job-card" key={job._id}>
              <div className="job-card-head"><div className="company-logo">{(job.company || "C").slice(0, 1).toUpperCase()}</div><button className="icon-button subtle" onClick={() => setSelectedJob(job)} aria-label="View job"><ArrowRight size={18}/></button></div>
              <div className="job-type">{job.type}</div><h3>{job.title}</h3><div className="company-name"><Building2 size={15}/>{job.company}</div>
              <div className="job-meta"><span><MapPin size={14}/>{job.location}</span><span><Clock3 size={14}/>{job.salary || "Salary not specified"}</span></div>
              <p className="job-description">{job.description}</p>
              <div className="job-card-footer"><span className="posted-date">Posted {new Date(job.createdAt).toLocaleDateString()}</span><button className="text-button" onClick={() => setSelectedJob(job)}>View details <ArrowRight size={15}/></button></div>
            </article>)}</div> : <div className="empty-state"><div className="empty-icon"><Search size={25}/></div><h3>No jobs found yet</h3><p>Try another keyword or location, or check back soon for new opportunities.</p>{isRecruiter && <button className="btn btn-primary" onClick={() => setPage("post")}><Plus size={16}/> Post the first job</button>}</div>}
          </section>
        </>}

        {page === "auth" && <section className="auth-layout"><div className="auth-aside"><div className="eyebrow">YOUR CAREER, REIMAGINED</div><h1>Big things<br/>start with <em>one step.</em></h1><p>Join a community of students and recruiters building what comes next.</p><div className="auth-check"><CheckCircle2/> Discover opportunities that fit your goals</div><div className="auth-check"><CheckCircle2/> Connect talent with teams that care</div></div><form className="auth-card" onSubmit={submitAuth}>
          <div className="auth-card-heading"><span className="brand-mark"><BriefcaseBusiness size={20}/></span><div><h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2><p>{authMode === "login" ? "Log in to continue your journey." : "A better opportunity starts here."}</p></div></div>
          {authMode === "register" && <label>Full name<input required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} placeholder="Your full name"/></label>}
          <label>Email address<input required type="email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} placeholder="you@example.com"/></label>
          <label>Password<input required type="password" minLength={8} value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="At least 8 characters"/></label>
          {authMode === "register" && <><label>I am joining as<select value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value})}><option value="student">Student / Job seeker</option><option value="recruiter">Recruiter</option></select></label>{authForm.role === "recruiter" && <label>Company name<input value={authForm.company} onChange={e => setAuthForm({...authForm, company: e.target.value})} placeholder="Your company"/></label>}</>}
          {authError && <div className="form-error">{authError}</div>}
          <button className="btn btn-primary full-width" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null}{authMode === "login" ? "Log in to your account" : "Create account"} <ArrowRight size={16}/></button>
          <p className="auth-switch">{authMode === "login" ? "New to CareerSpring?" : "Already have an account?"} <button type="button" onClick={() => {setAuthMode(authMode === "login" ? "register" : "login");setAuthError("");}}> {authMode === "login" ? "Create account" : "Log in"}</button></p>
        </form></section>}

        {page === "profile" && <section className="form-page"><div className="section-heading"><div><div className="eyebrow">YOUR DETAILS</div><h2>My profile</h2><p>Keep your information up to date.</p></div></div><form className="panel-form" onSubmit={saveProfile}>
          <div className="form-grid"><label>Full name<input required value={profile.name} onChange={e => setProfile({...profile,name:e.target.value})}/></label><label>Email address<input disabled value={user?.email || ""}/></label><label>Phone<input value={profile.phone} onChange={e => setProfile({...profile,phone:e.target.value})} placeholder="Phone number"/></label><label>Location<input value={profile.location} onChange={e => setProfile({...profile,location:e.target.value})} placeholder="City, country"/></label>
          {isStudent ? <><label>Skills <span className="label-help">(comma separated)</span><input value={profile.skills} onChange={e => setProfile({...profile,skills:e.target.value})} placeholder="React, JavaScript, SQL"/></label><label>Education<input value={profile.education} onChange={e => setProfile({...profile,education:e.target.value})} placeholder="Degree / university"/></label><label>Experience<input value={profile.experience} onChange={e => setProfile({...profile,experience:e.target.value})} placeholder="Internships or work experience"/></label></> : <label>Company<input value={profile.company} onChange={e => setProfile({...profile,company:e.target.value})} placeholder="Company name"/></label>}
          <label className="full-span">About you<textarea rows="4" value={profile.bio} onChange={e => setProfile({...profile,bio:e.target.value})} placeholder="A short introduction..."/></label></div><button className="btn btn-primary" disabled={busy}>Save profile <CheckCircle2 size={16}/></button>
        </form></section>}

        {page === "post" && isRecruiter && <section className="form-page"><div className="section-heading"><div><div className="eyebrow">GROW YOUR TEAM</div><h2>{editingJob ? "Edit job listing" : "Post a new job"}</h2><p>Share the opportunity with candidates ready to make an impact.</p></div></div><form className="panel-form" onSubmit={saveJob}>
          <div className="form-grid"><label>Job title *<input required value={jobForm.title} onChange={e => setJobForm({...jobForm,title:e.target.value})} placeholder="e.g. Frontend Developer"/></label><label>Company *<input required value={jobForm.company} onChange={e => setJobForm({...jobForm,company:e.target.value})} placeholder="Company name"/></label><label>Location *<input required value={jobForm.location} onChange={e => setJobForm({...jobForm,location:e.target.value})} placeholder="Bengaluru / Remote"/></label><label>Job type<select value={jobForm.type} onChange={e => setJobForm({...jobForm,type:e.target.value})}><option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option></select></label><label>Salary / stipend<input value={jobForm.salary} onChange={e => setJobForm({...jobForm,salary:e.target.value})} placeholder="e.g. ₹5–8 LPA"/></label><label>Requirements<input value={jobForm.requirements} onChange={e => setJobForm({...jobForm,requirements:e.target.value})} placeholder="Skills and qualifications"/></label><label className="full-span">Job description *<textarea required rows="6" value={jobForm.description} onChange={e => setJobForm({...jobForm,description:e.target.value})} placeholder="Describe the role, responsibilities and team..."/></label></div><div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => {setJobForm(emptyJob);setEditingJob(null);setPage("manage");}}>Cancel</button><button className="btn btn-primary" disabled={busy}>{editingJob ? "Save changes" : "Publish job"} <ArrowRight size={16}/></button></div>
        </form></section>}

        {page === "manage" && isRecruiter && <section className="content-section standalone"><div className="section-heading"><div><div className="eyebrow">RECRUITER WORKSPACE</div><h2>Manage your jobs</h2><p>Edit listings and keep your opportunities up to date.</p></div><button className="btn btn-primary" onClick={() => {setJobForm(emptyJob);setEditingJob(null);setPage("post");}}><Plus size={17}/> Post a job</button></div>
          <div className="manage-list">{filteredJobs.filter(j => j.recruiter?._id === user?.id || j.recruiter === user?.id).map(job => <article className="manage-row" key={job._id}><div className="company-logo"><BriefcaseBusiness/></div><div className="manage-main"><h3>{job.title}</h3><p>{job.company} · {job.location} · {job.type}</p><small>Posted {new Date(job.createdAt).toLocaleDateString()}</small></div><div className="manage-actions"><button className="btn btn-ghost btn-small" onClick={() => startEdit(job)}><Pencil size={15}/> Edit</button><button className="btn btn-danger btn-small" onClick={() => deleteJob(job)}><Trash2 size={15}/> Delete</button></div></article>)}
          {!filteredJobs.some(j => j.recruiter?._id === user?.id || j.recruiter === user?.id) && <div className="empty-state"><div className="empty-icon"><BriefcaseBusiness/></div><h3>No listings yet</h3><p>Your job posts will appear here.</p><button className="btn btn-primary" onClick={() => setPage("post")}><Plus size={16}/> Create a listing</button></div>}</div>
        </section>}

        {page === "applications" && <section className="content-section standalone"><div className="section-heading"><div><div className="eyebrow">{isRecruiter ? "YOUR CANDIDATES" : "YOUR CAREER JOURNEY"}</div><h2>{isRecruiter ? "Applications received" : "My applications"}</h2><p>{isRecruiter ? "Review candidates and update their application status." : "Follow every opportunity you have applied for."}</p></div><span className="result-count">{applications.length} applications</span></div>
          {applications.length ? <div className="application-list">{applications.map(app => <article className="application-card" key={app._id}><div className="company-logo"><FileText/></div><div className="application-main"><h3>{app.job?.title || "Job listing"}</h3><p>{app.job?.company || "Company"} · {app.job?.location || ""}</p>{isRecruiter && <div className="candidate-info"><b>{app.student?.name}</b><span>{app.student?.email}</span>{app.student?.phone && <span>{app.student.phone}</span>}<span>{app.student?.skills?.join(", ")}</span></div>}<small>Applied {new Date(app.createdAt).toLocaleDateString()}</small></div><div className="application-side"><span className={`status status-${(app.status || "Applied").toLowerCase().replaceAll(" ","-")}`}>{app.status}</span>{isRecruiter && <label className="status-select">Update status<select value={app.status} onChange={e => updateStatus(app._id,e.target.value)}><option>Applied</option><option>Under Review</option><option>Shortlisted</option><option>Rejected</option><option>Hired</option></select></label>}</div></article>)}</div> : <div className="empty-state"><div className="empty-icon"><FileText/></div><h3>{isRecruiter ? "No applications received" : "Your story starts with an application"}</h3><p>{isRecruiter ? "When students apply to your jobs, they will show up here." : "Explore open roles and apply to start tracking your progress here."}</p><button className="btn btn-primary" onClick={() => setPage(isRecruiter ? "manage" : "jobs")}>{isRecruiter ? "Manage jobs" : "Explore jobs"} <ArrowRight size={16}/></button></div>}
        </section>}
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#" onClick={e => {e.preventDefault();setPage("jobs");}}><span className="brand-mark"><BriefcaseBusiness size={18}/></span><span>Career<span className="brand-accent">Spring</span></span></a><p>Connecting ambition with opportunity.</p><span>© {new Date().getFullYear()} CareerSpring · Full Stack Job Portal</span></footer>

      {selectedJob && <div className="modal-backdrop" onMouseDown={e => {if (e.target === e.currentTarget) setSelectedJob(null);}}><section className="job-modal" role="dialog" aria-modal="true" aria-label="Job details"><button className="modal-close icon-button" onClick={() => setSelectedJob(null)} aria-label="Close"><X/></button><div className="company-logo large">{(selectedJob.company || "C").slice(0,1).toUpperCase()}</div><span className="job-type">{selectedJob.type}</span><h2>{selectedJob.title}</h2><div className="company-name"><Building2 size={16}/>{selectedJob.company}</div><div className="job-meta modal-meta"><span><MapPin size={15}/>{selectedJob.location}</span><span><Clock3 size={15}/>{selectedJob.salary || "Salary not specified"}</span></div><div className="modal-divider"/><h3>About this role</h3><p className="modal-description">{selectedJob.description}</p>{selectedJob.requirements && <><h3>Requirements</h3><p className="modal-description">{selectedJob.requirements}</p></>}{isStudent && <label className="cover-label">Cover letter (optional)<textarea rows="3" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Tell the recruiter why you're a good fit..."/></label>}{!isLoggedIn ? <button className="btn btn-primary full-width" onClick={() => {setSelectedJob(null);setAuthMode("login");setPage("auth");}}>Log in to apply <ArrowRight size={16}/></button> : isStudent ? <button className="btn btn-primary full-width" onClick={() => applyToJob(selectedJob._id)}>Apply for this job <ArrowRight size={16}/></button> : <p className="modal-hint">Student accounts can apply for this position.</p>}</section></div>}
    </div>
  );
}

export default App;
