'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Users, DollarSign, Receipt, TrendingUp, Plus, Trash2, Search, Loader2, LogOut } from 'lucide-react';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function formatMoney(n) {
  return '$' + Number(n || 0).toLocaleString('es-UY');
}
function formatDateHuman(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TABS = [
  { id: 'registro', label: 'Registrar', icon: Scissors },
  { id: 'historial', label: 'Historial', icon: Receipt },
  { id: 'precios', label: 'Precios y equipo', icon: DollarSign },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'caja', label: 'Caja', icon: TrendingUp },
];

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('No autorizado');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error de red');
  }
  return res.json();
}

export default function Home() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [cuts, setCuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('registro');
  const [activeBarber, setActiveBarber] = useState('');

  async function loadAll() {
    const [meData, barbersData, servicesData, cutsData] = await Promise.all([
      api('/api/me'),
      api('/api/barbers'),
      api('/api/services'),
      api('/api/cuts'),
    ]);
    setMe(meData);
    setBarbers(barbersData);
    setServices(servicesData);
    setCuts(cutsData);
    setActiveBarber((prev) => prev || meData.id || barbersData[0]?.id || '');
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  async function logout() {
    await api('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading || !me) {
    return (
      <div className="loading-screen">
        <Loader2 className="spin" size={28} color="#9C3B2E" />
      </div>
    );
  }

  const isAdmin = me.role === 'admin';
  const visibleTabs = TABS.filter((t) => t.id !== 'caja' || isAdmin);

  return (
    <div>
      <Header me={me} onLogout={logout} />
      <div className="barberbar">
        <label style={{ fontSize: 13, color: '#6b6055', fontWeight: 600 }}>Atendiendo ahora:</label>
        <select value={activeBarber} onChange={(e) => setActiveBarber(e.target.value)}>
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <nav className="tabnav">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={'tabbtn' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>
              <Icon size={16} /><span>{t.label}</span>
            </button>
          );
        })}
      </nav>
      <main className="content">
        {tab === 'registro' && (
          <RegistroTab barbers={barbers} services={services} cuts={cuts} activeBarber={activeBarber} onReload={loadAll} />
        )}
        {tab === 'historial' && <HistorialTab barbers={barbers} cuts={cuts} onReload={loadAll} />}
        {tab === 'precios' && <PreciosTab services={services} barbers={barbers} onReload={loadAll} isAdmin={isAdmin} />}
        {tab === 'clientes' && <ClientesTab cuts={cuts} />}
        {tab === 'caja' && isAdmin && <CajaTab cuts={cuts} />}
      </main>
    </div>
  );
}

function Header({ me, onLogout }) {
  return (
    <div className="header">
      <div className="header-top">
        <div>
          <h1 className="shopname">Barbería</h1>
          <div className="tagline">Panel de gestión · cortes, precios y clientes</div>
        </div>
        <div className="whoami">
          <div className="name">{me.name}</div>
          <button className="logout-link" onClick={onLogout}><LogOut size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Cerrar sesión</button>
        </div>
      </div>
      <div className="stripe" style={{ marginTop: 14, marginLeft: -24, marginRight: -24, marginBottom: -18 }} />
    </div>
  );
}

