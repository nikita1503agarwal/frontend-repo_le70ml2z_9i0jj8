import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Users, Coins, Gamepad2, Activity, Search, Settings, LogOut, ShieldCheck } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('av_admin_token') || '')
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token])
  const logout = () => { localStorage.removeItem('av_admin_token'); setToken('') }
  return { token, setToken, headers, logout }
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!res.ok) throw new Error((await res.json()).detail || 'Login failed')
      const data = await res.json()
      onLogin(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-[#FFD500]" />
          <h1 className="text-white text-2xl font-semibold">AV Tournament Admin</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-[#00509D]" />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-[#00509D]" />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button disabled={loading} className="w-full bg-[#00509D] hover:bg-[#003e76] text-white rounded-lg p-3 transition">{loading? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3 text-zinc-400">
        <Icon className="text-[#FFD500]" size={18} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}

function Dashboard({ headers }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/analytics/overview`, { headers })
        const json = await res.json()
        if (mounted) setData(json)
      } finally { if (mounted) setLoading(false) }
    }
    load()
    const id = setInterval(load, 10000)
    return ()=>{ mounted=false; clearInterval(id) }
  }, [headers])

  if (loading) return <div className="p-8 text-zinc-400">Loading dashboard...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Users" value={data?.metrics?.users || 0} />
        <StatCard icon={Gamepad2} label="Tournaments" value={data?.metrics?.tournaments || 0} />
        <StatCard icon={Coins} label="Transactions" value={data?.metrics?.transactions || 0} />
        <StatCard icon={BarChart3} label="Revenue (BDT)" value={(data?.metrics?.revenue||0).toLocaleString()} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-zinc-300 mb-3"><Activity size={18} className="text-[#FFD500]"/> Recent activity</div>
          <div className="space-y-2 max-h-80 overflow-auto pr-2">
            {data?.recent_activity?.length ? data.recent_activity.map((item, i)=> (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/60 text-sm">
                <div className="text-zinc-300">{item.type}</div>
                <div className="text-zinc-400">{item.username || item.amount}</div>
              </div>
            )) : <div className="text-zinc-500">No recent activity</div>}
          </div>
        </div>
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-300 mb-3">System health</div>
          <div className="text-sm text-zinc-400">Server: <span className="text-green-400">{data?.system_health?.server}</span></div>
          <div className="text-sm text-zinc-400">Database: <span className="text-green-400">{data?.system_health?.db}</span></div>
        </div>
      </div>
    </div>
  )
}

function UsersTable({ headers }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0 })

  const load = async () => {
    const params = new URLSearchParams({ page, per_page: 20 })
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    const res = await fetch(`${BACKEND_URL}/users?${params.toString()}`, { headers })
    const json = await res.json()
    setData(json)
  }
  useEffect(()=>{ load() }, [page, status])

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/70 border border-zinc-800 rounded-lg px-3">
          <Search size={16} className="text-zinc-500"/>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==='Enter' && load()} placeholder="Search users" className="bg-transparent py-2 outline-none text-sm text-white" />
        </div>
        <select value={status} onChange={e=>{setStatus(e.target.value); setPage(1)}} className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button onClick={load} className="bg-[#00509D] text-white rounded-lg px-4 py-2 text-sm">Search</button>
      </div>

      <div className="overflow-auto border border-zinc-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 text-zinc-300">
            <tr>
              <th className="text-left p-3">UID</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Balances</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(u => (
              <tr key={u._id} className="border-t border-zinc-800/70 text-zinc-200">
                <td className="p-3">{u.uid}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.email || '-'}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">BDT {(u.balances?.deposited||0)+(u.balances?.winnings||0)+(u.balances?.gifted||0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 disabled:opacity-50">Prev</button>
        <div className="text-zinc-400 text-sm">Page {page}</div>
        <button disabled={(page*20)>=data.total} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}

function App() {
  const { token, setToken, headers, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')

  if (!token) return <Login onLogin={(t)=>{localStorage.setItem('av_admin_token', t); setToken(t)}} />

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#00509D] flex items-center justify-center text-black font-bold">AV</div>
            <div className="text-zinc-300">Admin Panel</div>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800"><LogOut size={16}/> Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid md:grid-cols-5 gap-6">
        <aside className="md:col-span-1 space-y-2">
          {[
            {id:'dashboard', label:'Dashboard', icon: BarChart3},
            {id:'users', label:'Users', icon: Users},
            {id:'tournaments', label:'Tournaments', icon: Gamepad2},
            {id:'settings', label:'Settings', icon: Settings},
          ].map(i=> (
            <button key={i.id} onClick={()=>setTab(i.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded border ${tab===i.id? 'border-[#00509D] bg-[#00509D]/10' : 'border-zinc-800 bg-zinc-900/40'} hover:border-[#00509D]/60`}>
              <i.icon size={16} className="text-[#FFD500]"/>
              <span className="text-sm">{i.label}</span>
            </button>
          ))}
        </aside>
        <main className="md:col-span-4 border border-zinc-800 rounded-xl bg-zinc-950/50 min-h-[60vh]">
          {tab==='dashboard' && <Dashboard headers={headers} />}
          {tab==='users' && <UsersTable headers={headers} />}
          {tab==='tournaments' && <div className="p-6 text-zinc-400">Tournament management UI coming next. Use the chat to ask for more controls.</div>}
          {tab==='settings' && <div className="p-6 text-zinc-400">Settings and role management interface to be added on request.</div>}
        </main>
      </div>
    </div>
  )
}

export default App
