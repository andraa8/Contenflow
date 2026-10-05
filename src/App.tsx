import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import {
  ChevronRight,
  CirclePlus,
  Filter,
  Hash,
  LayoutDashboard,
  Lightbulb,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  X,
  MessageCircle,
  Menu,
  Users,
  BarChart3,
  FileText,
  Megaphone,
} from 'lucide-react';

type Status = 'Draft' | 'Done' | 'Post';
type EngagementStatus = 'Belum dibalas' | 'Follow up' | 'Selesai';
type EngagementType = 'Inbox' | 'Komentar' | 'Comment' | 'DM' | 'Mention' | 'Question' | 'Complaint' | 'Inquiry';

type FollowerRecord = { id: string; account: Account; currentFollowers: number; newFollowers: number; updatedAt?: string };
type FollowerChange = { id: string; account: Account; change: number; updatedAt: string; month?: string; currentFollowers?: number };
type EngagementRecord = { id: string; contentId?: string; account: Account | ''; senderName?: string; type: EngagementType; message: string; link?: string; status: EngagementStatus; note: string; createdAt: string; date?: string };
type EngagementMetric = { id: string; account: Account; month: string; reach: number; interactions: number; profileVisits: number; updatedAt?: string };
type YoutubeEngagement = { id: string; account: 'Youtube'; month: string; views: number; impressions: number; ctrImpression: number; updatedAt?: string };
type AdPerformance = { id: string; account: AdAccount; month: string; adNumber: number; awarenessReach: number; awarenessInteractions: number; awarenessVisits: number; awarenessNewFollowers: number; salesReach: number; salesClicks: number; updatedAt?: string };
type AdAccount = 'Facebook' | 'IG gsaindonesia' | 'TikTok';
const adAccounts: AdAccount[] = ['Facebook', 'IG gsaindonesia', 'TikTok'];
type ContentType = 'Perusahaan' | 'Produk' | 'Umum';
type Product = 'ACP' | 'WPC' | 'CCB' | 'SPC Flooring' | 'Flexible Stone' | 'Sealant';
type Account =
  | 'Facebook'
  | 'TikTok'
  | 'IG gsaindonesia'
  | 'IG acpgoodsense'
  | 'IG acpgrh'
  | 'IG sealantgrh'
  | 'Youtube';

type Content = {
  id: string;
  title: string;
  caption: string;
  date: string;
  platform: string;
  status: Status;
  contentType: ContentType;
  products: Product[];
  format: string;
};

type Idea = {
  id: string;
  text: string;
  pillar: string;
  createdAt: string;
  links: string[];
};

const accounts: Account[] = [
  'Facebook',
  'TikTok',
  'IG gsaindonesia',
  'IG acpgoodsense',
  'IG acpgrh',
  'IG sealantgrh',
  'Youtube',
];

const statuses: Status[] = ['Draft', 'Done', 'Post'];
const contentTypes: ContentType[] = ['Perusahaan', 'Produk', 'Umum'];
const products: Product[] = ['ACP', 'WPC', 'CCB', 'SPC Flooring', 'Flexible Stone', 'Sealant'];

const statusStyles: Record<Status, string> = {
  Draft: 'bg-amber-50 text-amber-700',
  Done: 'bg-emerald-50 text-emerald-700',
  Post: 'bg-sky-50 text-sky-700',
};

const accountStyles: Record<Account, string> = {
  Facebook: 'bg-indigo-50 text-indigo-700',
  TikTok: 'bg-slate-100 text-slate-800',
  'IG gsaindonesia': 'bg-pink-50 text-pink-700',
  'IG acpgoodsense': 'bg-pink-50 text-pink-700',
  'IG acpgrh': 'bg-pink-50 text-pink-700',
  'IG sealantgrh': 'bg-pink-50 text-pink-700',
  Youtube: 'bg-red-50 text-red-700',
};

