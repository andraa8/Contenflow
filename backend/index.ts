import { router, json, error } from '@appdeploy/sdk';
import { db } from '@appdeploy/sdk';

type ContentRecord = {
  title: string;
  caption: string;
  date: string;
  platform: string;
  status: string;
  contentType: string;
  products: string[];
  pillar?: string;
  format: string;
};

type FollowerRecord = { account: string; currentFollowers: number; newFollowers: number; updatedAt: string };
type FollowerChangeRecord = { account: string; change: number; updatedAt: string; month?: string; currentFollowers?: number; restored?: boolean };
type EngagementRecord = { contentId?: string; account: string; senderName?: string; type: string; message: string; link?: string; status: string; note: string; createdAt: string; date?: string };
type EngagementMetric = { account: string; month: string; reach: number; interactions: number; profileVisits: number; updatedAt: string };
type YoutubeEngagementRecord = { account: 'Youtube'; month: string; views: number; impressions: number; ctrImpression: number; updatedAt: string };
type AdPerformanceRecord = { account: string; month: string; adNumber?: number; awarenessReach: number; awarenessInteractions: number; awarenessVisits: number; awarenessNewFollowers: number; salesReach: number; salesClicks: number; updatedAt: string };

type IdeaRecord = {
  text: string;
  pillar: string;
  createdAt: string;
  links: string[];
};

const seedContents: ContentRecord[] = [
  {
    title: '3 cara membuat hook yang menghentikan scroll',
    caption: 'Hook yang bagus membuat orang berhenti sebelum mereka lanjut scroll.',
    date: '2026-09-27',
    platform: 'IG gsaindonesia',
    status: 'Post',
    pillar: 'Education',
    format: 'Carousel',
  },
  {
    title: 'Behind the scenes: proses produksi',
    caption: 'Sedikit cerita di balik layar dari proses produksi minggu ini.',
    date: '2026-09-29',
    platform: 'TikTok',
    status: 'Done',
    pillar: 'Behind the Scenes',
    format: 'Reel',
  },
  {
    title: 'Kesalahan strategi konten yang sering terjadi',
    caption: 'Strategi yang jelas membuat setiap post punya tujuan.',
    date: '2026-09-30',
    platform: 'Facebook',
    status: 'Done',
    pillar: 'Education',
    format: 'Text',
  },
  {
    title: 'Customer story: dari ide menjadi hasil',
    caption: 'Cerita singkat tentang proses yang konsisten.',
    date: '2026-10-02',
    platform: 'IG acpgoodsense',
    status: 'Draft',
    pillar: 'Testimonial',
    format: 'Image',
  },
  {
    title: 'Promo akhir bulan',
    caption: 'Penawaran khusus untuk komunitas selama akhir bulan.',
    date: '2026-09-28',
    platform: 'IG acpgrh',
    status: 'Post',
    pillar: 'Promotion',
    format: 'Image',
  },
];

const seedIdeas: IdeaRecord[] = [
  { text: 'Checklist sebelum publish Reel', pillar: 'Education', createdAt: '2026-09-25', links: [] },
  { text: 'Cerita kegagalan campaign pertama dan pelajarannya', pillar: 'Behind the Scenes', createdAt: '2026-09-24', links: [] },
  { text: 'Perbandingan organic vs paid content', pillar: 'Education', createdAt: '2026-09-23', links: [] },
  { text: 'FAQ yang paling sering ditanyakan customer', pillar: 'Education', createdAt: '2026-09-22', links: [] },
];

const allowedAccounts = ['Facebook', 'TikTok', 'IG gsaindonesia', 'IG acpgoodsense', 'IG acpgrh', 'IG sealantgrh', 'Youtube'];
const allowedStatuses = ['Draft', 'Done', 'Post'];
const allowedContentTypes = ['Perusahaan', 'Produk', 'Umum'];
const allowedProducts = ['ACP', 'WPC', 'CCB', 'SPC Flooring', 'Flexible Stone', 'Sealant'];

function normalizeContentType(value: string) {
  return allowedContentTypes.includes(value) ? value : 'Umum';
}

