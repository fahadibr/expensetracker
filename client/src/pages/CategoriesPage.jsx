import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { CATEGORY_COLORS } from '../utils/helpers';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/categories', { name: newName.trim() });
      setNewName('');
      toast.success('Category added!');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
    } finally { setAdding(false); }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return;
    try {
      await api.put(`/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      toast.success('Category updated!');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete category "${name}"? Transactions using it will become uncategorized.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-white rounded-xl" />
        {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Categories</h2>
        <p className="text-surface-400 text-sm mt-1">Create custom expense categories for your needs</p>
      </div>

      {/* Add new category */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl p-5 shadow-card border border-surface-100">
        <label className="block text-sm font-medium text-surface-600 mb-2">Add New Category</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g., Personal, Wife, Home, Transport..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm
                       text-surface-800 placeholder-surface-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm
                       shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all cursor-pointer"
          >
            {adding ? 'Adding...' : '+ Add'}
          </button>
        </div>
      </form>

      {/* Category list */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="text-surface-500 font-medium">No categories yet</p>
            <p className="text-surface-400 text-sm mt-1">Add your first category above to start organizing expenses</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {categories.map((cat, index) => {
              const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              const isEditing = editingId === cat.id;
              return (
                <div key={cat.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50/50 transition-colors">
                  {/* Color dot */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0"
                    style={{ backgroundColor: color.hex }}
                  >
                    {cat.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name / edit input */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                          autoFocus
                          className="flex-1 px-3 py-1.5 rounded-lg border border-primary-300 bg-primary-50 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button onClick={() => handleUpdate(cat.id)}
                          className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium cursor-pointer">Save</button>
                        <button onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-surface-200 text-surface-600 text-xs font-medium cursor-pointer">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-surface-800">{cat.name}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                        className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-danger transition-colors cursor-pointer"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