function RegistroTab({ barbers, services, cuts, activeBarber, onReload }) {
  const [barberId, setBarberId] = useState(activeBarber);
  const [client, setClient] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [price, setPrice] = useState(services[0]?.price || 0);
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setBarberId(activeBarber), [activeBarber]);
  useEffect(() => {
    const s = services.find((s) => s.id === serviceId);
    if (s) setPrice(s.price);
  }, [serviceId, services]);

  const clientNames = useMemo(() => Array.from(new Set(cuts.map((c) => c.client))), [cuts]);
  const recent = useMemo(() => [...cuts].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8), [cuts]);

  async function removeCut(id) {
    await api(`/api/cuts/${id}`, { method: 'DELETE' });
    await onReload();
  }

  async function submit(e) {
    e.preventDefault();
    if (!barberId || !client.trim() || !serviceId) return;
    const service = services.find((s) => s.id === serviceId);
    const barber = barbers.find((b) => b.id === barberId);
    setSaving(true);
    try {
      await api('/api/cuts', {
        method: 'POST',
        body: JSON.stringify({
          date, barberId, barberName: barber?.name || '', client: client.trim(),
          serviceId, serviceName: service?.name || '', price: Number(price) || 0, notes: notes.trim(),
        }),
      });
      setClient('');
      setNotes('');
      await onReload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid2">
      <div className="card">
        <h3 className="section-title">Registrar un corte</h3>
        {barbers.length === 0 || services.length === 0 ? (
          <div className="empty">Cargá al menos un barbero y un servicio en "Precios y equipo" para poder registrar cortes.</div>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label>Barbero</label>
              <select value={barberId} onChange={(e) => setBarberId(e.target.value)}>
                {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Cliente</label>
              <input list="clientlist" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre del cliente" required />
              <datalist id="clientlist">{clientNames.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="row">
              <div className="field">
                <label>Servicio</label>
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Precio</label>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Notas (opcional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: máquina 2, degradé bajo" />
            </div>
            <button className="btn" type="submit" disabled={saving}><Plus size={16} /> {saving ? 'Guardando...' : 'Registrar corte'}</button>
          </form>
        )}
      </div>
      <div className="card">
        <h3 className="section-title">Últimos cortes</h3>
        {recent.length === 0 ? (
          <div className="empty">Todavía no hay cortes registrados.</div>
        ) : recent.map((c) => (
          <div className="ticket" key={c.id}>
            <div>
              <div className="name">{c.client}</div>
              <div className="meta">{c.serviceName} · {c.barberName} · {formatDateHuman(c.date)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="price mono">{formatMoney(c.price)}</div>
              <button className="icon-btn" onClick={() => removeCut(c.id)} title="Eliminar corte"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistorialTab({ barbers, cuts, onReload }) {
  const [barberFilter, setBarberFilter] = useState('todos');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => cuts
    .filter((c) => barberFilter === 'todos' || c.barberId === barberFilter)
    .filter((c) => !from || c.date >= from)
    .filter((c) => !to || c.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : -1)), [cuts, barberFilter, from, to]);

  const total = filtered.reduce((sum, c) => sum + Number(c.price || 0), 0);

  async function removeCut(id) {
    await api(`/api/cuts/${id}`, { method: 'DELETE' });
    await onReload();
  }

  return (
    <div className="card">
      <h3 className="section-title">Historial de cortes</h3>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="field" style={{ minWidth: 160 }}>
          <label>Barbero</label>
          <select value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)}>
            <option value="todos">Todos</option>
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ minWidth: 140 }}><label>Desde</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field" style={{ minWidth: 140 }}><label>Hasta</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty">No hay cortes que coincidan con el filtro.</div>
      ) : (
        <>
          <table>
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Barbero</th><th>Precio</th><th></th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{formatDateHuman(c.date)}</td><td>{c.client}</td><td>{c.serviceName}</td><td>{c.barberName}</td>
                  <td className="mono">{formatMoney(c.price)}</td>
                  <td><button className="icon-btn" onClick={() => removeCut(c.id)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 14, fontWeight: 700 }}>Total: <span className="mono">{formatMoney(total)}</span> · {filtered.length} corte{filtered.length !== 1 ? 's' : ''}</div>
        </>
      )}
    </div>
  );
}