function formatDate(date: string) {
  if (!date) return '';
  const parsed = new Date(date + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function App() {
  const [view, setView] = useState<'Overview' | 'Dashboard' | 'Ideas' | 'Post' | 'Engagement' | 'Followers' | 'Performa Iklan'>('Overview');
  const [overviewMonth, setOverviewMonth] = useState(() => { const now = new Date(); return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'); });
  const [followers, setFollowers] = useState<FollowerRecord[]>([]);
  const [followerChanges, setFollowerChanges] = useState<FollowerChange[]>([]);
  const [engagements, setEngagements] = useState<EngagementRecord[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetric[]>([]);
  const [youtubeEngagement, setYoutubeEngagement] = useState<YoutubeEngagement[]>([]);
  const [selectedYoutubeMetric, setSelectedYoutubeMetric] = useState<YoutubeEngagement | null>(null);
  const [adPerformances, setAdPerformances] = useState<AdPerformance[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<EngagementMetric | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Content | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | Status>('All');
  const [showComposer, setShowComposer] = useState(false);
  const [showIdeaComposer, setShowIdeaComposer] = useState(false);
  const [newIdea, setNewIdea] = useState('');
  const [newIdeaLinks, setNewIdeaLinks] = useState<string[]>([]);
  const [publicIdeaText, setPublicIdeaText] = useState('');
  const [publicIdeaLink, setPublicIdeaLink] = useState('');
  const [postedStartDate, setPostedStartDate] = useState('');
  const [postedEndDate, setPostedEndDate] = useState('');
  const [postedAccount, setPostedAccount] = useState<'All' | Account>('All');
  const [showPostFilters, setShowPostFilters] = useState(false);
  const [showPostDatePicker, setShowPostDatePicker] = useState<Content | null>(null);
  const [postAccounts, setPostAccounts] = useState<Account[]>([]);
  const [postDate, setPostDate] = useState(new Date().toISOString().slice(0, 10));
  const [postCaption, setPostCaption] = useState('');
  const [newContent, setNewContent] = useState({
    title: '',
    caption: '',
    date: '',
    platform: '',
    status: 'Draft' as Status,
    contentType: 'Umum' as ContentType,
    products: [] as Product[],
    format: 'Image',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [c, i, f, fc, e, m, y, ad] = await Promise.all([
        api.get('/api/content'),
        api.get('/api/ideas'),
        api.get('/api/followers'),
        api.get('/api/follower-changes'),
        api.get('/api/engagements'),
        api.get('/api/engagement-metrics'),
        api.get('/api/youtube-engagement'),
        api.get('/api/ad-performance'),
      ]);
      const normalizedContents = (c.data.items ?? []).map((item: Content) => ({ ...item, contentType: contentTypes.includes(item.contentType) ? item.contentType : 'Umum' as ContentType, products: Array.isArray(item.products) ? item.products : [] }));
      setContents(normalizedContents);
      setIdeas(i.data.items ?? []);
      setFollowers(f.data.items ?? []);
      setFollowerChanges((fc.data.items ?? []) as FollowerChange[]);
      setEngagements(e.data.items ?? []);
      setEngagementMetrics(m.data.items ?? []);
      setYoutubeEngagement((y.data.items ?? []) as YoutubeEngagement[]);
      setAdPerformances((ad.data.items ?? []) as AdPerformance[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const markActivity = () => setLastActivity(Date.now());
    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, markActivity, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity >= 60 * 60 * 1000) {
        setIsLoggedIn(false);
        setShowLogin(false);
        setSelected(null);
        setEditingContent(null);
        setEditingIdea(null);
        setShowComposer(false);
        setShowIdeaComposer(false);
        setShowPostDatePicker(null);
      }
    }, 30000);
    return () => {
      events.forEach(event => window.removeEventListener(event, markActivity));
      window.clearInterval(timer);
    };
  }, [isLoggedIn, lastActivity]);

  useEffect(() => {
    const removeStrayNewlineText = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const value = node.nodeValue?.trim();
        if (value === '/n' || value === '\\n') nodes.push(node as Text);
      }
      nodes.forEach(node => node.remove());
    };
    removeStrayNewlineText();
    const observer = new MutationObserver(removeStrayNewlineText);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const filtered = useMemo(
    () =>
      contents
        .filter(item => {
          const haystack = (item.title + ' ' + item.contentType + ' ' + (item.products ?? []).join(' ') + ' ' + item.platform).toLowerCase();
          const matchesSearch = haystack.includes(search.toLowerCase());
          const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
          return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
          const statusOrder: Record<Status, number> = { Draft: 0, Done: 1, Post: 2 };
          const statusCompare = statusOrder[a.status] - statusOrder[b.status];
          if (statusCompare !== 0) return statusCompare;
          if (a.status === 'Post' && b.status === 'Post') {
            return String(b.date || '').localeCompare(String(a.date || ''));
          }
          return 0;
        }),
    [contents, search, filterStatus]
  );

  const posted = useMemo(
    () =>
      contents
        .filter(item => {
          if (item.status !== 'Post') return false;
          if (postedAccount !== 'All' && !item.platform.split(' | ').includes(postedAccount)) return false;
          if (postedStartDate && item.date < postedStartDate) return false;
          if (postedEndDate && item.date > postedEndDate) return false;
          return true;
        })
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    [contents, postedAccount, postedStartDate, postedEndDate]
  );

  const metrics = {
    draft: contents.filter(x => x.status === 'Draft').length,
    done: contents.filter(x => x.status === 'Done').length,
    ideas: ideas.length,
  };

  const addContent = async () => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (!newContent.title.trim()) return;
    const payload = { ...newContent, status: 'Draft' as Status, date: '' };
    const res = await api.post('/api/content', payload);
    setContents(prev => [res.data.item, ...prev]);
    setShowComposer(false);
    setNewContent({ ...newContent, title: '', caption: '' });
  };

  const saveContent = async (item: Content) => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (item.status === 'Post' && !item.date) {
      setPostDate(new Date().toISOString().slice(0, 10));
      setPostCaption(item.caption || '');
      setShowPostDatePicker(item);
      return;
    }
    const res = await api.put('/api/content/' + item.id, item);
    setContents(prev => prev.map(x => (x.id === item.id ? res.data.item : x)));
    setSelected(res.data.item);
    setEditingContent(null);
  };

  const updateStatus = async (item: Content, status: Status) => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (status === 'Post' && item.status !== 'Post') {
      setPostDate(new Date().toISOString().slice(0, 10));
      setPostCaption(item.caption || '');
      setPostAccounts(item.platform ? item.platform.split(' | ').filter(Boolean) as Account[] : []);
      setShowPostDatePicker(item);
      return;
    }
    const next = { ...item, status, date: status === 'Post' ? item.date : '' };
    await saveContent(next);
  };

  const confirmPost = async () => {
    if (!showPostDatePicker || !postDate) return;
    if (postAccounts.length === 0) return;
    const next = { ...showPostDatePicker, status: 'Post' as Status, date: postDate, platform: postAccounts.join(' | '), caption: postCaption };
    await saveContent(next);
    setShowPostDatePicker(null);
  };

  const deleteContent = async (item: Content) => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    await api.delete('/api/content/' + item.id);
    setContents(prev => prev.filter(x => x.id !== item.id));
    setSelected(null);
  };

  const addIdea = async () => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (!newIdea.trim()) return;
    const res = await api.post('/api/ideas', {
      text: newIdea,
      pillar: 'Education',
      links: newIdeaLinks.filter(Boolean).slice(0, 5),
    });
    setIdeas(prev => [res.data.item, ...prev]);
    setNewIdea('');
    setNewIdeaLinks([]);
    setShowIdeaComposer(false);
  };

  const saveIdea = async (idea: Idea) => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    const res = await api.put('/api/ideas/' + idea.id, idea);
    setIdeas(prev => prev.map(x => (x.id === idea.id ? res.data.item : x)));
    setEditingIdea(null);
  };

  const deleteIdea = async (idea: Idea) => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    await api.delete('/api/ideas/' + idea.id);
    setIdeas(prev => prev.filter(x => x.id !== idea.id));
  };

  const openLogin = () => { setLoginError(''); setLoginPassword(''); setShowLogin(true); setShowMobileMenu(false); };
  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === 'marcommgsa' && loginPassword === 'Gsamarcomm888') {
      setIsLoggedIn(true);
      setLastActivity(Date.now());
      setShowLogin(false);
      setLoginError('');
      setLoginPassword('');
    } else {
      setLoginError('Username atau password salah.');
    }
  };
  const logout = () => {
    setShowMobileMenu(false);
    setIsLoggedIn(false);
    setSelected(null);
    setEditingContent(null);
    setEditingIdea(null);
    setShowComposer(false);
    setShowIdeaComposer(false);
    setShowPostDatePicker(null);
  };

  const submitPublicIdea = () => {
    const topic = publicIdeaText.trim();
    if (!topic) return;
    const link = publicIdeaLink.trim();
    const message = ['Halo Marcomm GSA, saya ingin memberikan ide konten ini.', '', `Konten tentang: ${topic}`, link ? `Link contoh konten: ${link}` : ''].filter(Boolean).join('\n');
    window.open(`https://wa.me/628117608156?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="font-bold tracking-tight">ContentFlow</div>
            <div className="text-[11px] text-slate-400">Social content OS</div>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          <button onClick={() => { setView('Overview'); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ' + (view === 'Overview' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}><LayoutDashboard size={18} />Overview</button>
          <button
            onClick={() => { setView('Dashboard'); }}
            className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ' + (view === 'Dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}
          >
            <FileText size={18} />
            Konten
          </button>
          <button onClick={() => { setView('Followers'); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ' + (view === 'Followers' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}><Users size={18} />Followers</button>
          <button onClick={() => { setView('Engagement'); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ' + (view === 'Engagement' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}><MessageCircle size={18} />Engagement</button>
          <button onClick={() => { setView('Performa Iklan'); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ' + (view === 'Performa Iklan' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}><Megaphone size={18} />Performa Iklan</button>
        </nav>
        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold">Content workspace</div>
            <p className="text-xs leading-5 text-slate-500">
              Draft, Done, and Post in one simple workflow.
            </p>
          </div>
        </div>
      </aside>

      {showMobileMenu && <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowMobileMenu(false)}><div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"></div><div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-100 pb-4"><div className="font-bold">Menu</div><button type="button" onClick={() => setShowMobileMenu(false)} className="rounded-lg p-2 text-slate-400"><X size={18} /></button></div><nav className="mt-4 space-y-1"><button onClick={() => { setView('Overview'); setShowMobileMenu(false); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ' + (view === 'Overview' ? 'bg-slate-900 text-white' : 'text-slate-600')}><LayoutDashboard size={18} />Overview</button><button onClick={() => { setView('Dashboard'); setShowMobileMenu(false); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ' + (view === 'Dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600')}><FileText size={18} />Konten</button><button onClick={() => { setView('Followers'); setShowMobileMenu(false); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ' + (view === 'Followers' ? 'bg-slate-900 text-white' : 'text-slate-600')}><Users size={18} />Followers</button><button onClick={() => { setView('Engagement'); setShowMobileMenu(false); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ' + (view === 'Engagement' ? 'bg-slate-900 text-white' : 'text-slate-600')}><MessageCircle size={18} />Engagement</button><button onClick={() => { setView('Performa Iklan'); setShowMobileMenu(false); }} className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ' + (view === 'Performa Iklan' ? 'bg-slate-900 text-white' : 'text-slate-600')}><Megaphone size={18} />Performa Iklan</button></nav><div className="mt-5 border-t border-slate-100 pt-5"><button onClick={isLoggedIn ? logout : openLogin} className={'w-full rounded-xl px-4 py-3 text-sm font-semibold ' + (isLoggedIn ? 'border border-slate-200 bg-white text-slate-700' : 'bg-slate-900 text-white')}>{isLoggedIn ? 'Logout' : 'Login'}</button></div></div></div>}

      <main className="pb-4 lg:pb-0 lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-400">Workspace / {view}</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {view === 'Dashboard' ? 'Konten' : view === 'Ideas' ? 'Ide' : view}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {view === 'Dashboard' && <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search content..."
                  className="w-44 bg-transparent text-sm outline-none"
                />
              </div>}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowMobileMenu(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 lg:hidden" aria-label="Buka menu"><Menu size={20} /></button>
                <button onClick={isLoggedIn ? logout : openLogin} className={'hidden rounded-xl px-4 py-2.5 text-sm font-semibold lg:inline-flex ' + (isLoggedIn ? 'border border-slate-200 bg-white text-slate-700' : 'bg-slate-900 text-white')}>
                  {isLoggedIn ? 'Logout' : 'Login'}
                </button>
                {view === 'Ideas' && isLoggedIn && (
                  <button
                    onClick={() => setShowIdeaComposer(true)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    <Lightbulb size={17} /> Add idea
                  </button>
                )}
                {view === 'Dashboard' && isLoggedIn && (
                  <button
                    onClick={() => setShowComposer(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                  >
                    <CirclePlus size={17} /> New content
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {(view === 'Dashboard' || view === 'Ideas' || view === 'Post') && <div className="mx-auto max-w-7xl px-5 pt-4 lg:px-8"><div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><button onClick={() => setView('Dashboard')} className={'rounded-xl px-4 py-2.5 text-sm font-semibold ' + (view === 'Dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')}>Konten</button><button onClick={() => setView('Ideas')} className={'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ' + (view === 'Ideas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')}><Lightbulb size={16} />Ide</button><button onClick={() => setView('Post')} className={'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ' + (view === 'Post' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')}><Hash size={16} />Post</button></div></div>}

        <div className="mx-auto max-w-7xl p-5 lg:p-8">
          {view === 'Overview' && (
            <OverviewView month={overviewMonth} onMonthChange={setOverviewMonth} followers={followers} followerChanges={followerChanges} metrics={engagementMetrics} youtubeMetrics={youtubeEngagement} ads={adPerformances} contents={contents} engagements={engagements} />
          )}

          {view === 'Dashboard' && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Draft', metrics.draft, 'Content being prepared'],
                  ['Done', metrics.done, 'Ready for posting'],
                  ['Ideas', metrics.ideas, 'Ideas in the inbox'],
                ].map(([label, value, note]) => (
                  <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-sm text-slate-500">{label as string}</div>
                    <div className="mt-3 text-3xl font-bold">{value as number}</div>
                    <div className="mt-1 text-xs text-slate-400">{note as string}</div>
                  </div>
                ))}
              </section>

              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Content pipeline</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['All', 'Draft', 'Done', 'Post'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={'rounded-lg px-3 py-2 text-xs font-semibold ' + (filterStatus === s ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500')}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map(item => (
                    <ContentCard key={item.id} item={item} canEdit={isLoggedIn} onClick={() => setSelected(item)} onEdit={() => setEditingContent(item)} />
                  ))}
                </div>
                {!loading && filtered.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-400">No content found.</div>
                )}
              </section>
            </>
          )}

          {view === 'Followers' && (
            <FollowersView canEdit={isLoggedIn} followers={followers} history={followerChanges} onSaved={(items, history) => { setFollowers(items); setFollowerChanges(history); }} />
          )}

          {view === 'Engagement' && (
            <EngagementView
              engagements={engagements}
              metrics={engagementMetrics}
              youtubeMetrics={youtubeEngagement}
              contents={contents}
              onAddEngagement={(item) => setEngagements(prev => [item, ...prev])}
              onUpdateEngagement={(item) => setEngagements(prev => prev.map(x => x.id === item.id ? item : x))}
              onDeleteEngagement={(id) => setEngagements(prev => prev.filter(x => x.id !== id))}
              onSelectMetric={(item) => setSelectedMetric(item)}
              onSelectYoutubeMetric={(item) => setSelectedYoutubeMetric(item)}
              canEdit={isLoggedIn}
            />
          )}

          {view === 'Performa Iklan' && (
            <AdPerformanceView canEdit={isLoggedIn} performances={adPerformances} onSaved={(items) => setAdPerformances(prev => { const next = [...prev]; items.forEach(item => { const index = next.findIndex(x => x.id === item.id); if (index >= 0) next[index] = item; else next.unshift(item); }); return next; })} />
          )}

          {view === 'Post' && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Total content posted</div>
                    <div className="mt-1 text-4xl font-bold">{posted.length}</div>
                    <p className="mt-1 text-xs text-slate-400">Filter total post berdasarkan tanggal atau akun sosial media.</p>
                  </div>
                  <button type="button" onClick={() => setShowPostFilters(prev => !prev)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 md:hidden"><Filter size={16} /> Filter</button><div className="hidden flex-wrap gap-2 md:flex"><div className="flex flex-wrap gap-2">
                    <select value={postedAccount} onChange={e => setPostedAccount(e.target.value as 'All' | Account)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <option value="All">All social accounts</option>
                      {accounts.map(account => <option key={account}>{account}</option>)}
                    </select>
                    <input aria-label="Tanggal mulai" type="date" value={postedStartDate} onChange={e => setPostedStartDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <input aria-label="Tanggal akhir" type="date" value={postedEndDate} min={postedStartDate || undefined} onChange={e => setPostedEndDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <button onClick={() => { setPostedStartDate(''); setPostedEndDate(''); setPostedAccount('All'); }} className="rounded-xl border px-3 py-2 text-sm">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              </div>{showPostFilters && <div className="mt-3 w-full rounded-xl bg-slate-50 p-3 md:hidden"><div className="grid gap-2"><select value={postedAccount} onChange={e => setPostedAccount(e.target.value as 'All' | Account)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="All">All social accounts</option>{accounts.map(account => <option key={account}>{account}</option>)}</select><input aria-label="Tanggal mulai" type="date" value={postedStartDate} onChange={e => setPostedStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" /><input aria-label="Tanggal akhir" type="date" value={postedEndDate} min={postedStartDate || undefined} onChange={e => setPostedEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" /><button onClick={() => { setPostedStartDate(''); setPostedEndDate(''); setPostedAccount('All'); }} className="rounded-xl border bg-white px-3 py-2 text-sm">Reset</button></div></div>}<div className="divide-y divide-slate-100">
                {posted.map(item => (
                  <ContentRow key={item.id} item={item} onClick={() => setSelected(item)} />
                ))}
                {posted.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No posted content matches the selected filters.</div>}
              </div>
            </section>
          )}

          {view === 'Ideas' && (
            <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Content ideas</h2>
                  <p className="mt-1 text-sm text-slate-400">Simpan ide dan sampai 5 link referensi untuk setiap ide.</p>
                </div>

              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {ideas.map(idea => (
                  <div key={idea.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium leading-6">{idea.text}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Hash size={13} />{idea.pillar}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isLoggedIn && <><button onClick={() => setEditingIdea(idea)} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-900" aria-label="Edit idea"><Pencil size={17} /></button>
                        <button onClick={() => void deleteIdea(idea)} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600" aria-label="Delete idea"><Trash2 size={17} /></button></>}
                      </div>
                    </div>
                    {idea.links?.length > 0 && (
                      <div className="mt-4 space-y-1">
                        {idea.links.map((link, index) => (
                          <a key={link + index} href={link} target="_blank" rel="noreferrer" className="block truncate text-xs text-blue-600 hover:underline">
                            {index + 1}. {link}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div>
                <h2 className="text-lg font-bold">Punya Ide Konten?</h2>
                <p className="mt-1 text-sm text-slate-500">Bagikan ide konten kepada Marcomm GSA melalui WhatsApp.</p>
              </div>
              <div className="mt-5 grid gap-4">
                <label className="text-sm font-semibold">Konten tentang <span className="text-rose-500">*</span>
                  <textarea value={publicIdeaText} onChange={e => setPublicIdeaText(e.target.value)} rows={4} placeholder="Tuliskan ide atau topik konten..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Link contoh konten <span className="font-normal text-slate-400">(opsional)</span>
                  <input type="url" value={publicIdeaLink} onChange={e => setPublicIdeaLink(e.target.value)} placeholder="https://..." className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                </label>
                <button type="button" disabled={!publicIdeaText.trim()} onClick={submitPublicIdea} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Kirim Ide</button>
              </div>
            </section>
            </>
          )}

        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="ml-auto h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className={'inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ' + statusStyles[selected.status]}>{selected.status}</div>
                <h2 className="mt-3 text-xl font-bold">{selected.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{selected.status === 'Post' && selected.date ? formatDate(selected.date) + ' · ' : ''}{selected.platform} · {selected.format}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400"><X size={18} /></button>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Caption</div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.caption || 'No caption yet.'}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3"><div className="text-xs text-slate-400">Account</div><div className="mt-1 text-sm font-semibold">{selected.platform}</div></div>
              <div className="rounded-xl border p-3"><div className="text-xs text-slate-400">Tipe konten</div><div className="mt-1 text-sm font-semibold">{selected.contentType}</div>{selected.contentType === 'Produk' && selected.products?.length > 0 && <div className="mt-2 text-xs text-slate-500">Produk: {selected.products.join(', ')}</div>}</div>
            </div>
            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold text-slate-400">Move to</div>
              <div className="flex flex-wrap gap-2">
                {isLoggedIn && statuses.map(status => (
                  <button key={status} onClick={() => void updateStatus(selected, status)} className={'rounded-xl px-3 py-2 text-xs font-semibold ' + (selected.status === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600')}>{status}</button>
                ))}
              </div>
            </div>
            {isLoggedIn && <div className="mt-6 flex gap-3">
              <button onClick={() => setEditingContent(selected)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"><Pencil size={16} /> Edit content</button>
              <button onClick={() => void deleteContent(selected)} className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600"><Trash2 size={16} /> Delete</button>
            </div>}
          </div>
        </div>
      )}

      {showComposer && (
        <ContentForm
          title="Create content"
          value={newContent}
          onChange={setNewContent}
          onClose={() => setShowComposer(false)}
          onSave={() => void addContent()}
          saveLabel="Create content"
        />
      )}

      {editingContent && (
        <ContentForm
          title="Edit content"
          value={editingContent}
          onChange={setEditingContent}
          onClose={() => setEditingContent(null)}
          onSave={() => void saveContent(editingContent)}
          saveLabel="Save changes"
        />
      )}

      {selectedMetric && (
        <EngagementMetricForm metric={selectedMetric} onClose={() => setSelectedMetric(null)} onSaved={(item) => { setEngagementMetrics(prev => { const exists = prev.some(x => x.id === item.id); return exists ? prev.map(x => x.id === item.id ? item : x) : [item, ...prev]; }); setSelectedMetric(null); }} />
      )}

      {selectedYoutubeMetric && (
        <YoutubeEngagementForm metric={selectedYoutubeMetric} onClose={() => setSelectedYoutubeMetric(null)} onSaved={(item) => { setYoutubeEngagement(prev => { const exists = prev.some(x => x.id === item.id); return exists ? prev.map(x => x.id === item.id ? item : x) : [item, ...prev]; }); setSelectedYoutubeMetric(null); }} />
      )}

      {showPostDatePicker && (
        <PostDateForm
          date={postDate}
          onChange={setPostDate}
          onClose={() => setShowPostDatePicker(null)}
          caption={postCaption}
          onCaptionChange={setPostCaption}
          accounts={postAccounts}
          onAccountsChange={setPostAccounts}
          onSave={() => void confirmPost()}
        />
      )}

      {showIdeaComposer && (
        <IdeaCreateForm
          text={newIdea}
          links={newIdeaLinks}
          onTextChange={setNewIdea}
          onLinksChange={setNewIdeaLinks}
          onClose={() => { setShowIdeaComposer(false); setNewIdea(''); setNewIdeaLinks([]); }}
          onSave={() => void addIdea()}
        />
      )}

      {showLogin && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setShowLogin(false)}>
          <form onSubmit={submitLogin} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-bold">Login</h2><p className="mt-1 text-sm text-slate-400">Masuk untuk menambah, mengubah, atau memperbarui data.</p></div>
              <button type="button" onClick={() => setShowLogin(false)} className="rounded-lg p-2 text-slate-400"><X size={18} /></button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">Username<input autoFocus value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-slate-400" /></label>
              <label className="block text-sm font-semibold">Password<input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-slate-400" /></label>
              {loginError && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{loginError}</div>}
            </div>
            <button type="submit" className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white">Login</button>
          </form>
        </div>
      )}

      {editingIdea && (
        <IdeaForm
          value={editingIdea}
          onChange={setEditingIdea}
          onClose={() => setEditingIdea(null)}
          onSave={() => void saveIdea(editingIdea)}
        />
      )}
    </div>
  );
}

function OverviewView({
  month,
  onMonthChange,
  followers,
  followerChanges,
  metrics,
  youtubeMetrics,
  ads,
  contents,
  engagements,
}: {
  month: string;
  onMonthChange: (value: string) => void;
  followers: FollowerRecord[];
  followerChanges: FollowerChange[];
  metrics: EngagementMetric[];
  youtubeMetrics: YoutubeEngagement[];
  ads: AdPerformance[];
  contents: Content[];
  engagements: EngagementRecord[];
}) {
  const monthFollowers = accounts.map(account => {
    const snapshot = followerChanges.find(item => item.account === account && (item.month || item.updatedAt.slice(0, 7)) === month);
    const current = snapshot?.currentFollowers ?? (followers.find(item => item.account === account && String(item.updatedAt || '').slice(0, 7) === month)?.currentFollowers ?? 0);
    const change = snapshot?.change ?? 0;
    const growth = current - change > 0 ? (change / (current - change)) * 100 : 0;
    return { account, current, change, growth };
  });
  const selectedMetrics = metrics.filter(item => item.month === month);
  const totalReach = selectedMetrics.reduce((sum, item) => sum + Number(item.reach || 0), 0);
  const totalInteractions = selectedMetrics.reduce((sum, item) => sum + Number(item.interactions || 0), 0);
  const totalProfileVisits = selectedMetrics.reduce((sum, item) => sum + Number(item.profileVisits || 0), 0);
  const totalRate = totalReach > 0 ? totalInteractions / totalReach * 100 : 0;
  const youtubeMetric = youtubeMetrics.find(item => item.month === month);
  const selectedAds = ads.filter(item => item.month === month);
  const adTotals = adAccounts.map(account => {
    const rows = selectedAds.filter(item => item.account === account);
    return {
      account,
      reach: rows.reduce((sum, item) => sum + Number(item.awarenessReach || 0), 0),
      interactions: rows.reduce((sum, item) => sum + Number(item.awarenessInteractions || 0), 0),
      visits: rows.reduce((sum, item) => sum + Number(item.awarenessVisits || 0), 0),
      followers: rows.reduce((sum, item) => sum + Number(item.awarenessNewFollowers || 0), 0),
      salesReach: rows.reduce((sum, item) => sum + Number(item.salesReach || 0), 0),
      clicks: rows.reduce((sum, item) => sum + Number(item.salesClicks || 0), 0),
    };
  });
  const totalAdFollowers = adTotals.reduce((sum, item) => sum + item.followers, 0);
  const totalAdReach = adTotals.reduce((sum, item) => sum + item.reach, 0);
  const totalAdInteractions = adTotals.reduce((sum, item) => sum + item.interactions, 0);
  const totalAdVisits = adTotals.reduce((sum, item) => sum + item.visits, 0);
  const totalSalesReach = adTotals.reduce((sum, item) => sum + item.salesReach, 0);
  const totalClicks = adTotals.reduce((sum, item) => sum + item.clicks, 0);
  const posts = contents.filter(item => item.status === 'Post' && String(item.date || '').slice(0, 7) === month);
  const inboxItems = engagements.filter(item => item.type === 'Inbox' && String(item.date || item.createdAt || '').slice(0, 7) === month);
  const commentItems = engagements.filter(item => item.type === 'Komentar' && String(item.date || item.createdAt || '').slice(0, 7) === month);
  const formatNumber = (value: number) => value.toLocaleString('id-ID');
  const accountMetric = accounts.filter(account => account !== 'Youtube').map(account => selectedMetrics.find(item => item.account === account));
  const followerMax = Math.max(1, ...monthFollowers.map(item => Math.abs(item.change)));
  const postCounts = accounts.map(account => posts.filter(item => item.platform.split(' | ').includes(account)).length);
  const postMax = Math.max(1, ...postCounts);

  return (
    <div>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-xl font-bold">Overview</h2><p className="mt-1 text-sm text-slate-400">Ringkasan data hanya untuk bulan yang dipilih.</p></div>
        <label className="text-xs font-semibold text-slate-500">Bulan<input type="month" value={month} onChange={e => onMonthChange(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label>
      </section>

      <section className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {[
          ['Followers baru', followerChanges.filter(item => (item.month || item.updatedAt.slice(0, 7)) === month).reduce((sum, item) => sum + item.change, 0)],
          ['Total reach', totalReach],
          ['Total interaksi', totalInteractions],
          ['Engagement rate', totalRate.toFixed(2) + '%'],
          ['Kunjungan profil', totalProfileVisits],
          ['Total post', posts.length],
          ['Klik chat', totalClicks],
        ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-400">{label}</div><div className="mt-2 text-2xl font-bold">{typeof value === 'number' ? formatNumber(value) : value}</div></div>)}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold">Followers bulan {month}</h2><p className="mt-1 text-xs text-slate-400">Grafik hanya membandingkan akun pada bulan yang dipilih, bukan antarbulan.</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {monthFollowers.map(item => <div key={item.account} className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-semibold text-slate-500">{item.account}</div><div className="mt-2 text-xl font-bold">{formatNumber(item.current)}</div><div className={'mt-1 text-sm font-semibold ' + (item.change < 0 ? 'text-rose-600' : 'text-emerald-600')}>{item.change >= 0 ? '+' : ''}{formatNumber(item.change)} followers baru</div><div className="mt-1 text-xs text-slate-400">Growth {item.growth.toFixed(2)}%</div></div>)}
        </div>
        <div className="mt-6 space-y-3">
          {monthFollowers.map(item => <div key={item.account + '-chart'}><div className="mb-1 flex justify-between text-xs"><span>{item.account}</span><span className="font-semibold">{item.change >= 0 ? '+' : ''}{formatNumber(item.change)}</span></div><div className="h-3 rounded-full bg-slate-100"><div className={'h-3 rounded-full ' + (item.change < 0 ? 'bg-rose-300' : 'bg-slate-700')} style={{ width: Math.min(100, Math.abs(item.change) / followerMax * 100) + '%' }} /></div></div>)}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Reach vs interaksi</h2><p className="mt-1 text-xs text-slate-400">Per akun pada bulan {month}.</p>
          <div className="mt-5 space-y-4">{accountMetric.map((metric, index) => { const account = accounts.filter(item => item !== 'Youtube')[index]; const reach = metric?.reach ?? 0; const interactions = metric?.interactions ?? 0; const scale = Math.max(1, reach, interactions); return <div key={account}><div className="mb-1 flex justify-between text-xs"><span className="font-semibold">{account}</span><span className="text-slate-400">Reach {formatNumber(reach)} · Interaksi {formatNumber(interactions)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-700" style={{ width: Math.min(100, reach / scale * 100) + '%' }} /></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-400" style={{ width: Math.min(100, interactions / scale * 100) + '%' }} /></div></div>; })}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Engagement rate per akun</h2><p className="mt-1 text-xs text-slate-400">Interaksi ÷ reach pada bulan {month}.</p>
          <div className="mt-5 grid grid-cols-2 gap-2 md:gap-3">{accountMetric.filter((metric, index) => accounts[index] !== 'Youtube').map((metric, index) => { const account = accounts.filter(item => item !== 'Youtube')[index]; const rate = metric && metric.reach > 0 ? metric.interactions / metric.reach * 100 : 0; return <div key={account} className="min-w-0 rounded-xl bg-slate-50 p-3 md:p-4"><div className="truncate text-[11px] font-semibold text-slate-500 md:text-xs">{account}</div><div className="mt-1 text-lg font-bold md:mt-2 md:text-2xl">{rate.toFixed(2)}%</div></div>; })}</div>
          <div className="mt-4 rounded-xl border border-slate-100 p-4"><div className="text-xs font-semibold text-slate-500">Youtube</div><div className="mt-2 grid grid-cols-3 gap-3 text-xs"><div><div className="text-slate-400">Views</div><div className="font-bold">{formatNumber(youtubeMetric?.views ?? 0)}</div></div><div><div className="text-slate-400">Impression</div><div className="font-bold">{formatNumber(youtubeMetric?.impressions ?? 0)}</div></div><div><div className="text-slate-400">CTR</div><div className="font-bold">{(youtubeMetric?.ctrImpression ?? 0).toFixed(2)}%</div></div></div></div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="font-semibold">Performa iklan bulan {month}</h2><p className="mt-1 text-xs text-slate-400">Semua angka hanya dari data iklan pada bulan yang dipilih.</p></div>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-stretch md:gap-4"><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-700">Awareness</h3><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3"><div className="min-w-0 rounded-xl bg-slate-50 p-3 md:w-36 md:p-4"><div className="truncate text-xs text-slate-400">Reach</div><div className="mt-1 text-lg font-bold md:text-xl">{formatNumber(totalAdReach)}</div></div><div className="min-w-0 rounded-xl bg-slate-50 p-3 md:w-36 md:p-4"><div className="truncate text-xs text-slate-400">Interaksi</div><div className="mt-1 text-lg font-bold md:text-xl">{formatNumber(totalAdInteractions)}</div></div><div className="min-w-0 rounded-xl bg-slate-50 p-3 md:w-36 md:p-4"><div className="truncate text-xs text-slate-400">Kunjungan</div><div className="mt-1 text-lg font-bold md:text-xl">{formatNumber(totalAdVisits)}</div></div><div className="min-w-0 rounded-xl bg-slate-50 p-3 md:w-36 md:p-4"><div className="truncate text-xs text-slate-400">Follower baru</div><div className="mt-1 text-lg font-bold md:text-xl">{formatNumber(totalAdFollowers)}</div></div></div></div><div className="h-px w-full bg-slate-200 md:mx-1 md:h-auto md:w-px"></div><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-700">Sales</h3><div className="mt-3 grid grid-cols-2 gap-2 md:gap-3"><div className="min-w-0 rounded-xl bg-slate-50 p-3 md:w-36 md:p-4"><div className="truncate text-xs text-slate-400">Reach Facebook</div><div className="mt-1 text-lg font-bold md:text-xl">{formatNumber(totalSalesReach)}</div></div><div className="min-w-0 rounded-xl bg-slate-50 p-3 md:w-36 md:p-4"><div className="truncate text-xs text-slate-400">Klik Chat</div><div className="mt-1 text-lg font-bold md:text-xl">{formatNumber(totalClicks)}</div></div></div></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">{adTotals.map(item => <div key={item.account} className="rounded-xl border border-slate-100 p-4"><div className="font-semibold">{item.account}</div><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><div className="text-slate-400">Awareness reach</div><div className="font-bold">{formatNumber(item.reach)}</div></div><div><div className="text-slate-400">Interaksi</div><div className="font-bold">{formatNumber(item.interactions)}</div></div><div><div className="text-slate-400">Kunjungan</div><div className="font-bold">{formatNumber(item.visits)}</div></div><div><div className="text-slate-400">Follower baru</div><div className="font-bold">{formatNumber(item.followers)}</div></div><div><div className="text-slate-400">Sales reach</div><div className="font-bold">{formatNumber(item.salesReach)}</div></div><div><div className="text-slate-400">Klik chat</div><div className="font-bold">{formatNumber(item.clicks)}</div></div></div></div>)}</div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Post per akun</h2><p className="mt-1 text-xs text-slate-400">Jumlah post pada bulan {month}.</p><div className="mt-5 space-y-3">{accounts.map((account, index) => <div key={account}><div className="mb-1 flex justify-between text-xs"><span>{account}</span><span className="font-semibold">{postCounts[index]}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-700" style={{ width: postCounts[index] / postMax * 100 + '%' }} /></div></div>)}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="font-semibold">Inbox dan Komentar</h2><p className="mt-1 text-xs text-slate-400">Total data hanya untuk bulan {month}.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Total Inbox</div><div className="mt-2 text-2xl font-bold">{inboxItems.length}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-400">Total Komentar</div><div className="mt-2 text-2xl font-bold">{commentItems.length}</div></div></div></div>
      </section>
    </div>
  );
}

function ContentForm({
  title,
  value,
  onChange,
  onClose,
  onSave,
  saveLabel,
}: {
  title: string;
  value: Omit<Content, 'id'> & { id?: string };
  onChange: (value: any) => void;
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-400">You can edit this content after adding it.</p></div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={18} /></button>
        </div>
        <div className="mt-6 space-y-4">
          <input autoFocus value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} placeholder="Content title / hook" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <div className="grid gap-3 sm:grid-cols-2">
            {value.status === 'Post' && (
              <input type="date" value={value.date} onChange={e => onChange({ ...value, date: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            )}
            {value.status === 'Post' && value.id && (
              <div className="rounded-xl border border-slate-200 p-3 text-sm">
                <div className="mb-2 font-semibold">Akun sosial media</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {accounts.map(account => {
                    const selected = value.platform.split(' | ').includes(account);
                    return <label key={account} className="flex items-center gap-2"><input type="checkbox" checked={selected} onChange={() => { const next = selected ? value.platform.split(' | ').filter(x => x && x !== account) : [...value.platform.split(' | ').filter(Boolean), account]; onChange({ ...value, platform: next.join(' | ') }); }} />{account}</label>;
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {value.id && (
              <select value={value.status} onChange={e => onChange({ ...value, status: e.target.value as Status })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                {statuses.map(status => <option key={status}>{status}</option>)}
              </select>
            )}
            <select value={value.contentType} onChange={e => { const contentType = e.target.value as ContentType; onChange({ ...value, contentType, products: contentType === 'Produk' ? value.products : [] }); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
              {contentTypes.map(type => <option key={type}>{type}</option>)}
            </select>
            <select value={value.format} onChange={e => onChange({ ...value, format: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <option>Image</option><option>Video</option>
            </select>
          </div>
          {value.contentType === 'Produk' && (
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 text-sm font-semibold">Pilih produk</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {products.map(product => {
                  const checked = (value.products ?? []).includes(product);
                  return <label key={product} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-2 text-sm"><input type="checkbox" checked={checked} onChange={() => { const next = checked ? (value.products ?? []).filter(x => x !== product) : [...(value.products ?? []), product]; onChange({ ...value, products: next }); }} />{product}</label>;
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400">Bisa pilih lebih dari satu produk.</p>
            </div>
          )}
          <button onClick={onSave} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white">{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

function PostDateForm({
  date,
  onChange,
  caption,
  onCaptionChange,
  accounts: selectedAccounts,
  onAccountsChange,
  onClose,
  onSave,
}: {
  date: string;
  onChange: (value: string) => void;
  caption: string;
  onCaptionChange: (value: string) => void;
  accounts: Account[];
  onAccountsChange: (value: Account[]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-bold">Konten sudah dipost</h2><p className="mt-1 text-sm text-slate-400">Masukkan tanggal konten benar-benar dipost.</p></div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={18} /></button>
        </div>
        <div className="mt-6 space-y-4">
          <textarea autoFocus value={caption} onChange={e => onCaptionChange(e.target.value)} placeholder="Tulis caption untuk posting..." rows={5} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <input type="date" value={date} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <div>
            <div className="mb-2 text-sm font-semibold">Pilih akun sosial media</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {accounts.map(account => {
                const checked = selectedAccounts.includes(account);
                return <label key={account} className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={checked} onChange={() => onAccountsChange(checked ? selectedAccounts.filter(x => x !== account) : [...selectedAccounts, account])} />{account}</label>;
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">Pilih satu sampai semua akun.</p>
          </div>
          <button disabled={!date || selectedAccounts.length === 0} onClick={onSave} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-40">Simpan sebagai Post</button>
        </div>
      </div>
    </div>
  );
}

function IdeaCreateForm({
  text,
  links,
  onTextChange,
  onLinksChange,
  onClose,
  onSave,
}: {
  text: string;
  links: string[];
  onTextChange: (value: string) => void;
  onLinksChange: (value: string[]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const fields = [...links, '', '', '', '', ''].slice(0, 5);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-bold">Tambah ide</h2><p className="mt-1 text-sm text-slate-400">Masukkan ide dan maksimal 5 link referensi.</p></div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={18} /></button>
        </div>
        <div className="mt-6 space-y-4">
          <textarea autoFocus value={text} onChange={e => onTextChange(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Tulis ide konten..." />
          <div className="space-y-2">
            {fields.map((link, index) => (
              <input
                key={index}
                value={link}
                onChange={e => { const next = [...fields]; next[index] = e.target.value; onLinksChange(next.filter(Boolean)); }}
                placeholder={'Link referensi ' + (index + 1) + ' (opsional)'}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
              />
            ))}
          </div>
          <button disabled={!text.trim()} onClick={onSave} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Simpan ide</button>
        </div>
      </div>
    </div>
  );
}

function IdeaForm({
  value,
  onChange,
  onClose,
  onSave,
}: {
  value: Idea;
  onChange: (value: Idea) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const links = [...(value.links ?? []), '', '', '', '', ''].slice(0, 5);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-bold">Edit idea</h2><p className="mt-1 text-sm text-slate-400">Maximum 5 reference links.</p></div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={18} /></button>
        </div>
        <div className="mt-6 space-y-4">
          <textarea value={value.text} onChange={e => onChange({ ...value, text: e.target.value })} rows={4} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Idea..." />
          <select value={value.pillar} onChange={e => onChange({ ...value, pillar: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <option>Education</option><option>Promotion</option><option>Behind the Scenes</option><option>Testimonial</option>
          </select>
          <div className="space-y-2">
            {links.map((link, index) => (
              <input
                key={index}
                value={link}
                onChange={e => {
                  const next = [...links];
                  next[index] = e.target.value;
                  onChange({ ...value, links: next.filter(Boolean) });
                }}
                placeholder={'Reference link ' + (index + 1)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
              />
            ))}
          </div>
          <button onClick={onSave} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white">Save changes</button>
        </div>
      </div>
    </div>
  );
}

function followerNounPlural(account: Account) { return account === 'Youtube' ? 'subscribers' : 'followers'; }


function FollowersView({ canEdit, followers, history, onSaved }: { canEdit: boolean; followers: FollowerRecord[]; history: FollowerChange[]; onSaved: (items: FollowerRecord[], history: FollowerChange[]) => void }) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showHistoryFilters, setShowHistoryFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [month, setMonth] = useState(selectedMonth);
  const [currentValues, setCurrentValues] = useState<Record<Account, string>>(() => Object.fromEntries(accounts.map(account => [account, '0'])) as Record<Account, string>);
  const [changes, setChanges] = useState<Record<Account, string>>(() => Object.fromEntries(accounts.map(account => [account, '0'])) as Record<Account, string>);
  const [saving, setSaving] = useState(false);

  const snapshotMonth = (item: FollowerChange) => String(item.month || item.updatedAt || '').slice(0, 7);
  const snapshotValue = (account: Account, selectedMonth: string) => {
    const rows = history
      .filter(item => item.account === account && snapshotMonth(item) <= selectedMonth && typeof item.currentFollowers === 'number')
      .sort((a, b) => snapshotMonth(a).localeCompare(snapshotMonth(b)) || a.updatedAt.localeCompare(b.updatedAt));
    if (rows.length) return rows[rows.length - 1].currentFollowers ?? 0;
    const latest = followers.find(item => item.account === account);
    return latest?.updatedAt?.slice(0, 7) === selectedMonth ? latest.currentFollowers : 0;
  };

  const loadMonth = (selectedMonth: string) => {
    setMonth(selectedMonth);
    setCurrentValues(Object.fromEntries(accounts.map(account => [account, String(snapshotValue(account, selectedMonth))])) as Record<Account, string>);
    setChanges(Object.fromEntries(accounts.map(account => [account, '0'])) as Record<Account, string>);
  };

  const openUpdate = () => {
    setMonth(selectedMonth);
    setCurrentValues(Object.fromEntries(accounts.map(account => [account, String(snapshotValue(account, selectedMonth))])) as Record<Account, string>);
    setChanges(Object.fromEntries(accounts.map(account => [account, '0'])) as Record<Account, string>);
    setShowUpdate(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const updated = await Promise.all(accounts.map(async account => {
        const existing = followers.find(item => item.account === account) ?? { id: account, account, currentFollowers: 0, newFollowers: 0, updatedAt: '' };
        const base = Math.max(0, Number(currentValues[account]) || 0);
        const growth = Number(changes[account]) || 0;
        const finalFollowers = Math.max(0, base + growth);
        const now = new Date();
        const savedDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        const res = await api.put('/api/followers/' + encodeURIComponent(existing.id), { account, currentFollowers: finalFollowers, newFollowers: growth, updatedAt: savedDate, month });
        return res.data.item as FollowerRecord;
      }));
      const historyRes = await api.get('/api/follower-changes');
      onSaved(updated, (historyRes.data.items ?? []) as FollowerChange[]);
      setShowUpdate(false);
    } finally {
      setSaving(false);
    }
  };

  const [historyAccount, setHistoryAccount] = useState<'All' | Account>('All');
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const filteredHistory = history.filter(item => {
    if (Number(item.change) === 0) return false;
    if (historyAccount !== 'All' && item.account !== historyAccount) return false;
    if (historyStart && item.updatedAt < historyStart) return false;
    if (historyEnd && item.updatedAt > historyEnd) return false;
    return true;
  });
  const totalChange = filteredHistory.reduce((sum, item) => sum + item.change, 0);
  const snapshotFor = (item: FollowerChange) => {
    if (typeof item.currentFollowers === 'number') return item.currentFollowers;
    const current = followers.find(x => x.account === item.account)?.currentFollowers ?? 0;
    const laterChanges = history.filter(x => x.account === item.account && x.updatedAt > item.updatedAt).reduce((sum, x) => sum + x.change, 0);
    return Math.max(0, current - laterChanges);
  };
  const growthFor = (account: Account, targetMonth: string) => {
    const targetRows = history
      .filter(item => item.account === account && snapshotMonth(item) === targetMonth && typeof item.currentFollowers === 'number')
      .sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)));
    if (!targetRows.length) return null;

    const targetFollowers = Number(targetRows[targetRows.length - 1].currentFollowers);
    if (!Number.isFinite(targetFollowers) || targetFollowers < 0) return null;

    const targetDate = new Date(targetMonth + '-01T00:00:00');
    if (Number.isNaN(targetDate.getTime())) return null;
    targetDate.setMonth(targetDate.getMonth() - 1);
    const previousMonth = targetDate.getFullYear() + '-' + String(targetDate.getMonth() + 1).padStart(2, '0');

    const previousRows = history
      .filter(item => item.account === account && snapshotMonth(item) === previousMonth && typeof item.currentFollowers === 'number')
      .sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)));
    if (!previousRows.length) return null;

    const previousFollowers = Number(previousRows[previousRows.length - 1].currentFollowers);
    if (!Number.isFinite(previousFollowers) || previousFollowers <= 0) return null;

    return ((targetFollowers - previousFollowers) / previousFollowers) * 100;
  };

  const visibleFollowers = accounts.map(account => { const exactRows = history.filter(item => snapshotMonth(item) === selectedMonth && item.account === account).sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt))); const exact = exactRows[exactRows.length - 1]; const snapshot = exact ?? history.filter(item => snapshotMonth(item) < selectedMonth && item.account === account).sort((a, b) => snapshotMonth(b).localeCompare(snapshotMonth(a)) || String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]; const monthChange = exactRows.reduce((sum, item) => sum + (Number(item.change) || 0), 0); return snapshot ? { id: snapshot.id, account, currentFollowers: snapshot.currentFollowers ?? 0, newFollowers: exact ? monthChange : 0, updatedAt: snapshot.updatedAt } as FollowerRecord : { id: account, account, currentFollowers: 0, newFollowers: 0, updatedAt: '' }; });
  return <section><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Followers</h2><p className="mt-1 text-sm text-slate-400">Followers growth dihitung dari data antar bulan.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs font-medium text-slate-500">Bulan<input aria-label="Filter bulan followers" type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>{canEdit && <button onClick={openUpdate} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Update followers</button>}</div></div><div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{visibleFollowers.map(item => { const accountName = item.account; const growthRate = growthFor(accountName, selectedMonth); return <div key={accountName} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={'rounded-lg px-2 py-1 text-[10px] font-semibold ' + accountStyles[accountName]}>{accountName}</span><div className="mt-4 text-2xl font-bold">{item.currentFollowers.toLocaleString('id-ID')}</div><div className="mt-1 text-xs text-slate-400">{followerNounPlural(accountName)} saat ini</div><div className={'mt-3 text-sm font-semibold ' + (item.newFollowers < 0 ? 'text-rose-600' : 'text-emerald-600')}>Perubahan {followerNounPlural(accountName)}: {item.newFollowers > 0 ? '+' : ''}{item.newFollowers.toLocaleString('id-ID')}</div><div className={'mt-2 text-sm font-semibold ' + (growthRate !== null && growthRate < 0 ? 'text-rose-600' : 'text-emerald-600')}>{accountName === 'Youtube' ? 'Subscribers growth:' : 'Followers growth:'} {growthRate === null ? '—' : (growthRate >= 0 ? '+' : '') + growthRate.toFixed(2) + '%'}</div><div className="mt-1 text-[11px] text-slate-400">Update: {item.updatedAt ? formatDate(item.updatedAt.slice(0, 10)) : '-'}</div></div>; })}</div><div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h3 className="font-semibold">Perubahan follower</h3><div className="mt-1 text-2xl font-bold">{totalChange > 0 ? '+' : ''}{totalChange.toLocaleString('id-ID')}</div><p className="text-xs text-slate-400">Total sesuai filter.</p></div><button type="button" onClick={() => setShowHistoryFilters(prev => !prev)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 md:hidden"><Filter size={16} /> Filter</button><div className="hidden flex-wrap gap-2 md:flex"><div className="flex flex-wrap gap-2"><select value={historyAccount} onChange={e => setHistoryAccount(e.target.value as 'All' | Account)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="All">Semua akun</option>{accounts.map(account => <option key={account}>{account}</option>)}</select><input aria-label="Tanggal mulai perubahan follower" type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input aria-label="Tanggal akhir perubahan follower" type="date" value={historyEnd} min={historyStart || undefined} onChange={e => setHistoryEnd(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button onClick={() => { setHistoryAccount('All'); setHistoryStart(''); setHistoryEnd(''); }} className="rounded-xl border px-3 py-2 text-sm">Reset</button></div></div></div></div>{showHistoryFilters && <div className="mt-3 w-full rounded-xl bg-slate-50 p-3 md:hidden"><div className="grid gap-2"><select value={historyAccount} onChange={e => setHistoryAccount(e.target.value as 'All' | Account)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="All">Semua akun</option>{accounts.map(account => <option key={account}>{account}</option>)}</select><input aria-label="Tanggal mulai perubahan follower" type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /><input aria-label="Tanggal akhir perubahan follower" type="date" value={historyEnd} min={historyStart || undefined} onChange={e => setHistoryEnd(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /><button onClick={() => { setHistoryAccount('All'); setHistoryStart(''); setHistoryEnd(''); }} className="rounded-xl border bg-white px-3 py-2 text-sm">Reset</button></div></div>}<div className="divide-y divide-slate-100">{filteredHistory.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><span className={'rounded-lg px-2 py-1 text-[10px] font-semibold ' + accountStyles[item.account]}>{item.account}</span><div className="mt-2 text-xs text-slate-400">{formatDate(item.updatedAt)}</div></div><div className={'text-sm font-semibold ' + (item.change < 0 ? 'text-rose-600' : 'text-emerald-600')}>{item.change > 0 ? '+' : ''}{item.change.toLocaleString('id-ID')}</div></div>)}{filteredHistory.length === 0 && <div className="p-8 text-center text-sm text-slate-400">Belum ada perubahan follower sesuai filter.</div>}</div></div>{showUpdate && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/30 p-4 backdrop-blur-sm" onClick={() => !saving && setShowUpdate(false)}><div className="my-auto w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Update followers semua akun</h2><p className="mt-1 text-sm text-slate-400">Masukkan growth per akun. Positif menambah, negatif mengurangi.</p></div><button onClick={() => setShowUpdate(false)} disabled={saving} className="rounded-lg p-2 text-slate-400"><X size={18} /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{accounts.map(account => { const base = Number(currentValues[account]) || 0; const growth = Number(changes[account]) || 0; const preview = Math.max(0, base + growth); return <div key={account} className="rounded-2xl border border-slate-200 p-3 text-sm font-semibold"><span>{account}</span><label className="mt-2 block text-xs font-normal text-slate-500">{followerNounPlural(account)} saat ini<input type="number" min="0" value={currentValues[account]} onChange={e => setCurrentValues(prev => ({ ...prev, [account]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label><label className="mt-2 block text-xs font-normal text-slate-500">Followers baru / perubahan<input type="number" value={changes[account]} onChange={e => setChanges(prev => ({ ...prev, [account]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label><div className="mt-2 text-xs text-slate-400">Hasil setelah perubahan: <span className="font-semibold text-slate-700">{preview.toLocaleString('id-ID')}</span></div></div>; })}</div><label className="mt-4 block text-sm font-semibold">Bulan update<input type="month" value={month} onChange={e => loadMonth(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><button disabled={saving || !month} onClick={() => void saveAll()} className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-40">{saving ? 'Menyimpan...' : 'Simpan semua akun'}</button></div></div>}</section>;
}

function AdPerformanceView({ canEdit, performances, onSaved }: { canEdit: boolean; performances: AdPerformance[]; onSaved: (items: AdPerformance[]) => void }) {
  const monthNow = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(monthNow);
  const [selected, setSelected] = useState<AdAccount | null>(null);
  const rowsFor = (account: AdAccount) => Array.from({ length: 5 }, (_, index) => {
    const adNumber = index + 1;
    return performances.find(x => x.account === account && x.month === month && x.adNumber === adNumber) ?? { id: account + '-' + month + '-' + adNumber, account, month, adNumber, awarenessReach: 0, awarenessInteractions: 0, awarenessVisits: 0, awarenessNewFollowers: 0, salesReach: 0, salesClicks: 0 };
  });
  const totalsFor = (account: AdAccount) => rowsFor(account).reduce((sum, x) => ({ reach: sum.reach + x.awarenessReach, interactions: sum.interactions + x.awarenessInteractions, visits: sum.visits + x.awarenessVisits, followers: sum.followers + x.awarenessNewFollowers, salesReach: sum.salesReach + x.salesReach, salesClicks: sum.salesClicks + x.salesClicks }), { reach: 0, interactions: 0, visits: 0, followers: 0, salesReach: 0, salesClicks: 0 });
  const visible = adAccounts.map(account => ({ account, totals: totalsFor(account) }));
  const totalAwareness = visible.reduce((sum, x) => ({ reach: sum.reach + x.totals.reach, interactions: sum.interactions + x.totals.interactions, visits: sum.visits + x.totals.visits, followers: sum.followers + x.totals.followers }), { reach: 0, interactions: 0, visits: 0, followers: 0 });
  const totalSales = visible.reduce((sum, x) => ({ reach: sum.reach + (x.account === 'Facebook' ? x.totals.salesReach : 0), clicks: sum.clicks + x.totals.salesClicks }), { reach: 0, clicks: 0 });
  return <section><div className="flex flex-wrap items-end justify-between gap-3"><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div><div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"><div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_1px_minmax(0,1fr)]"><div><div className="mb-3 text-sm font-semibold">Awareness</div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Reach</div><div className="mt-2 text-2xl font-bold">{totalAwareness.reach.toLocaleString("id-ID")}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Interaksi</div><div className="mt-2 text-2xl font-bold">{totalAwareness.interactions.toLocaleString("id-ID")}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Kunjungan</div><div className="mt-2 text-2xl font-bold">{totalAwareness.visits.toLocaleString("id-ID")}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Follower baru</div><div className="mt-2 text-2xl font-bold">{totalAwareness.followers.toLocaleString("id-ID")}</div></div></div></div><div className="hidden w-px bg-slate-200 md:block"></div><div><div className="mb-3 text-sm font-semibold">Sales</div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Reach Facebook</div><div className="mt-2 text-2xl font-bold">{totalSales.reach.toLocaleString("id-ID")}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Klik chat</div><div className="mt-2 text-2xl font-bold">{totalSales.clicks.toLocaleString("id-ID")}</div></div></div></div></div></div><div className="my-6 border-t border-slate-200"></div><div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">{visible.map(({ account, totals }) => <button key={account} disabled={!canEdit} onClick={() => canEdit && setSelected(account)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md md:p-5"><span className={'rounded-lg px-2 py-1 text-[10px] font-semibold ' + accountStyles[account]}>{account}</span><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><div className="text-xs text-slate-400">Reach</div><div className="mt-1 font-bold">{totals.reach.toLocaleString('id-ID')}</div></div><div><div className="text-xs text-slate-400">Interaksi</div><div className="mt-1 font-bold">{totals.interactions.toLocaleString('id-ID')}</div></div><div><div className="text-xs text-slate-400">Kunjungan</div><div className="mt-1 font-bold">{totals.visits.toLocaleString('id-ID')}</div></div><div><div className="text-xs text-slate-400">Follower baru</div><div className="mt-1 font-bold">{totals.followers.toLocaleString('id-ID')}</div></div></div>{account !== 'IG gsaindonesia' && <><div className="mt-5 border-t pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{account === 'Facebook' ? 'Sales (Facebook dan IG gsaindonesia)' : 'Sales'}</div><div className="mt-3 grid grid-cols-2 gap-3 text-sm">{account === 'Facebook' && <div><div className="text-xs text-slate-400">Reach</div><div className="mt-1 font-bold">{totals.salesReach.toLocaleString('id-ID')}</div></div>}<div><div className="text-xs text-slate-400">Klik chat</div><div className="mt-1 font-bold">{totals.salesClicks.toLocaleString('id-ID')}</div></div></div></>}<div className="mt-4 text-[11px] text-slate-400">Klik untuk input hingga 5 iklan · {month}</div></button>)}</div>{selected && <AdPerformanceForm account={selected} month={month} performances={performances} onClose={() => setSelected(null)} onSaved={items => { onSaved(items); setSelected(null); }} />}</section>;
}

function AdPerformanceForm({ account, month, performances, onClose, onSaved }: { account: AdAccount; month: string; performances: AdPerformance[]; onClose: () => void; onSaved: (items: AdPerformance[]) => void }) {
  const initial = Array.from({ length: 5 }, (_, index) => {
    const adNumber = index + 1;
    return performances.find(x => x.account === account && x.month === month && x.adNumber === adNumber) ?? { id: account + '-' + month + '-' + adNumber, account, month, adNumber, awarenessReach: 0, awarenessInteractions: 0, awarenessVisits: 0, awarenessNewFollowers: 0, salesReach: 0, salesClicks: 0 };
  });
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const updateRow = (index: number, field: keyof AdPerformance, value: string) => setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: Number(value) || 0 } : row));
  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const items: AdPerformance[] = [];
      for (const row of rows) {
        const existing = performances.find(x => x.account === account && x.month === month && x.adNumber === row.adNumber);
        const hasValue = Boolean(row.awarenessReach || row.awarenessInteractions || row.awarenessVisits || row.awarenessNewFollowers || row.salesReach || row.salesClicks);
        if (!existing && !hasValue) continue;
        const payload = { account, month, adNumber: row.adNumber, awarenessReach: row.awarenessReach, awarenessInteractions: row.awarenessInteractions, awarenessVisits: row.awarenessVisits, awarenessNewFollowers: row.awarenessNewFollowers, salesReach: account === 'IG gsaindonesia' ? 0 : row.salesReach, salesClicks: account === 'IG gsaindonesia' ? 0 : row.salesClicks };
        const res = existing
          ? await api.put('/api/ad-performance/' + encodeURIComponent(existing.id), payload)
          : await api.post('/api/ad-performance', payload);
        if (!res.data?.item?.id) throw new Error('Server tidak mengembalikan data iklan.');
        items.push(res.data.item as AdPerformance);
      }
      onSaved(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Data iklan tidak dapat disimpan.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };
  const total = rows.reduce((sum, x) => ({ reach: sum.reach + x.awarenessReach, interactions: sum.interactions + x.awarenessInteractions, visits: sum.visits + x.awarenessVisits, followers: sum.followers + x.awarenessNewFollowers, salesReach: sum.salesReach + x.salesReach, salesClicks: sum.salesClicks + x.salesClicks }), { reach: 0, interactions: 0, visits: 0, followers: 0, salesReach: 0, salesClicks: 0 });
  const input = (index: number, field: keyof AdPerformance, label: string) => <label className="text-xs font-semibold text-slate-600">{label}<input type="number" min="0" value={String(rows[index][field] ?? 0)} onChange={e => updateRow(index, field, e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4" onClick={() => !saving && onClose()}><div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">{account}</h2><p className="mt-1 text-sm text-slate-400">Input manual hingga 5 iklan untuk {month}. Tidak wajib mengisi semua.</p></div><button onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-400"><X size={18} /></button></div><div className="mt-5 space-y-3">{rows.map((row, index) => <div key={row.adNumber} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 font-semibold">Iklan {row.adNumber}</div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Iklan Awareness</div><div className="mt-3 grid gap-3 sm:grid-cols-4">{input(index, 'awarenessReach', 'Reach')}{input(index, 'awarenessInteractions', 'Interaksi')}{input(index, 'awarenessVisits', 'Kunjungan')}{input(index, 'awarenessNewFollowers', 'Follower baru')}</div></div>{account !== 'IG gsaindonesia' && <div className="mt-3 rounded-xl bg-slate-50 p-3"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{account === 'Facebook' ? 'Iklan Sales (Facebook dan IG gsaindonesia)' : 'Iklan Sales'}</div><div className="mt-3 grid gap-3 sm:grid-cols-2">{account === 'Facebook' && input(index, 'salesReach', 'Reach')}{input(index, 'salesClicks', 'Klik chat')}</div></div>}</div>)}</div><div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white"><div className="text-xs opacity-70">Total {account}</div><div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-6"><div><div className="opacity-70">Reach</div><div className="font-bold">{total.reach.toLocaleString('id-ID')}</div></div><div><div className="opacity-70">Interaksi</div><div className="font-bold">{total.interactions.toLocaleString('id-ID')}</div></div><div><div className="opacity-70">Kunjungan</div><div className="font-bold">{total.visits.toLocaleString('id-ID')}</div></div><div><div className="opacity-70">Follower baru</div><div className="font-bold">{total.followers.toLocaleString('id-ID')}</div></div>{account === 'Facebook' && <div><div className="opacity-70">Reach sales</div><div className="font-bold">{total.salesReach.toLocaleString('id-ID')}</div></div>}<div><div className="opacity-70">Klik chat</div><div className="font-bold">{total.salesClicks.toLocaleString('id-ID')}</div></div></div></div><button disabled={saving} onClick={() => void save()} className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-40">{saving ? 'Menyimpan...' : 'Simpan semua data'}</button>{saveError && <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</div>}</div></div>;
}function EngagementView({ engagements, metrics, youtubeMetrics, contents, onAddEngagement, onUpdateEngagement, onDeleteEngagement, onSelectMetric, onSelectYoutubeMetric, canEdit }: { engagements: EngagementRecord[]; metrics: EngagementMetric[]; youtubeMetrics: YoutubeEngagement[]; contents: Content[]; onAddEngagement: (item: EngagementRecord) => void; onUpdateEngagement: (item: EngagementRecord) => void; onDeleteEngagement: (id: string) => void; onSelectMetric: (item: EngagementMetric) => void; onSelectYoutubeMetric: (item: YoutubeEngagement) => void; canEdit: boolean }) {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 1);
  const monthNow = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(monthNow);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<EngagementRecord | null>(null);
  const [inboxAccount, setInboxAccount] = useState<'All' | Account>('All');
  const [inboxType, setInboxType] = useState<'All' | 'Inbox' | 'Komentar'>('All');
  const [inboxStartDate, setInboxStartDate] = useState('');
  const [inboxEndDate, setInboxEndDate] = useState('');
  const [showInboxFilters, setShowInboxFilters] = useState(false);
  const socialAccounts = accounts.filter(account => account !== 'Youtube');
  const filteredMetrics = socialAccounts.map(account => metrics.find(x => x.account === account && x.month === month) ?? { id: account + '-' + month, account, month, reach: 0, interactions: 0, profileVisits: 0 });
  const youtubeMetric = youtubeMetrics.find(x => x.month === month) ?? { id: 'Youtube-' + month, account: 'Youtube' as const, month, views: 0, impressions: 0, ctrImpression: 0 };
  const totalReach = filteredMetrics.reduce((sum, x) => sum + x.reach, 0);
  const totalInteractions = filteredMetrics.reduce((sum, x) => sum + x.interactions, 0);
  const totalProfileVisits = filteredMetrics.reduce((sum, x) => sum + x.profileVisits, 0);
  const totalRate = totalReach > 0 ? (totalInteractions / totalReach) * 100 : 0;
  const rate = (item: EngagementMetric) => item.reach > 0 ? (item.interactions / item.reach) * 100 : 0;
  const inboxDate = (item: EngagementRecord) => item.date || String(item.createdAt || '').slice(0, 10);
  const filteredEngagements = engagements.filter(item => {
    const itemDate = inboxDate(item);
    const matchesAccount = inboxAccount === 'All' || item.account === inboxAccount;
    const matchesType = inboxType === 'All' || item.type === inboxType;
    const matchesStart = !inboxStartDate || itemDate >= inboxStartDate;
    const matchesEnd = !inboxEndDate || itemDate <= inboxEndDate;
    return matchesAccount && matchesType && matchesStart && matchesEnd;
  }).sort((a, b) => {
    const dateCompare = inboxDate(b).localeCompare(inboxDate(a));
    if (dateCompare !== 0) return dateCompare;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  const resetInboxFilters = () => { setInboxAccount('All'); setInboxType('All'); setInboxStartDate(''); setInboxEndDate(''); };
  return <><section><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Performance engagement</h2><p className="mt-1 text-sm text-slate-400">Reach, interaksi, dan engagement rate tiap akun berdasarkan bulan.</p></div><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div><div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-4"><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Total reach</div><div className="mt-2 text-2xl font-bold">{totalReach.toLocaleString('id-ID')}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Total interaksi</div><div className="mt-2 text-2xl font-bold">{totalInteractions.toLocaleString('id-ID')}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Kunjungan profil</div><div className="mt-2 text-2xl font-bold">{totalProfileVisits.toLocaleString('id-ID')}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-slate-400">Engagement rate</div><div className="mt-2 text-2xl font-bold">{totalRate.toFixed(2)}%</div><div className="mt-1 text-xs text-slate-400">Interaksi ÷ reach</div></div></div><div className="my-6 border-t border-slate-200"></div><div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{filteredMetrics.map(item => <button key={item.id} disabled={!canEdit} onClick={() => canEdit && onSelectMetric(item)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md"><div className="flex items-center justify-between"><span className={'rounded-lg px-2 py-1 text-[10px] font-semibold ' + accountStyles[item.account]}>{item.account}</span><BarChart3 size={16} className="text-slate-300" /></div><div className="mt-4 text-xl font-bold">{item.reach.toLocaleString('id-ID')} reach</div><div className="mt-1 text-sm font-semibold text-slate-600">{item.interactions.toLocaleString('id-ID')} interaksi</div><div className="mt-1 text-sm font-semibold text-slate-600">{item.profileVisits.toLocaleString('id-ID')} kunjungan profil</div><div className="mt-2 text-sm font-bold">{rate(item).toFixed(2)}% engagement rate</div><div className="mt-2 text-[11px] text-slate-400">{month}</div></button>)}</div><div className="mt-4"><button disabled={!canEdit} onClick={() => canEdit && onSelectYoutubeMetric(youtubeMetric)} className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md"><div className="flex items-center justify-between"><span className={'rounded-lg px-2 py-1 text-[10px] font-semibold ' + accountStyles.Youtube}>Youtube</span><BarChart3 size={16} className="text-slate-300" /></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><div className="text-xs text-slate-400">Views</div><div className="mt-1 text-xl font-bold">{youtubeMetric.views.toLocaleString('id-ID')}</div></div><div><div className="text-xs text-slate-400">Impression</div><div className="mt-1 text-xl font-bold">{youtubeMetric.impressions.toLocaleString('id-ID')}</div></div><div><div className="text-xs text-slate-400">CTR impression</div><div className="mt-1 text-xl font-bold">{youtubeMetric.ctrImpression.toFixed(2)}%</div></div></div><div className="mt-4 text-[11px] text-slate-400">Klik kartu untuk input manual · {month}</div></button></div></section><section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div className="flex items-center gap-2"><h2 className="font-semibold">Inbox/Komentar</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{filteredEngagements.length}</span></div>{canEdit && <button onClick={() => setShowAdd(true)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Tambah</button>}</div><div className="border-b border-slate-100 p-3 md:hidden"><button type="button" onClick={() => setShowInboxFilters(prev => !prev)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"><Filter size={16} /> Filter</button></div><div className="hidden border-b border-slate-100 bg-slate-50 p-4 md:block"><div className="grid gap-3 md:grid-cols-5"><label className="text-xs font-semibold text-slate-600">Akun<select value={inboxAccount} onChange={e => setInboxAccount(e.target.value as 'All' | Account)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="All">Semua akun</option>{accounts.map(account => <option key={account} value={account}>{account}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Tipe<select value={inboxType} onChange={e => setInboxType(e.target.value as 'All' | 'Inbox' | 'Komentar')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="All">Semua tipe</option><option value="Inbox">Inbox</option><option value="Komentar">Komentar</option></select></label><label className="text-xs font-semibold text-slate-600">Tanggal mulai<input type="date" value={inboxStartDate} onChange={e => setInboxStartDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-600">Tanggal akhir<input type="date" value={inboxEndDate} onChange={e => setInboxEndDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label><button type="button" onClick={resetInboxFilters} className="self-end rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Reset</button></div></div>{showInboxFilters && <div className="border-b border-slate-100 bg-slate-50 p-4 md:hidden"><div className="grid gap-3"><label className="text-xs font-semibold text-slate-600">Akun<select value={inboxAccount} onChange={e => setInboxAccount(e.target.value as 'All' | Account)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="All">Semua akun</option>{accounts.map(account => <option key={account} value={account}>{account}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Tipe<select value={inboxType} onChange={e => setInboxType(e.target.value as 'All' | 'Inbox' | 'Komentar')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="All">Semua tipe</option><option value="Inbox">Inbox</option><option value="Komentar">Komentar</option></select></label><label className="text-xs font-semibold text-slate-600">Tanggal mulai<input type="date" value={inboxStartDate} onChange={e => setInboxStartDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-600">Tanggal akhir<input type="date" value={inboxEndDate} onChange={e => setInboxEndDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label><button type="button" onClick={resetInboxFilters} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">Reset</button></div></div>}<div className="divide-y divide-slate-100">{filteredEngagements.map(item => <div key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">{item.type}</span>{item.account && <span className={'rounded-lg px-2 py-1 text-[10px] font-semibold ' + accountStyles[item.account]}>{item.account}</span>}<span className="text-xs text-slate-400">{formatDate(inboxDate(item))}</span></div><div className="flex items-center gap-1">{canEdit && <><button type="button" onClick={() => setEditingEngagement(item)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Edit inbox/komentar"><Pencil size={16} /></button><button type="button" disabled={!canEdit} onClick={() => { if (canEdit && window.confirm('Hapus inbox/komentar ini?')) void api.delete('/api/engagements/' + encodeURIComponent(item.id)).then(() => onDeleteEngagement(item.id)); }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Hapus inbox/komentar"><Trash2 size={16} /></button></>}</div></div>{item.senderName && <div className="mt-3 text-sm font-semibold text-slate-800">{item.senderName}</div>}{item.message && <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.message}</div>}{item.type === 'Komentar' && item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-slate-600 underline">{item.link}</a>}</div>)}{filteredEngagements.length === 0 && <div className="p-10 text-center text-sm text-slate-400">Tidak ada data inbox/komentar sesuai filter.</div>}</div></section>{canEdit && showAdd && <EngagementForm onClose={() => setShowAdd(false)} onSave={(item) => { onAddEngagement(item); setShowAdd(false); }} />}{canEdit && editingEngagement && <EngagementForm engagement={editingEngagement} onClose={() => setEditingEngagement(null)} onSave={(item) => { onUpdateEngagement(item); setEditingEngagement(null); }} />}</>;
}

function YoutubeEngagementForm({ metric, onClose, onSaved }: { metric: YoutubeEngagement; onClose: () => void; onSaved: (item: YoutubeEngagement) => void }) {
  const [views, setViews] = useState(String(metric.views));
  const [impressions, setImpressions] = useState(String(metric.impressions));
  const [ctrImpression, setCtrImpression] = useState(String(metric.ctrImpression));
  const [month, setMonth] = useState(metric.month);
  const save = async () => { const res = await api.put('/api/youtube-engagement/' + encodeURIComponent(metric.id), { account: 'Youtube', month, views: Number(views) || 0, impressions: Number(impressions) || 0, ctrImpression: Number(ctrImpression) || 0 }); onSaved(res.data.item); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Youtube</h2><p className="mt-1 text-sm text-slate-400">Input data YouTube manual per bulan</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={18} /></button></div><div className="mt-6 grid gap-4"><label className="text-sm font-semibold">Bulan<input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Views<input type="number" min="0" value={views} onChange={e => setViews(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Impression<input type="number" min="0" value={impressions} onChange={e => setImpressions(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">CTR impression (%)<input type="number" min="0" step="0.01" value={ctrImpression} onChange={e => setCtrImpression(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label></div><button onClick={save} className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white">Simpan</button></div></div>;
}

function EngagementMetricForm({ metric, onClose, onSaved }: { metric: EngagementMetric; onClose: () => void; onSaved: (item: EngagementMetric) => void }) {
  const [reach, setReach] = useState(String(metric.reach)); const [interactions, setInteractions] = useState(String(metric.interactions)); const [profileVisits, setProfileVisits] = useState(String(metric.profileVisits)); const [month, setMonth] = useState(metric.month); const [account] = useState(metric.account);
  const save = async () => { const res = await api.put('/api/engagement-metrics/' + encodeURIComponent(metric.id), { account, month, reach: Number(reach) || 0, interactions: Number(interactions) || 0, profileVisits: Number(profileVisits) || 0 }); onSaved(res.data.item); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">{account}</h2><p className="mt-1 text-sm text-slate-400">Update performance bulanan</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={18} /></button></div><div className="mt-6 grid gap-4"><label className="text-sm font-semibold">Bulan<input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Reach<input type="number" min="0" value={reach} onChange={e => setReach(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Interaksi<input type="number" min="0" value={interactions} onChange={e => setInteractions(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Kunjungan profil<input type="number" min="0" value={profileVisits} onChange={e => setProfileVisits(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label><div className="rounded-xl bg-slate-50 p-3 text-sm"><span className="text-slate-400">Engagement rate</span><div className="mt-1 font-bold">{Number(reach) > 0 ? ((Number(interactions) || 0) / Number(reach) * 100).toFixed(2) : '0.00'}%</div><div className="mt-1 text-xs text-slate-400">Interaksi ÷ reach</div></div></div><button onClick={save} className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white">Simpan</button></div></div>;
}

function ContentRow({ item, onClick }: { item: Content; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-50"><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.title}</div><div className="mt-1 text-xs text-slate-400">{formatDate(item.date)} · {item.platform}</div></div><span className={'rounded-full px-2.5 py-1 text-[11px] font-semibold ' + statusStyles[item.status]}>{item.status}</span><ChevronRight size={16} className="text-slate-300" /></button>;
}


function EngagementForm({ engagement, onClose, onSave }: { engagement?: EngagementRecord; onClose: () => void; onSave: (item: EngagementRecord) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<EngagementType>(engagement?.type === 'Komentar' ? 'Komentar' : 'Inbox');
  const [account, setAccount] = useState<Account>((engagement?.account || 'Facebook') as Account);
  const [date, setDate] = useState(engagement?.date || today);
  const [senderName, setSenderName] = useState(engagement?.senderName || '');
  const [message, setMessage] = useState(engagement?.message || '');
  const [link, setLink] = useState(engagement?.link || '');
  const isEdit = Boolean(engagement?.id);
  const save = async () => {
    if (!message.trim() || !account || !date) return;
    const payload = { type, account, date, senderName: senderName.trim(), message: message.trim(), link: type === 'Komentar' ? link.trim() : '', status: engagement?.status || 'Belum dibalas', note: engagement?.note || '', contentId: engagement?.contentId || '' };
    const res = isEdit
      ? await api.put('/api/engagements/' + encodeURIComponent(engagement!.id), payload)
      : await api.post('/api/engagements', payload);
    onSave(res.data.item as EngagementRecord);
  };
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}><div className="my-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">{isEdit ? 'Edit inbox/komentar' : 'Tambah inbox/komentar'}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={18} /></button></div><div className="mt-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Akun<select value={account} onChange={e => setAccount(e.target.value as Account)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal">{accounts.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-sm font-semibold">Tanggal<input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal" /></label></div><div className="mt-4"><div className="text-sm font-semibold">Tipe</div><div className="mt-2 flex gap-2"><button type="button" onClick={() => setType('Inbox')} className={'flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ' + (type === 'Inbox' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200')}>Inbox</button><button type="button" onClick={() => setType('Komentar')} className={'flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ' + (type === 'Komentar' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200')}>Komentar</button></div></div><label className="mt-4 block text-sm font-semibold">Nama akun<input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Nama akun yang mengirim inbox/komentar" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label><label className="mt-4 block text-sm font-semibold">{type === 'Komentar' ? 'Isi komentar' : 'Isi inbox'}<textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={type === 'Komentar' ? 'Tulis isi komentar...' : 'Tulis isi inbox...'} rows={8} className="mt-2 w-full min-h-40 resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6" /></label>{type === 'Komentar' && <label className="mt-4 block text-sm font-semibold">Link konten<input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>}</div><button disabled={!message.trim() || !account || !date} onClick={() => void save()} className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-40">{isEdit ? 'Simpan perubahan' : 'Simpan'}</button></div></div>;
}

function ContentCard({
  item,
  canEdit,
  onClick,
  onEdit,
}: {
  item: Content;
  canEdit: boolean;
  onClick: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={'rounded-lg px-2 py-1 text-[10px] font-semibold ' + accountStyles[item.platform]}>{item.platform}</span>
        {canEdit && <button onClick={onEdit} className="rounded-lg p-1 text-slate-300 hover:text-slate-900" aria-label="Edit content"><Pencil size={14} /></button>}
      </div>
      <button onClick={onClick} className="mt-3 block w-full text-left">
        <div className="line-clamp-2 text-sm font-semibold leading-5">{item.title}</div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>{formatDate(item.date)}</span>
          <span className={'rounded-full px-2 py-1 font-semibold ' + statusStyles[item.status]}>{item.status}</span>
        </div>
      </button>
    </div>
  );
}

export default App;
