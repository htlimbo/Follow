import { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';

export default function AccountManageModal({ onClose }) {
  const { accounts, createAccount, renameAccount, removeAccount } = useAccount();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await createAccount({ name });
      setNewName('');
      setAdding(false);
      setError('');
    } catch (err) {
      setError(err?.message || '创建失败');
    }
  }

  async function handleSaveRename(id) {
    const name = editName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    try {
      await renameAccount(id, { name });
      setEditingId(null);
      setError('');
    } catch (err) {
      setError(err?.message || '重命名失败');
    }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除这个账户？账户下的所有股票、思考记录、追踪锚都会被一并删除（不可恢复）。')) return;
    try {
      await removeAccount(id);
      setError('');
    } catch (err) {
      setError(err?.message || '删除失败');
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0.2_0.02_60/0.35)] backdrop-blur-md animate-[fadeIn_0.2s]" onClick={onClose}>
      <div
        className="w-[460px] max-w-[92%] bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius-lg)] overflow-hidden animate-[modalIn_0.25s_cubic-bezier(.2,.8,.2,1)]"
        style={{ boxShadow: '0 20px 60px oklch(0.2 0.02 60 / 0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-1.5">
          <div className="font-serif text-xl font-semibold">管理账户</div>
          <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-soft)' }}>
            主账户、打新户、港股户—— 各自独立的持仓、现金、净值曲线。
          </div>
        </div>

        <div className="px-6 py-3">
          <div className="space-y-1.5">
            {accounts.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius)] border"
                style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
              >
                {editingId === a.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRename(a.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 rounded border text-sm focus:outline-none"
                      style={{ borderColor: 'var(--line)', background: 'var(--bg-raised)' }}
                    />
                    <button
                      onClick={() => handleSaveRename(a.id)}
                      className="p-1.5 rounded cursor-pointer border-0"
                      style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded cursor-pointer border-0"
                      style={{ background: 'transparent', color: 'var(--ink-soft)' }}
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-serif text-sm flex-1 truncate">
                      {a.name}
                      {a.isDefault && (
                        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                          默认
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => { setEditingId(a.id); setEditName(a.name); }}
                      title="重命名"
                      className="p-1.5 rounded cursor-pointer border-0"
                      style={{ background: 'transparent', color: 'var(--ink-soft)' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    {!a.isDefault && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        title="删除"
                        className="p-1.5 rounded cursor-pointer border-0"
                        style={{ background: 'transparent', color: 'var(--loss)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs mt-2" style={{ color: 'var(--loss)' }}>{error}</p>
          )}

          {adding ? (
            <form onSubmit={handleCreate} className="mt-3 flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="账户名称，如 港股户 / 打新户"
                className="flex-1 px-3 py-2 rounded-[var(--radius)] border text-sm focus:outline-none"
                style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-full text-[13px] font-medium border-0 cursor-pointer"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}
              >
                创建
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setNewName(''); }}
                className="px-3 py-2 rounded-full text-[13px] cursor-pointer border-0"
                style={{ background: 'transparent', color: 'var(--ink-soft)' }}
              >
                取消
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius)] text-sm cursor-pointer border border-dashed transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)', background: 'transparent' }}
            >
              <Plus size={14} />
              新建账户
            </button>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-[13px] font-medium border-0 cursor-pointer"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