function PreciosTab({ services, barbers, onReload, isAdmin }) {
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [newBarber, setNewBarber] = useState({ name: '', username: '', password: '', role: 'barbero' });
  const [error, setError] = useState('');

  async function updateService(id, field, value) {
    await api(`/api/services/${id}`, { method: 'PATCH', body: JSON.stringify({ [field]: value }) });
    await onReload();
  }
  async function removeService(id) {
    await api(`/api/services/${id}`, { method: 'DELETE' });
    await onReload();
  }
  async function addService(e) {
    e.preventDefault();
    if (!newService.name.trim()) return;
    await api('/api/services', { method: 'POST', body: JSON.stringify({ name: newService.name.trim(), price: Number(newService.price) || 0 }) });
    setNewService({ name: '', price: '' });
    await onReload();
  }

  async function addBarber(e) {
    e.preventDefault();
    setError('');
    if (!newBarber.name.trim() || !newBarber.username.trim() || !newBarber.password.trim()) return;
    try {
      await api('/api/barbers', {
        method: 'POST',
        body: JSON.stringify({ name: newBarber.name.trim(), username: newBarber.username.trim(), password: newBarber.password, role: newBarber.role }),
      });
      setNewBarber({ name: '', username: '', password: '', role: 'barbero' });
      await onReload();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeBarber(id) {
    await api(`/api/barbers/${id}`, { method: 'DELETE' });
    await onReload();
  }

  return (
    <div className="grid2">
      <div className="card">
        <h3 className="section-title">Servicios y precios</h3>
        <p style={{ fontSize: 12.5, color: '#8a8078', marginTop: -8, marginBottom: 14 }}>
          Agregá, editá o borrá los servicios que ofrece tu barbería (cortes, tintes, lo que necesites).
        </p>
        {services.map((s) => (
          <div className="row" key={s.id} style={{ marginBottom: 8, alignItems: 'center' }}>
            <input defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && updateService(s.id, 'name', e.target.value)} style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8, flex: 2 }} />
            <input type="number" className="mono" defaultValue={s.price} onBlur={(e) => Number(e.target.value) !== s.price && updateService(s.id, 'price', e.target.value)} style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8, flex: 1 }} />
            <button className="icon-btn" onClick={() => removeService(s.id)}><Trash2 size={15} /></button>
          </div>
        ))}
        <form onSubmit={addService} className="row" style={{ marginTop: 10 }}>
          <input placeholder="Nuevo servicio" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8, flex: 2 }} />
          <input type="number" placeholder="Precio" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8, flex: 1 }} />
          <button className="btn small" type="submit"><Plus size={14} /></button>
        </form>
      </div>

      <div className="card">
        <h3 className="section-title">Equipo de barberos</h3>
        {barbers.length === 0 && <div className="empty">Todavía no cargaste barberos.</div>}
        {barbers.map((b) => (
          <div className="barberrow" key={b.id}>
            <span>
              {b.name} <span style={{ color: '#a89f92', fontSize: 12 }}>@{b.username}</span>
              {b.role === 'admin' && <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--brass-light)', color: 'var(--ink)', padding: '2px 6px', borderRadius: 5, fontWeight: 700 }}>DUEÑO</span>}
            </span>
            {isAdmin && <button className="icon-btn" onClick={() => removeBarber(b.id)}><Trash2 size={15} /></button>}
          </div>
        ))}

        {isAdmin ? (
          <form onSubmit={addBarber} style={{ marginTop: 14 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <input placeholder="Nombre" value={newBarber.name} onChange={(e) => setNewBarber({ ...newBarber, name: e.target.value })} style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8 }} />
              <input placeholder="Usuario" value={newBarber.username} onChange={(e) => setNewBarber({ ...newBarber, username: e.target.value })} style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8 }} />
            </div>
            <div className="row" style={{ marginBottom: 8 }}>
              <input type="password" placeholder="Contraseña" value={newBarber.password} onChange={(e) => setNewBarber({ ...newBarber, password: e.target.value })} style={{ padding: '7px 9px', border: '1px solid var(--line)', borderRadius: 8 }} />
              <button className="btn small" type="submit"><Plus size={14} /> Agregar</button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#6b6055' }}>
              <input type="checkbox" checked={newBarber.role === 'admin'} onChange={(e) => setNewBarber({ ...newBarber, role: e.target.checked ? 'admin' : 'barbero' })} />
              Este usuario también es dueño/administrador (ve la Caja y puede gestionar el equipo)
            </label>
            {error && <div style={{ color: 'var(--brick-dark)', fontSize: 12.5, marginTop: 8 }}>{error}</div>}
          </form>
        ) : (
          <p style={{ fontSize: 12.5, color: '#8a8078', marginTop: 14 }}>
            Solo el dueño puede agregar o eliminar barberos del equipo.
          </p>
        )}
      </div>
    </div>
  );
}

