import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createRestaurant,
  deleteRestaurant,
  listRestaurants,
  updateRestaurant,
  type RestaurantInput,
} from '../../services/restaurants'
import { countMenuItems } from '../../services/menu'
import { useToast } from '../../features/toast/useToast'
import { Button, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import { Field } from '../../components/ui/Field'
import type { Restaurant } from '../../types'
import './admin.css'

const BLANK: RestaurantInput = {
  name: '',
  cuisines: [],
  rating: 4.5,
  ratingCount: 0,
  priceForTwo: 500,
  deliveryTime: 30,
  address: { label: 'Main', line1: '', city: 'Bengaluru', pincode: '560001' },
  vegOnly: false,
  isOpen: true,
}

export function AdminRestaurantsPage() {
  const { notify } = useToast()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [dishCounts, setDishCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<RestaurantInput>(BLANK)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listRestaurants()
      setRestaurants(data)
      const counts = await Promise.all(data.map((restaurant) => countMenuItems(restaurant.id)))
      setDishCounts(Object.fromEntries(data.map((r, i) => [r.id, counts[i] ?? 0])))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const patch = async (id: string, changes: Partial<RestaurantInput>) => {
    setSavingId(id)
    try {
      await updateRestaurant(id, changes)
      notify('Restaurant updated', 'success')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Update failed', 'error')
    } finally {
      setSavingId(null)
    }
  }

  const create = async (event: FormEvent) => {
    event.preventDefault()
    setCreating(true)
    try {
      const id = await createRestaurant(draft)
      notify(`"${draft.name}" created`, 'success')
      setDraft(BLANK)
      await load()
      void id
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Create failed', 'error')
    } finally {
      setCreating(false)
    }
  }

  const remove = async (restaurant: Restaurant) => {
    if (!window.confirm(`Delete "${restaurant.name}" and its entire menu?`)) return
    setSavingId(restaurant.id)
    try {
      await deleteRestaurant(restaurant.id)
      notify('Restaurant deleted', 'info')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Delete failed', 'error')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <Spinner label="Loading restaurants…" />
  if (error) return <ErrorNote message={error} onRetry={load} />

  return (
    <>
      <div className="admin__head">
        <h1>Restaurants</h1>
      </div>

      <div className="admin-grid">
        <div>
          {restaurants.length === 0 ? (
            <EmptyState title="No restaurants" />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>₹ for two</th>
                  <th>Min</th>
                  <th>Dishes</th>
                  <th>Open</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id}>
                    <td>
                      <img src={restaurant.coverImage} alt="" />
                    </td>
                    <td>
                      <Link to={`/admin/restaurants/${restaurant.id}/menu`}>{restaurant.name}</Link>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {restaurant.cuisines.join(', ')}
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        defaultValue={restaurant.priceForTwo}
                        style={{ width: 80 }}
                        onBlur={(event) =>
                          patch(restaurant.id, { priceForTwo: Number(event.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        defaultValue={restaurant.deliveryTime}
                        style={{ width: 70 }}
                        onBlur={(event) =>
                          patch(restaurant.id, { deliveryTime: Number(event.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <Link to={`/admin/restaurants/${restaurant.id}/menu`}>
                        {dishCounts[restaurant.id] ?? 0}
                      </Link>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={restaurant.isOpen}
                        disabled={savingId === restaurant.id}
                        onChange={(event) => patch(restaurant.id, { isOpen: event.target.checked })}
                      />
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        onClick={() => remove(restaurant)}
                        disabled={savingId === restaurant.id}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form className="card-surface" onSubmit={create}>
          <h2 style={{ marginTop: 0 }}>Add restaurant</h2>
          <Field
            label="Name"
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <Field
            label="Cuisines (comma separated)"
            required
            placeholder="Biryani, Mughlai"
            value={draft.cuisines.join(', ')}
            onChange={(event) =>
              setDraft({
                ...draft,
                cuisines: event.target.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean),
              })
            }
          />
          <Field
            label="Street address"
            value={draft.address.line1}
            onChange={(event) =>
              setDraft({ ...draft, address: { ...draft.address, line1: event.target.value } })
            }
          />
          <Field
            label="City"
            value={draft.address.city}
            onChange={(event) =>
              setDraft({ ...draft, address: { ...draft.address, city: event.target.value } })
            }
          />
          <div className="row">
            <div style={{ flex: 1 }}>
              <Field
                label="₹ for two"
                type="number"
                value={draft.priceForTwo}
                onChange={(event) => setDraft({ ...draft, priceForTwo: Number(event.target.value) })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field
                label="Delivery (min)"
                type="number"
                value={draft.deliveryTime}
                onChange={(event) =>
                  setDraft({ ...draft, deliveryTime: Number(event.target.value) })
                }
              />
            </div>
          </div>
          <Field
            label="Offer text"
            placeholder="20% OFF up to ₹100"
            value={draft.offer ?? ''}
            onChange={(event) => setDraft({ ...draft, offer: event.target.value })}
          />
          <label className="switch" style={{ paddingBottom: '0.9rem' }}>
            <input
              type="checkbox"
              checked={draft.vegOnly}
              onChange={(event) => setDraft({ ...draft, vegOnly: event.target.checked })}
            />
            <span>Pure veg</span>
          </label>
          <Button type="submit" fullWidth loading={creating}>
            Create restaurant
          </Button>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
            New restaurants start without images — the <code>npm run images</code> script only
            covers the seeded ones.
          </p>
        </form>
      </div>
    </>
  )
}
