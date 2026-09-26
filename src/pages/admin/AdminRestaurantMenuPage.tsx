import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MENU_CATEGORY_ORDER, deleteMenuItem, listMenu, saveMenuItem } from '../../services/menu'
import { getRestaurant } from '../../services/restaurants'
import { useToast } from '../../features/toast/useToast'
import { formatPrice } from '../../lib/format'
import { Button, ErrorNote, Spinner, VegDot } from '../../components/ui'
import { Field, SelectField } from '../../components/ui/Field'
import type { MenuCategory, MenuItem } from '../../types'
import './admin.css'

const BLANK = {
  name: '',
  description: '',
  price: 199,
  isVeg: true,
  category: 'Recommended' as MenuCategory,
  inStock: true,
}

export function AdminRestaurantMenuPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { notify } = useToast()
  const [restaurantName, setRestaurantName] = useState('')
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restaurant, menu] = await Promise.all([getRestaurant(id), listMenu(id)])
      setRestaurantName(restaurant?.name ?? id)
      setItems(menu)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await saveMenuItem(id, {
        id: editingId ?? undefined,
        name: draft.name,
        description: draft.description,
        price: draft.price,
        isVeg: draft.isVeg,
        category: draft.category,
        image: items.find((item) => item.id === editingId)?.image ?? '',
        inStock: draft.inStock,
      })
      notify(editingId ? 'Dish updated' : 'Dish added', 'success')
      setDraft(BLANK)
      setEditingId(null)
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: MenuItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await deleteMenuItem(id, item.id)
      notify('Dish deleted', 'info')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    }
  }

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id)
    setDraft({
      name: item.name,
      description: item.description,
      price: item.price,
      isVeg: item.isVeg,
      category: item.category,
      inStock: item.inStock,
    })
  }

  if (loading) return <Spinner label="Loading menu…" />
  if (error) return <ErrorNote message={error} onRetry={load} />

  return (
    <>
      <div className="admin__head">
        <h1>{restaurantName} — menu</h1>
        <Link className="admin__link" to="/admin/restaurants">
          ← All restaurants
        </Link>
      </div>

      <div className="admin-grid">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Dish</th>
              <th>Category</th>
              <th>Price</th>
              <th>In stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.image ? <img src={item.image} alt="" /> : null}
                </td>
                <td>
                  <div className="row" style={{ gap: '0.4rem' }}>
                    <VegDot isVeg={item.isVeg} />
                    <span>{item.name}</span>
                  </div>
                </td>
                <td>{item.category}</td>
                <td>{formatPrice(item.price)}</td>
                <td>{item.inStock ? 'Yes' : 'No'}</td>
                <td>
                  <div className="row" style={{ gap: '0.4rem', flexWrap: 'nowrap' }}>
                    <Button variant="secondary" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(item)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="card-surface" onSubmit={save}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit dish' : 'Add dish'}</h2>
          <Field
            label="Name"
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <Field
            label="Description"
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
          <div className="row">
            <div style={{ flex: 1 }}>
              <Field
                label="Price ₹"
                type="number"
                required
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <SelectField
                label="Category"
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value as MenuCategory })
                }
              >
                {MENU_CATEGORY_ORDER.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          <label className="switch" style={{ paddingBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={draft.isVeg}
              onChange={(event) => setDraft({ ...draft, isVeg: event.target.checked })}
            />
            <span>Vegetarian</span>
          </label>
          <label className="switch" style={{ paddingBottom: '0.9rem' }}>
            <input
              type="checkbox"
              checked={draft.inStock}
              onChange={(event) => setDraft({ ...draft, inStock: event.target.checked })}
            />
            <span>In stock</span>
          </label>
          <Button type="submit" fullWidth loading={saving}>
            {editingId ? 'Save changes' : 'Add dish'}
          </Button>
          {editingId ? (
            <Button
              variant="ghost"
              fullWidth
              type="button"
              onClick={() => {
                setEditingId(null)
                setDraft(BLANK)
              }}
            >
              Cancel edit
            </Button>
          ) : null}
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
            Dish image storage path is preserved on edit. New dishes show the placeholder until an
            image is uploaded.
          </p>
        </form>
      </div>
    </>
  )
}