function ClientesTab({ cuts }) {
  const [search, setSearch] = useState('');
  const clients = useMemo(() => {
    const map = {};
    for (const c of cuts) {
      const key = c.client.trim().toLowerCase();
      if (!map[key]) map[key] = { name: c.client.trim(), visits: 0, total: 0, last: c.date, lastService: c.serviceName };
      map[key].visits += 1;
      map[key].total += Number(c.price || 0);
      if (c.date > map[key].last) { map[key].last = c.date; map[key].lastService = c.serviceName; }
    }
    return Object.values(map).sort((a, b) => (a.last < b.last ? 1 : -1));
  }, [cuts]);
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card">
      <h3 className="section-title">Clientes</h3>
      <div className="searchbox"><Search size={15} /><input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {filtered.length === 0 ? (
        <div className="empty">Sin clientes todavía. Aparecen automáticamente cuando registrás cortes.</div>
      ) : (
        <table>
          <thead><tr><th>Cliente</th><th>Visitas</th><th>Última vez</th><th>Último servicio</th><th>Total gastado</th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.name}><td>{c.name}</td><td>{c.visits}</td><td>{formatDateHuman(c.last)}</td><td>{c.lastService}</td><td className="mono">{formatMoney(c.total)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CajaTab({ cuts }) {
  const today = todayISO();
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const sum = (arr) => arr.reduce((s, c) => s + Number(c.price || 0), 0);
  const todayTotal = sum(cuts.filter((c) => c.date === today));
  const weekTotal = sum(cuts.filter((c) => c.date >= weekAgo));
  const monthTotal = sum(cuts.filter((c) => c.date >= monthAgo));

  const byBarber = useMemo(() => {
    const map = {};
    for (const c of cuts) {
      if (!map[c.barberName]) map[c.barberName] = { visits: 0, total: 0 };
      map[c.barberName].visits += 1;
      map[c.barberName].total += Number(c.price || 0);
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [cuts]);

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ date: d, total: sum(cuts.filter((c) => c.date === d)) });
    }
    return days;
  }, [cuts]);
  const maxDay = Math.max(1, ...last7Days.map((d) => d.total));

  return (
    <div>
      <div className="grid2" style={{ marginBottom: 18 }}>
        <div className="stat"><div className="label">Hoy</div><div className="value">{formatMoney(todayTotal)}</div></div>
        <div className="stat"><div className="label">Últimos 7 días</div><div className="value">{formatMoney(weekTotal)}</div></div>
      </div>
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="section-title">Últimos 7 días</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
          {last7Days.map((d) => (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: '#8a8078' }} className="mono">{d.total > 0 ? formatMoney(d.total) : ''}</div>
              <div style={{ width: '100%', height: Math.max(4, (d.total / maxDay) * 80), background: 'var(--brick)', borderRadius: 4 }} />
              <div style={{ fontSize: 11, color: '#8a8078' }}>{new Date(d.date + 'T00:00:00').toLocaleDateString('es-UY', { weekday: 'short' })}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="section-title">Por barbero (histórico)</h3>
        {byBarber.length === 0 ? <div className="empty">Sin datos todavía.</div> : (
          <table>
            <thead><tr><th>Barbero</th><th>Cortes</th><th>Total facturado</th></tr></thead>
            <tbody>{byBarber.map(([name, v]) => (<tr key={name}><td>{name}</td><td>{v.visits}</td><td className="mono">{formatMoney(v.total)}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      <div style={{ marginTop: 14, fontSize: 12.5, color: '#8a8078' }}>Total del mes (últimos 30 días): <strong className="mono">{formatMoney(monthTotal)}</strong></div>
    </div>
  );
}