function normalizeProducts(values: unknown, contentType: string) {
  if (contentType !== 'Produk' || !Array.isArray(values)) return [];
  return Array.from(new Set(values.map(value => String(value)).filter(value => allowedProducts.includes(value))));
}

function normalizeStatus(status: string) {
  if (status === 'Post' || status === 'Scheduled') return 'Post';
  if (status === 'Done' || status === 'Review' || status === 'Approved') return 'Done';
  return 'Draft';
}

function normalizeAccount(platform: string) {
  const values = String(platform || '').split(' | ').map(x => x.trim()).filter(Boolean);
  if (values.length === 0) return '';
  const normalized = values.map(value => {
    if (allowedAccounts.includes(value)) return value;
    if (value === 'Instagram') return 'IG gsaindonesia';
    if (value === 'LinkedIn') return 'Facebook';
    return '';
  }).filter(Boolean);
  return Array.from(new Set(normalized)).join(' | ');
}

function contentKey(item: ContentRecord) {
  return [item.title, item.caption, item.date, item.platform, normalizeStatus(item.status), item.pillar, item.format].join('||');
}

async function ensureSeeds() {
  const existing = await db.list<ContentRecord>('content', { limit: 50 });
  if (existing.items.length > 0) {
    const seedKeys = new Set(seedContents.map(contentKey));
    const demoIds = existing.items.filter(item => seedKeys.has(contentKey(item))).map(item => item.id).filter(Boolean);
    if (demoIds.length > 0) await db.delete('content', demoIds);
  }

  const currentContent = await db.list<ContentRecord>('content', { limit: 50 });
  if (currentContent.items.length > 0) {
    const updates = currentContent.items
      .map(item => {
        const normalizedStatus = normalizeStatus(item.status);
        const next = {
          ...item,
          platform: normalizeAccount(item.platform),
          status: normalizedStatus,
          date: normalizedStatus === 'Post' ? item.date : '',
          contentType: normalizeContentType(item.contentType),
          products: normalizeProducts(item.products, normalizeContentType(item.contentType)),
        };
        if (next.platform !== item.platform || next.status !== item.status) {
          return { id: item.id, record: next };
        }
        return null;
      })
      .filter((x): x is { id: string; record: ContentRecord } => x !== null);
    if (updates.length > 0) await db.update('content', updates);
  }

  const followerRows = await db.list<FollowerRecord>('followers', { limit: 20 });
  const ig = followerRows.items.find(item => item.account === 'IG gsaindonesia');
  const followerHistory = await db.list<FollowerChangeRecord>('follower_changes', { limit: 1000 });
  const alreadyRestored = followerHistory.items.some(item => item.account === 'IG gsaindonesia' && item.restored === true);
  if (ig && !alreadyRestored && Number(ig.newFollowers) === 13) {
    const restoreDate = String(ig.updatedAt || new Date().toISOString().slice(0, 10));
    const restoreMonth = restoreDate.slice(0, 7);
    const restoredCurrent = Math.max(0, Number(ig.currentFollowers) - 13);
    await db.add('follower_changes', [{ account: 'IG gsaindonesia', change: 28, month: restoreMonth, updatedAt: restoreDate, currentFollowers: restoredCurrent, restored: true }]);
  }

  const ideaList = await db.list<IdeaRecord>('ideas', { limit: 50 });
  if (ideaList.items.length > 0) {
    const updates = ideaList.items
      .map(item => {
        const links = Array.isArray(item.links) ? item.links.slice(0, 5) : [];
        if (links.length !== (item.links?.length ?? 0)) {
          return { id: item.id, record: { ...item, links } };
        }
        return null;
      })
      .filter((x): x is { id: string; record: IdeaRecord } => x !== null);
    if (updates.length > 0) await db.update('ideas', updates);
  }
}

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],

  'GET /api/followers': [
    async () => {
      const result = await db.list<FollowerRecord>('followers', { limit: 20 });
      const byAccount = new Map(result.items.map(item => [item.account, item]));
      const items = allowedAccounts.map(account => byAccount.get(account) ?? { id: account, account, currentFollowers: 0, newFollowers: 0, updatedAt: '' });
      return json({ items });
    },
  ],

  'GET /api/follower-changes': [
    async () => {
      const result = await db.list<FollowerChangeRecord>('follower_changes', { limit: 1000 });
      const items = result.items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      return json({ items });
    },
  ],

  'PUT /api/followers/:id': [
    async ({ params, body }) => {
      const input = body as Partial<FollowerRecord>;
      const account = String(input.account || params.id);
      if (!allowedAccounts.includes(account)) return error('Invalid account', 400);
      const currentFollowers = Math.max(0, Number(input.currentFollowers) || 0);
      const newFollowers = Number(input.newFollowers) || 0;
      const rawUpdatedAt = String(input.updatedAt || new Date().toISOString().slice(0, 10));
      const updatedAt = /^\d{4}-\d{2}-\d{2}$/.test(rawUpdatedAt) ? rawUpdatedAt : new Date().toISOString().slice(0, 10);
      const selectedMonth = String((input as any).month || updatedAt.slice(0, 7));
      if (!/^\d{4}-\d{2}$/.test(selectedMonth) || !/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) return error('Invalid follower date or month', 400);
      const existing = (await db.list<FollowerRecord>('followers', { limit: 20 })).items.find(item => item.account === account);
      const shouldUpdateCurrent = !existing?.updatedAt || selectedMonth >= String(existing.updatedAt).slice(0, 7);
      const record = shouldUpdateCurrent
        ? { account, currentFollowers, newFollowers, updatedAt }
        : { account: existing?.account || account, currentFollowers: existing?.currentFollowers ?? currentFollowers, newFollowers: existing?.newFollowers ?? 0, updatedAt: existing?.updatedAt || updatedAt };
      const historyItems = (await db.list<FollowerChangeRecord>('follower_changes', { limit: 1000 })).items;
      const existingSnapshot = historyItems.find(item => item.account === account && String(item.month || item.updatedAt || '').slice(0, 7) === selectedMonth);
      const [historyId] = await db.add('follower_changes', [{ account, change: newFollowers, month: selectedMonth, updatedAt, currentFollowers }]);
      if (!historyId) return error('Could not record follower snapshot', 500);
      if (existing?.id) {
        const [ok] = await db.update('followers', [{ id: existing.id, record }]);
        if (!ok) return error('Could not update followers', 500);
        return json({ item: { ...record, id: existing.id } });
      }
      const [id] = await db.add('followers', [record]);
      if (!id) return error('Could not create followers', 500);
      return json({ item: { ...record, id } });
    },
  ],

  'GET /api/ad-performance': [
    async () => {
      const result = await db.list<AdPerformanceRecord>('ad_performance', { limit: 500 });
      const allowedAdAccounts = ['Facebook', 'IG gsaindonesia', 'TikTok'];
      const items = result.items.filter(item => allowedAdAccounts.includes(item.account)).map(item => ({ ...item, adNumber: Math.min(5, Math.max(1, Number(item.adNumber) || 1)), awarenessReach: Math.max(0, Number(item.awarenessReach) || 0), awarenessInteractions: Math.max(0, Number(item.awarenessInteractions) || 0), awarenessVisits: Math.max(0, Number(item.awarenessVisits) || 0), awarenessNewFollowers: Math.max(0, Number(item.awarenessNewFollowers) || 0), salesReach: Math.max(0, Number(item.salesReach) || 0), salesClicks: Math.max(0, Number(item.salesClicks) || 0) }));
      return json({ items });
    },
  ],

  'POST /api/ad-performance': [
    async ({ body }) => {
      const input = body as Partial<AdPerformanceRecord>;
      const account = String(input.account || '');
      const month = String(input.month || '').slice(0, 7);
      const adNumber = Math.min(5, Math.max(1, Number(input.adNumber) || 1));
      const allowedAdAccounts = ['Facebook', 'IG gsaindonesia', 'TikTok'];
      if (!allowedAdAccounts.includes(account) || !/^\d{4}-\d{2}$/.test(month)) return error('Invalid advertising account or month', 400);
      const record = { account, month, adNumber, awarenessReach: Math.max(0, Number(input.awarenessReach) || 0), awarenessInteractions: Math.max(0, Number(input.awarenessInteractions) || 0), awarenessVisits: Math.max(0, Number(input.awarenessVisits) || 0), awarenessNewFollowers: Math.max(0, Number(input.awarenessNewFollowers) || 0), salesReach: Math.max(0, Number(input.salesReach) || 0), salesClicks: Math.max(0, Number(input.salesClicks) || 0), updatedAt: new Date().toISOString() };
      const existingItems = (await db.list<AdPerformanceRecord>('ad_performance', { limit: 500 })).items;
      const existing = existingItems.find(x => x.account === account && x.month === month && (Number(x.adNumber) || 1) === adNumber);
      if (existing?.id) return json({ item: { ...record, id: existing.id } });
      const [id] = await db.add('ad_performance', [record]);
      if (!id) return error('Could not create ad performance', 500);
      return json({ item: { ...record, id } });
    },
  ],

  'PUT /api/ad-performance/:id': [
    async ({ body, params }) => {
      const input = body as Partial<AdPerformanceRecord>;
      const account = String(input.account || '');
      const month = String(input.month || '').slice(0, 7);
      const adNumber = Math.min(5, Math.max(1, Number(input.adNumber) || 1));
      const allowedAdAccounts = ['Facebook', 'IG gsaindonesia', 'TikTok'];
      if (!allowedAdAccounts.includes(account) || !/^\d{4}-\d{2}$/.test(month)) return error('Invalid advertising account or month', 400);
      const existingItems = (await db.list<AdPerformanceRecord>('ad_performance', { limit: 500 })).items;
      const existing = existingItems.find(x => x.id === params.id);
      if (!existing) return error('Ad performance record not found', 404);
      const record = { account, month, adNumber, awarenessReach: Math.max(0, Number(input.awarenessReach) || 0), awarenessInteractions: Math.max(0, Number(input.awarenessInteractions) || 0), awarenessVisits: Math.max(0, Number(input.awarenessVisits) || 0), awarenessNewFollowers: Math.max(0, Number(input.awarenessNewFollowers) || 0), salesReach: Math.max(0, Number(input.salesReach) || 0), salesClicks: Math.max(0, Number(input.salesClicks) || 0), updatedAt: new Date().toISOString() };
      const [ok] = await db.update('ad_performance', [{ id: existing.id, record }]);
      if (!ok) return error('Could not update ad performance', 500);
      return json({ item: { ...record, id: existing.id } });
    },
  ],

  'GET /api/youtube-engagement': [
    async () => {
      const result = await db.list<YoutubeEngagementRecord>('youtube_engagement', { limit: 500 });
      const items = result.items.filter(item => item.account === 'Youtube').map(item => ({ ...item, views: Math.max(0, Number(item.views) || 0), impressions: Math.max(0, Number(item.impressions) || 0), ctrImpression: Math.max(0, Number(item.ctrImpression) || 0) }));
      return json({ items });
    },
  ],

  'PUT /api/youtube-engagement/:id': [
    async ({ body }) => {
      const input = body as Partial<YoutubeEngagementRecord>;
      const month = String(input.month || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(month)) return error('Invalid month', 400);
      const record = { account: 'Youtube' as const, month, views: Math.max(0, Number(input.views) || 0), impressions: Math.max(0, Number(input.impressions) || 0), ctrImpression: Math.max(0, Number(input.ctrImpression) || 0), updatedAt: new Date().toISOString() };
      const existingItems = (await db.list<YoutubeEngagementRecord>('youtube_engagement', { limit: 500 })).items;
      const existing = existingItems.find(x => x.account === 'Youtube' && x.month === month);
      if (existing?.id) {
        const [ok] = await db.update('youtube_engagement', [{ id: existing.id, record }]);
        if (!ok) return error('Could not update YouTube engagement', 500);
        return json({ item: { ...record, id: existing.id } });
      }
      const [id] = await db.add('youtube_engagement', [record]);
      if (!id) return error('Could not create YouTube engagement', 500);
      return json({ item: { ...record, id } });
    },
  ],

  'GET /api/engagement-metrics': [
    async () => {
      const result = await db.list<EngagementMetric & { views?: number }>('engagement_metrics', { limit: 500 });
      const items = result.items.map(item => ({ ...item, reach: Math.max(0, Number(item.reach ?? item.views ?? 0)), interactions: Math.max(0, Number(item.interactions) || 0), profileVisits: Math.max(0, Number(item.profileVisits) || 0) }));
      return json({ items });
    },
  ],

  'PUT /api/engagement-metrics/:id': [
    async ({ params, body }) => {
      const input = body as Partial<EngagementMetric>;
      const account = String(input.account || '');
      const month = String(input.month || '').slice(0, 7);
      if (!allowedAccounts.includes(account) || !/^\d{4}-\d{2}$/.test(month)) return error('Invalid account or month', 400);
      const reach = Math.max(0, Number(input.reach) || 0);
      const interactions = Math.max(0, Number(input.interactions) || 0);
      const profileVisits = Math.max(0, Number(input.profileVisits) || 0);
      const existingItems = (await db.list<EngagementMetric>('engagement_metrics', { limit: 500 })).items;
      const existing = existingItems.find(x => x.account === account && x.month === month);
      const record = { account, month, reach, interactions, profileVisits, updatedAt: new Date().toISOString() };
      if (existing?.id) {
        const [ok] = await db.update('engagement_metrics', [{ id: existing.id, record }]);
        if (!ok) return error('Could not update engagement metrics', 500);
        return json({ item: { ...record, id: existing.id } });
      }
      const [id] = await db.add('engagement_metrics', [record]);
      if (!id) return error('Could not create engagement metrics', 500);
      return json({ item: { ...record, id } });
    },
  ],

  'GET /api/engagements': [
    async () => {
      const result = await db.list<EngagementRecord>('engagements', { limit: 100 });
      return json({ items: result.items });
    },
  ],

  'POST /api/engagements': [
    async ({ body }) => {
      const input = body as Partial<EngagementRecord>;
      const type = String(input.type || 'Inbox');
      if (!['Inbox', 'Komentar'].includes(type)) return error('Invalid inbox type', 400);
      const account = String(input.account || '');
      const date = String(input.date || '').slice(0, 10);
      const message = String(input.message || '').trim();
      const link = String(input.link || '').trim();
      if (!allowedAccounts.includes(account)) return error('Invalid account', 400);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return error('Invalid date', 400);
      if (!message) return error('Inbox or comment content is required', 400);
      const senderName = String(input.senderName || '').trim();
      const record = { contentId: '', account, senderName, type, message, link: type === 'Komentar' ? link : '', status: '', note: '', date, createdAt: new Date().toISOString() };
      const [id] = await db.add('engagements', [record]);
      if (!id) return error('Could not create engagement', 500);
      return json({ item: { ...record, id } }, 201);
    },
  ],

  'DELETE /api/engagements/:id': [
    async ({ params }) => {
      const [existing] = await db.get<EngagementRecord>('engagements', [params.id]);
      if (!existing) return error('Engagement not found', 404);
      const [ok] = await db.delete('engagements', [params.id]);
      if (!ok) return error('Could not delete engagement', 500);
      return json({ ok: true, id: params.id });
    },
  ],

  'PUT /api/engagements/:id': [
    async ({ params, body }) => {
      const [existing] = await db.get<EngagementRecord>('engagements', [params.id]);
      if (!existing) return error('Engagement not found', 404);
      const input = body as Partial<EngagementRecord>;
      const next = { ...existing, ...input, senderName: String(input.senderName ?? existing.senderName ?? '').trim(), account: String(input.account ?? existing.account), date: String(input.date ?? existing.date ?? '').slice(0, 10), message: String(input.message ?? existing.message ?? '').trim(), link: String(input.link ?? existing.link ?? '').trim(), type: String(input.type ?? existing.type) };
      const [ok] = await db.update('engagements', [{ id: params.id, record: next }]);
      if (!ok) return error('Could not update engagement', 500);
      return json({ item: { ...next, id: params.id } });
    },
  ],

  'GET /api/content': [
    async () => {
      await ensureSeeds();
      const result = await db.list<ContentRecord>('content', { limit: 50 });
      return json({ items: result.items });
    },
  ],

  'POST /api/content': [
    async ({ body }) => {
      const input = body as Partial<ContentRecord>;
      if (!input.title?.trim()) return error('Title is required', 400);
      const platform = normalizeAccount(input.platform ?? '');
      const status = normalizeStatus(input.status ?? 'Draft');
      if (status === 'Post' && !input.date) return error('Posting date is required when status is Post', 400);
      const record: ContentRecord = {
        title: input.title.trim(),
        caption: input.caption ?? '',
        date: status === 'Post' ? (input.date ?? '') : '',
        platform,
        status,
        contentType: normalizeContentType(input.contentType ?? 'Umum'),
        products: normalizeProducts(input.products, normalizeContentType(input.contentType ?? 'Umum')),
        pillar: input.pillar,
        format: input.format ?? 'Carousel',
      };
      const [id] = await db.add('content', [record]);
      if (!id) return error('Could not create content', 500);
      return json({ item: { ...record, id } }, 201);
    },
  ],

  'PUT /api/content/:id': [
    async ({ params, body }) => {
      const [existing] = await db.get<ContentRecord>('content', [params.id]);
      if (!existing) return error('Content not found', 404);
      const input = body as Partial<ContentRecord>;
      const nextStatus = normalizeStatus(input.status ?? existing.status);
      const nextDate = nextStatus === 'Post' ? (input.date ?? existing.date) : '';
      if (nextStatus === 'Post' && !nextDate) return error('Posting date is required when status is Post', 400);
      const next: ContentRecord = {
        ...existing,
        ...input,
        title: (input.title ?? existing.title).trim(),
        platform: normalizeAccount(input.platform ?? existing.platform),
        status: nextStatus,
        date: nextDate,
        contentType: normalizeContentType(input.contentType ?? existing.contentType ?? 'Umum'),
        products: normalizeProducts(input.products ?? existing.products, normalizeContentType(input.contentType ?? existing.contentType ?? 'Umum')),
      };
      const [ok] = await db.update('content', [{ id: params.id, record: next }]);
      if (!ok) return error('Could not update content', 500);
      return json({ item: { ...next, id: params.id } });
    },
  ],

  'DELETE /api/content/:id': [
    async ({ params }) => {
      const [ok] = await db.delete('content', [params.id]);
      if (!ok) return error('Could not delete content', 500);
      return json({ deleted: true });
    },
  ],

  'GET /api/ideas': [
    async () => {
      await ensureSeeds();
      const result = await db.list<IdeaRecord>('ideas', { limit: 50 });
      return json({ items: result.items });
    },
  ],

  'POST /api/ideas': [
    async ({ body }) => {
      const input = body as Partial<IdeaRecord>;
      if (!input.text?.trim()) return error('Idea text is required', 400);
      const links = Array.isArray(input.links) ? input.links.filter(Boolean).slice(0, 5) : [];
      const record: IdeaRecord = {
        text: input.text.trim(),
        pillar: input.pillar ?? 'Education',
        createdAt: new Date().toISOString().slice(0, 10),
        links,
      };
      const [id] = await db.add('ideas', [record]);
      if (!id) return error('Could not create idea', 500);
      return json({ item: { ...record, id } }, 201);
    },
  ],

  'DELETE /api/ideas/:id': [
    async ({ params }) => {
      const [ok] = await db.delete('ideas', [params.id]);
      if (!ok) return error('Could not delete idea', 500);
      return json({ deleted: true });
    },
  ],

  'PUT /api/ideas/:id': [
    async ({ params, body }) => {
      const [existing] = await db.get<IdeaRecord>('ideas', [params.id]);
      if (!existing) return error('Idea not found', 404);
      const input = body as Partial<IdeaRecord>;
      const links = Array.isArray(input.links) ? input.links.filter(Boolean).slice(0, 5) : (existing.links ?? []).slice(0, 5);
      const next: IdeaRecord = {
        ...existing,
        ...input,
        text: (input.text ?? existing.text).trim(),
        links,
      };
      const [ok] = await db.update('ideas', [{ id: params.id, record: next }]);
      if (!ok) return error('Could not update idea', 500);
      return json({ item: { ...next, id: params.id } });
    },
  ],
});
