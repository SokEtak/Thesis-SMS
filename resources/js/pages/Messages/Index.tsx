import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { type PaginatedData } from '@/types';
import { type Message } from '@/types/models';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Eye, FilePlus2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option { id: number; name: string; email?: string | null; }
interface Props { messages: PaginatedData<Message>; users: Option[]; query: Record<string, unknown>; }
interface MessageFormState { sender_id: string; receiver_id: string; message_body: string; is_read: '1' | '0'; }
interface BatchRow { key: number; sender_id: string; receiver_id: string; message_body: string; is_read: '1' | '0'; }

const READ_OPTIONS = [{ value: '1', label: 'Read' }, { value: '0', label: 'Unread' }] as const;
type SortBy = 'id' | 'is_read' | 'created_at';

const createForm = (): MessageFormState => ({ sender_id: '', receiver_id: '', message_body: '', is_read: '0' });
const createBatchRow = (key: number): BatchRow => ({ key, sender_id: '', receiver_id: '', message_body: '', is_read: '0' });
const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function Index({ messages, users, query }: Props) {
  const qf = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(qf?.q ?? ''));
  const [senderId, setSenderId] = useState(String(query.sender_id ?? qf?.sender_id ?? ''));
  const [receiverId, setReceiverId] = useState(String(query.receiver_id ?? qf?.receiver_id ?? ''));
  const [isRead, setIsRead] = useState(String(query.is_read ?? qf?.is_read ?? ''));
  const [sortBy, setSortBy] = useState<SortBy>(query.sort_by === 'is_read' || query.sort_by === 'created_at' ? query.sort_by : 'id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(query.sort_dir === 'desc' ? 'desc' : 'asc');
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [shiftMode, setShiftMode] = useState(false);
  const [isBatchPreviewOpen, setIsBatchPreviewOpen] = useState(false);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchCreateOpen, setIsBatchCreateOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [formState, setFormState] = useState<MessageFormState>(createForm());
  const [batchRows, setBatchRows] = useState<BatchRow[]>([createBatchRow(1)]);
  const [batchEditState, setBatchEditState] = useState<'1' | '0' | ''>('');
  const [batchDeleteLimit, setBatchDeleteLimit] = useState<string>('all');
  const queryRef = useRef<Record<string, unknown>>(query);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const nextKeyRef = useRef(2);

  const applySearch = (page = 1, perPage?: number, sortByOverride?: SortBy, sortDirOverride?: 'asc' | 'desc') => {
    const nextSortBy = sortByOverride ?? sortBy;
    const nextSortDir = sortDirOverride ?? sortDir;
    const nextQuery: Record<string, unknown> = { ...queryRef.current, page, sort_by: nextSortBy, sort_dir: nextSortDir, sort: nextSortDir === 'desc' ? `-${nextSortBy}` : nextSortBy };
    delete nextQuery.filter;
    if (perPage && perPage > 0) nextQuery.per_page = perPage;
    if (search.trim()) nextQuery.q = search.trim(); else delete nextQuery.q;
    if (senderId.trim()) nextQuery.sender_id = senderId.trim(); else delete nextQuery.sender_id;
    if (receiverId.trim()) nextQuery.receiver_id = receiverId.trim(); else delete nextQuery.receiver_id;
    if (isRead.trim()) nextQuery.is_read = isRead.trim(); else delete nextQuery.is_read;
    router.get(route('messages.index', nextQuery), {}, { preserveState: true, preserveScroll: true, replace: true, only: ['messages', 'query'] });
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return messages.data.filter((item) => {
      const matchSearch = !term || [item.id, item.sender_name, item.receiver_name, item.message_body, item.is_read ? 'read' : 'unread'].map((value) => String(value ?? '').toLowerCase()).some((value) => value.includes(term));
      const matchSender = !senderId || Number(item.sender_id) === Number(senderId);
      const matchReceiver = !receiverId || Number(item.receiver_id) === Number(receiverId);
      const matchRead = !isRead || Number(item.is_read ? 1 : 0) === Number(isRead);
      return matchSearch && matchSender && matchReceiver && matchRead;
    });
  }, [isRead, messages.data, receiverId, search, senderId]);

  const suggestions = useMemo<SearchSuggestion[]>(() => search.trim() ? rows.map((item) => ({ id: item.id, label: `${item.sender_name ?? '-'} -> ${item.receiver_name ?? '-'}` })).slice(0, 8) : [], [rows, search]);
  const selectedIds = useMemo(() => selectedKeys.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0), [selectedKeys]);
  const selectedRows = useMemo(() => {
    const idSet = new Set(selectedIds);
    return messages.data.filter((item) => idSet.has(item.id));
  }, [messages.data, selectedIds]);

  const batchDeleteIds = useMemo(() => {
    if (batchDeleteLimit === 'all') return selectedIds;
    const limit = Number(batchDeleteLimit);
    if (!Number.isFinite(limit) || limit <= 0) return selectedIds;
    return selectedIds.slice(0, limit);
  }, [batchDeleteLimit, selectedIds]);

  const batchDeleteRows = useMemo(() => {
    const idSet = new Set(batchDeleteIds);
    return rows.filter((item) => idSet.has(item.id));
  }, [batchDeleteIds, rows]);

  const userOptions: SearchableSelectOption[] = users.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined }));
  const readOptions: SearchableSelectOption[] = READ_OPTIONS.map((item) => ({ value: item.value, label: item.label }));

  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'sender_name', label: 'Sender', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'receiver_name', label: 'Receiver', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'message_body', label: 'Message', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'is_read', label: 'State', render: (value: unknown) => <Badge variant="outline">{value ? 'Read' : 'Unread'}</Badge> },
  ];

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { sender_id: parseNullableId(formState.sender_id), receiver_id: parseNullableId(formState.receiver_id), message_body: formState.message_body.trim() === '' ? null : formState.message_body.trim(), is_read: formState.is_read === '1' };
    if (!payload.sender_id || !payload.receiver_id) return alert('Sender and receiver are required.');
    setIsSubmitting(true);
    router.post(route('messages.store'), payload, { preserveScroll: true, onSuccess: () => { setIsCreateOpen(false); setFormState(createForm()); }, onFinish: () => setIsSubmitting(false) });
  };

  const submitBatchCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const items = batchRows.map((row) => ({ sender_id: parseNullableId(row.sender_id), receiver_id: parseNullableId(row.receiver_id), message_body: row.message_body.trim() === '' ? null : row.message_body.trim(), is_read: row.is_read === '1' })).filter((row) => row.sender_id && row.receiver_id);
    if (items.length === 0) return alert('Add at least one valid row.');
    const ok = await requirePasswordConfirmation('batch create messages');
    if (!ok) return;
    router.post(route('messages.batchStore'), { items }, { preserveScroll: true, onSuccess: () => { setIsBatchCreateOpen(false); setBatchRows([createBatchRow(1)]); } });
  };

  return (
    <AppLayout>
      <Head title="Messages" />
      <ResourcePageLayout
        title="Messages"
        description="Manage system messages with reusable filters and batch workflows."
        actions={(
          <>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" asChild><a href={route('messages.export.csv')}><Download className="size-4" /></a></Button></TooltipTrigger><TooltipContent side="top" align="center">Export CSV</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" onClick={() => importInputRef.current?.click()}><Upload className="size-4" /></Button></TooltipTrigger><TooltipContent side="top" align="center">Import</TooltipContent></Tooltip>
            <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); router.post(route('messages.import'), fd, { forceFormData: true, preserveScroll: true }); }} />
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" asChild><Link href={route('messages.trashed')}><Trash2 className="size-4" /></Link></Button></TooltipTrigger><TooltipContent side="top" align="center">Trashed</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" onClick={() => setIsBatchCreateOpen(true)}><Plus className="size-4" /></Button></TooltipTrigger><TooltipContent side="top" align="center">Batch Create</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" className="size-9 p-0" onClick={() => setIsCreateOpen(true)}><FilePlus2 className="size-4" /></Button></TooltipTrigger><TooltipContent side="top" align="center">Create</TooltipContent></Tooltip>
          </>
        )}
        filters={(
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-semibold">{messages.total ?? messages.data.length}</p></CardContent></Card>
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Read</p><p className="text-2xl font-semibold">{rows.filter((item) => item.is_read).length}</p></CardContent></Card>
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Unread</p><p className="text-2xl font-semibold">{rows.filter((item) => !item.is_read).length}</p></CardContent></Card>
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Senders</p><p className="text-2xl font-semibold">{new Set(rows.map((item) => item.sender_id)).size}</p></CardContent></Card>
            </div>
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-4"><LiveSearchInput value={search} suggestions={suggestions} onChange={setSearch} onSelectSuggestion={(item) => { setSearch(item.label); applySearch(1); }} onSubmit={() => applySearch(1)} /></div>
              <div className="lg:col-span-2"><SearchableSelect value={senderId} options={userOptions} onChange={setSenderId} placeholder="Sender" searchPlaceholder="Search sender..." /></div>
              <div className="lg:col-span-2"><SearchableSelect value={receiverId} options={userOptions} onChange={setReceiverId} placeholder="Receiver" searchPlaceholder="Search receiver..." /></div>
              <div className="lg:col-span-2"><SearchableSelect value={isRead} options={readOptions} onChange={setIsRead} placeholder="State" searchPlaceholder="Search state..." /></div>
              <div className="lg:col-span-1"><Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="id">ID</SelectItem><SelectItem value="is_read">State</SelectItem><SelectItem value="created_at">Created</SelectItem></SelectContent></Select></div>
              <div className="lg:col-span-1"><Select value={sortDir} onValueChange={(value: 'asc' | 'desc') => setSortDir(value === 'desc' ? 'desc' : 'asc')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asc">Asc</SelectItem><SelectItem value="desc">Desc</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => applySearch(1, undefined, sortBy, sortDir)}>Apply</Button><Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSenderId(''); setReceiverId(''); setIsRead(''); setSortBy('id'); setSortDir('asc'); setTimeout(() => applySearch(1, undefined, 'id', 'asc'), 0); }}>Clear</Button></div>
          </div>
        )}
      >
        <BatchActionBar selectedCount={selectedIds.length} onViewSelected={() => setIsBatchPreviewOpen(true)} onEditSelected={() => setIsBatchEditOpen(true)} onDeleteSelected={() => setIsBatchDeleteOpen(true)} onClearSelection={() => setSelectedKeys([])} shiftModeEnabled={shiftMode} onToggleShiftMode={() => setShiftMode((value) => !value)} editActionLabel="Batch Edit State" actionOrder={['view', 'edit', 'delete', 'clear']} />
        <DataTable tableId="messages-index" columns={columns} data={rows} actions={[{ key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline', onClick: (row: Message) => { setSelectedMessage(row); setIsViewOpen(true); } }, { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline', onClick: (row: Message) => { setSelectedMessage(row); setFormState({ sender_id: String(row.sender_id ?? ''), receiver_id: String(row.receiver_id ?? ''), message_body: row.message_body ?? '', is_read: row.is_read ? '1' : '0' }); setIsEditOpen(true); } }, { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline', onClick: (row: Message) => router.delete(route('messages.destroy', row.id), { preserveScroll: true }) }]} selectableRows selectedRowKeys={selectedKeys} onSelectedRowKeysChange={(keys) => setSelectedKeys(keys as Array<string | number>)} rangeSelectMode={shiftMode} pagination={messages as any} onPageChange={(page) => applySearch(page, undefined, sortBy, sortDir)} perPage={Number(query.per_page) > 0 ? Number(query.per_page) : 15} onPerPageChange={(value) => applySearch(1, value, sortBy, sortDir)} />
      </ResourcePageLayout>

      <Dialog open={isBatchCreateOpen} onOpenChange={setIsBatchCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Batch Create Messages</DialogTitle><DialogDescription>Create multiple rows in one submit.</DialogDescription></DialogHeader>
          <form className="space-y-3" onSubmit={submitBatchCreate}>
            {batchRows.map((row, index) => (
              <div key={row.key} className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex items-center justify-between"><Badge variant="outline">Row {index + 1}</Badge><Button type="button" variant="ghost" size="sm" onClick={() => setBatchRows((current) => current.length === 1 ? current : current.filter((item) => item.key !== row.key))}><Trash2 className="size-4" /></Button></div>
                <div className="grid gap-3 md:grid-cols-2">
                  <SearchableSelect value={row.sender_id} options={userOptions} onChange={(value) => setBatchRows((current) => current.map((item) => item.key === row.key ? { ...item, sender_id: value } : item))} placeholder="Sender" searchPlaceholder="Search sender..." clearable={false} />
                  <SearchableSelect value={row.receiver_id} options={userOptions} onChange={(value) => setBatchRows((current) => current.map((item) => item.key === row.key ? { ...item, receiver_id: value } : item))} placeholder="Receiver" searchPlaceholder="Search receiver..." clearable={false} />
                  <textarea value={row.message_body} onChange={(event) => setBatchRows((current) => current.map((item) => item.key === row.key ? { ...item, message_body: event.target.value } : item))} className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Optional message" />
                  <SearchableSelect value={row.is_read} options={readOptions} onChange={(value) => setBatchRows((current) => current.map((item) => item.key === row.key ? { ...item, is_read: value === '1' ? '1' : '0' } : item))} placeholder="State" searchPlaceholder="Search state..." clearable={false} />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between"><Button type="button" variant="outline" onClick={() => setBatchRows((current) => [...current, createBatchRow(nextKeyRef.current++)])}><Plus className="size-4" />Add Row</Button><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setIsBatchCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting}><FilePlus2 className="size-4" />Create</Button></div></div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
