import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/auth-context'
import { ApiError } from '../../shared/api/http'

type AuthMode = 'login' | 'register'

type AuthFormState = {
  phone: string
  password: string
  confirmPassword: string
}

const initialState: AuthFormState = {
  phone: '',
  password: '',
  confirmPassword: '',
}

export function AuthPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [form, setForm] = useState<AuthFormState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!form.phone.trim() || !form.password.trim()) {
      setError('Укажите номер телефона и пароль.')
      return
    }

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Пароли не совпадают.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login({
          phone: form.phone.trim(),
          password: form.password,
        })
      } else {
        await register({
          phone: form.phone.trim(),
          password: form.password,
        })
      }

      navigate('/devices', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось выполнить запрос.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className="auth-panel shadow-lg">
              <div className="column g-0">
                <div className="auth-aside">
                  <div className="eyebrow mb-3">vpn control panel</div>
                  <h1 className="display-title mb-3">InoagentVPN</h1>
                </div>

                <div className="col-lg-7 p-4 p-lg-5">
                  <div className="d-flex gap-2 mb-4">
                    <button
                      type="button"
                      className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        setMode('login')
                        setError(null)
                      }}
                    >
                      Вход
                    </button>
                    <button
                      type="button"
                      className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        setMode('register')
                        setError(null)
                      }}
                    >
                      Регистрация
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="vstack gap-3">
                    <div>
                      <label htmlFor="phone" className="form-label">
                        Номер телефона
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        className="form-control form-control-lg"
                        placeholder="+7 999 123-45-67"
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, phone: event.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="form-label">
                        Пароль
                      </label>
                      <input
                        id="password"
                        type="password"
                        className="form-control form-control-lg"
                        placeholder="Введите пароль"
                        value={form.password}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, password: event.target.value }))
                        }
                      />
                    </div>

                    {mode === 'register' ? (
                      <div>
                        <label htmlFor="confirmPassword" className="form-label">
                          Повторите пароль
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          className="form-control form-control-lg"
                          placeholder="Повторите пароль"
                          value={form.confirmPassword}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              confirmPassword: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}

                    {error ? <div className="alert alert-danger mb-0">{error}</div> : null}

                    <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                      {isSubmitting
                        ? 'Отправляем...'
                        : mode === 'login'
                          ? 'Войти'
                          : 'Создать аккаунт'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
