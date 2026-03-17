import BatchActionBar from '@/components/BatchActionBar';
import DataTable from '@/components/DataTable';
import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import ResourcePageActions from '@/components/ResourcePageActions';
import ResourcePageLayout from '@/components/ResourcePageLayout';
import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { useTranslate } from '@/lib/i18n';
import { requirePasswordConfirmation } from '@/lib/password-confirm';
import { route } from '@/lib/route';
import { type PaginatedData, type SharedData } from '@/types';
import { type Message } from '@/types/models';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

interface Option { id: number; name: string; email?: string | null; avatar?: string | null; }
interface Props { messages: PaginatedData<Message>; users: Option[]; query: Record<string, unknown>; can: { create: boolean }; }
interface TablePaginationState { per_page: number; current_page: number; last_page: number; total: number; }
interface MessageComposerState { receiver_id: string; message_body: string; }

const READ_OPTIONS = [{ value: '1', label: 'Read' }, { value: '0', label: 'Unread' }] as const;
type SortBy = 'id' | 'is_read' | 'created_at';

const createComposer = (): MessageComposerState => ({ receiver_id: '', message_body: '' });
const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const toPositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const resolvePagination = (data: PaginatedData<Message>): TablePaginationState => {
  const root = data as unknown as Record<string, unknown>;
  const meta = typeof root.meta === 'object' && root.meta !== null ? root.meta as Record<string, unknown> : null;

  return {
    per_page: toPositiveNumber(meta?.per_page ?? root.per_page, 15),
    current_page: toPositiveNumber(meta?.current_page ?? root.current_page, 1),
    last_page: toPositiveNumber(meta?.last_page ?? root.last_page, 1),
    total: toPositiveNumber(meta?.total ?? root.total, data.data.length),
  };
};

