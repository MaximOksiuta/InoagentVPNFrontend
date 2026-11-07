import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../shared/api/http'
import {Brand} from '../../shared/ui/Brand'

export function ResetPasswordPage() {
  const [token] = useState(() => location.hash.slice(1))
  useEffect(() => { history.replaceState(null, '', location.pathname) }, [])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('')
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    setBusy(true)
    try { await apiRequest('/api/auth/recovery/reset', {method: 'POST', body: {token, password}}); setDone(true) }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось изменить пароль') }
    finally { setBusy(false) }
  }
  return <main className="auth-page"><section className="auth-panel recovery-panel"><span className="brand"><Brand/></span><h1>Новый пароль</h1>
    {done ? <><p role="status">Пароль изменён. Войдите с новым паролем</p><Link className="btn btn-primary" to="/auth">Войти</Link></> : <form className="vstack gap-3" onSubmit={submit}>
      <p>Ссылка из Telegram действует 10 минут и работает один раз</p>
      <label>Новый пароль<input className="form-control" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)}/></label>
      <label>Повторите пароль<input className="form-control" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)}/></label>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy || !token}>{busy ? 'Сохраняем…' : 'Сохранить пароль'}</button></form>}
    </section></main>
}