export default function Index({ messages, users, query, can }: Props) {
  const { auth } = usePage<SharedData>().props;
  const authUser = auth.user;
  const getInitials = useInitials();
  const t = useTranslate();
  const qf = typeof query.filter === 'object' && query.filter !== null ? query.filter as Record<string, unknown> : null;
  const [search, setSearch] = useState(typeof query.q === 'string' ? query.q : String(qf?.q ?? ''));
  const [senderId, setSenderId] = useState(String(query.sender_id ?? qf?.sender_id ?? ''));
  const [receiverId, setReceiverId] = useState(String(query.receiver_id ?? qf?.receiver_id ?? ''));
  const [isRead, setIsRead] = useState(String(query.is_read ?? qf?.is_read ?? ''));
  const [sortBy, setSortBy] = useState<SortBy>(query.sort_by === 'is_read' || query.sort_by === 'created_at' ? query.sort_by : 'id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(query.sort_dir === 'desc' ? 'desc' : 'asc');
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [shiftMode, setShiftMode] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composer, setComposer] = useState<MessageComposerState>(createComposer());
  const queryRef = useRef<Record<string, unknown>>(query);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const pagination = useMemo(() => resolvePagination(messages), [messages]);

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
  const userOptions: SearchableSelectOption[] = useMemo(() => (
    users.map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined }))
  ), [users]);
  const receiverOptions: SearchableSelectOption[] = useMemo(() => (
    users
      .filter((item) => item.id !== authUser?.id)
      .map((item) => ({ value: String(item.id), label: item.name, description: item.email ?? undefined }))
  ), [authUser?.id, users]);
  const readOptions: SearchableSelectOption[] = READ_OPTIONS.map((item) => ({ value: item.value, label: item.label }));
  const selectedRecipient = useMemo(() => {
    const selectedId = parseNullableId(composer.receiver_id);
    return selectedId ? users.find((item) => item.id === selectedId) ?? null : null;
  }, [composer.receiver_id, users]);
  const canSubmitCreate = Boolean(authUser && parseNullableId(composer.receiver_id) && composer.message_body.trim().length > 0);

  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'sender_name', label: 'Sender', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'receiver_name', label: 'Receiver', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'message_body', label: 'Message', render: (value: unknown) => (value ? String(value) : '-') },
    { key: 'is_read', label: 'State', render: (value: unknown) => <Badge variant="outline">{value ? t('Read') : t('Unread')}</Badge> },
  ];

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      receiver_id: parseNullableId(composer.receiver_id),
      message_body: composer.message_body.trim(),
    };

    if (!payload.receiver_id || payload.message_body.length === 0) {
      alert(t('Choose a recipient and write a message.'));
      return;
    }

    setIsSubmitting(true);
    router.post(route('messages.store'), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateOpen(false);
        setComposer(createComposer());
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    if (!confirm(t('Delete :count selected message(s)?', { count: selectedIds.length }))) {
      return;
    }

    const confirmed = await requirePasswordConfirmation('batch delete selected messages');
    if (!confirmed) {
      return;
    }

    router.post(route('messages.batchDestroy'), { ids: selectedIds }, {
      preserveScroll: true,
      onSuccess: () => setSelectedKeys([]),
    });
  };

  const openCreateModal = () => {
    setComposer(createComposer());
    setIsCreateOpen(true);
  };

  return (
    <AppLayout>
      <Head title={t('Messages')} />
      <ResourcePageLayout
        title="Messages"
        description="Review message history and send direct messages without exposing sender or delivery state controls."
        actions={(
          <ResourcePageActions
            exportHref={route('messages.export.csv')}
            trashedHref={route('messages.trashed')}
            importInputRef={importInputRef}
            onImportFileChange={(event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              if (!file) return;

              const fd = new FormData();
              fd.append('file', file);
              router.post(route('messages.import'), fd, { forceFormData: true, preserveScroll: true });
            }}
            onOpenCreate={can.create ? openCreateModal : undefined}
            createLabel="New Message"
          />
        )}
        filters={(
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('Total')}</p><p className="text-2xl font-semibold">{messages.total ?? messages.data.length}</p></CardContent></Card>
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('Read')}</p><p className="text-2xl font-semibold">{rows.filter((item) => item.is_read).length}</p></CardContent></Card>
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('Unread')}</p><p className="text-2xl font-semibold">{rows.filter((item) => !item.is_read).length}</p></CardContent></Card>
              <Card className="gap-0 py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('Senders')}</p><p className="text-2xl font-semibold">{new Set(rows.map((item) => item.sender_id)).size}</p></CardContent></Card>
            </div>
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-4"><LiveSearchInput value={search} suggestions={suggestions} onChange={setSearch} onSelectSuggestion={(item) => { setSearch(item.label); applySearch(1); }} onSubmit={() => applySearch(1)} /></div>
              <div className="lg:col-span-2"><SearchableSelect value={senderId} options={userOptions} onChange={setSenderId} placeholder="Sender" searchPlaceholder="Search sender..." /></div>
              <div className="lg:col-span-2"><SearchableSelect value={receiverId} options={userOptions} onChange={setReceiverId} placeholder="Receiver" searchPlaceholder="Search receiver..." /></div>
              <div className="lg:col-span-2"><SearchableSelect value={isRead} options={readOptions} onChange={setIsRead} placeholder="State" searchPlaceholder="Search state..." /></div>
              <div className="lg:col-span-1"><Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}><SelectTrigger><SelectValue placeholder={t('Sort by')} /></SelectTrigger><SelectContent><SelectItem value="id">{t('ID')}</SelectItem><SelectItem value="is_read">{t('State')}</SelectItem><SelectItem value="created_at">{t('Created')}</SelectItem></SelectContent></Select></div>
              <div className="lg:col-span-1"><Select value={sortDir} onValueChange={(value: 'asc' | 'desc') => setSortDir(value === 'desc' ? 'desc' : 'asc')}><SelectTrigger><SelectValue placeholder={t('Direction')} /></SelectTrigger><SelectContent><SelectItem value="asc">{t('Asc')}</SelectItem><SelectItem value="desc">{t('Desc')}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => applySearch(1, undefined, sortBy, sortDir)}>{t('Apply')}</Button><Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSenderId(''); setReceiverId(''); setIsRead(''); setSortBy('id'); setSortDir('asc'); setTimeout(() => applySearch(1, undefined, 'id', 'asc'), 0); }}>{t('Clear')}</Button></div>
          </div>
        )}
      >
        <BatchActionBar
          selectedCount={selectedIds.length}
          onDeleteSelected={() => void handleBatchDelete()}
          onClearSelection={() => setSelectedKeys([])}
          shiftModeEnabled={shiftMode}
          onToggleShiftMode={() => setShiftMode((value) => !value)}
          actionOrder={['delete', 'clear']}
        />
        <DataTable
          tableId="messages-index"
          columns={columns}
          data={rows}
          actions={[
            { key: 'view', label: 'View', icon: Eye, iconOnly: true, variant: 'outline', onClick: (row: Message) => router.get(route('messages.show', row.id)) },
            { key: 'edit', label: 'Edit', icon: Pencil, iconOnly: true, variant: 'outline', onClick: (row: Message) => router.get(route('messages.edit', row.id)) },
            { key: 'delete', label: 'Delete', icon: Trash2, iconOnly: true, variant: 'outline', onClick: (row: Message) => router.delete(route('messages.destroy', row.id), { preserveScroll: true }) },
          ]}
          selectableRows
          selectedRowKeys={selectedKeys}
          onSelectedRowKeysChange={(keys) => setSelectedKeys(keys as Array<string | number>)}
          rangeSelectMode={shiftMode}
          pagination={pagination}
          onPageChange={(page) => applySearch(page, undefined, sortBy, sortDir)}
          perPage={Number(query.per_page) > 0 ? Number(query.per_page) : 15}
          onPerPageChange={(value) => applySearch(1, value, sortBy, sortDir)}
        />
      </ResourcePageLayout>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsCreateOpen(true);
            return;
          }

          if (isSubmitting) {
            return;
          }

          setIsCreateOpen(false);
          setComposer(createComposer());
        }}
      >
        <DialogContent className="max-w-4xl overflow-hidden border border-slate-200/80 bg-white p-0">
          <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-6 text-white">
              <Badge variant="secondary" className="w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] tracking-[0.16em] text-white uppercase hover:bg-white/15">
                {t('Direct Message')}
              </Badge>
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-2xl font-semibold text-white">{t('New message')}</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-slate-300">
                  {t('Compose like a real conversation. The sender is your current account and new messages always start unread for the recipient.')}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-300 uppercase">{t('From')}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar className="size-12 border border-white/20">
                    {authUser?.avatar ? <AvatarImage src={authUser.avatar} alt={authUser.name} /> : null}
                    <AvatarFallback className="bg-white/20 text-sm font-semibold text-white">
                      {getInitials(authUser?.name ?? t('Me'))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-white">{authUser?.name ?? t('Current user')}</p>
                    <p className="text-xs text-slate-300">{authUser?.email ?? t('Signed-in account')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.16em] text-slate-300 uppercase">{t('Delivery State')}</p>
                  <Badge className="border-emerald-300/30 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/15">
                    {t('Unread on arrival')}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-slate-200/90">
                  {t('Message state is controlled on the server now, so the compose UI stays focused on the conversation instead of record fields.')}
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm leading-6 text-slate-300">
                {selectedRecipient
                  ? t('This message will be sent directly to :name.', { name: selectedRecipient.name })
                  : t('Choose a recipient to start the message.')}
              </div>
            </div>

            <form className="space-y-5 p-6" onSubmit={submitCreate}>
              <div className="space-y-2">
                <Label>{t('To')}</Label>
                <SearchableSelect
                  value={composer.receiver_id}
                  options={receiverOptions}
                  onChange={(value) => setComposer((current) => ({ ...current, receiver_id: value }))}
                  placeholder="Choose recipient"
                  searchPlaceholder="Search recipient..."
                  clearable={false}
                />
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t('Message Body')}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecipient ? t('Write to :name.', { name: selectedRecipient.name }) : t('Write your message.')}
                    </p>
                  </div>
                  <Badge variant="outline">{t(':count chars', { count: composer.message_body.trim().length })}</Badge>
                </div>
                <textarea
                  value={composer.message_body}
                  onChange={(event) => setComposer((current) => ({ ...current, message_body: event.target.value }))}
                  className="mt-4 min-h-[240px] w-full resize-none border-0 bg-transparent text-sm leading-6 outline-none"
                  placeholder={selectedRecipient ? t('Write a message to :name', { name: selectedRecipient.name }) : t('Write your message')}
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="max-w-md text-xs leading-5 text-muted-foreground">
                  {t('Messages are sent as :name and arrive unread for the recipient.', { name: authUser?.name ?? t('your account') })}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => { setIsCreateOpen(false); setComposer(createComposer()); }}>
                    {t('Cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !canSubmitCreate}>
                    <MessageSquarePlus className="size-4" />
                    {t('Send Message')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
