import {useMemo} from 'react'
import type {PropsWithChildren} from 'react'
import {Link, NavLink, useNavigate} from 'react-router-dom'
import {useAuth} from '../providers/auth-context'

type AppShellProps = PropsWithChildren<{
    title?: string
    subtitle?: string
}>

export function AppShell({children, title, subtitle}: AppShellProps) {
    const navigate = useNavigate()
    const {user, logout} = useAuth()

    const initials = useMemo(() => {
        if (!user) return 'NA'

        return user.phone.slice(-2).toUpperCase()
    }, [user])

    return (
        <div className="app-shell">
            <header className="topbar border-bottom border-white border-opacity-10">
                <div
                    className="container py-3 d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between">
                    <div>
                        <Link to="/" className="brand text-decoration-none">
                            InoagentVPN
                        </Link>
                    </div>

                    <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">

                        {user?.isAdmin ? (
                            <nav className="d-flex flex-wrap gap-2">
                                <NavLink
                                    to="/devices"
                                    className={({isActive}) =>
                                        `nav-pill ${isActive ? 'nav-pill-active' : ''}`
                                    }
                                >
                                    Девайсы
                                </NavLink>

                                <NavLink
                                    to="/servers"
                                    className={({isActive}) =>
                                        `nav-pill ${isActive ? 'nav-pill-active' : ''}`
                                    }
                                >
                                    Серверы
                                </NavLink>
                            </nav>
                        ) : null}
                        <div className="d-flex align-items-center gap-3">
                            <div className="user-badge">
                                <span>{initials}</span>
                            </div>
                                <div>
                                    <div className="fw-semibold">{user?.phone}</div>
                                    {user?.isAdmin ? (
                                    <div className="small text-secondary">
                                        {user?.isAdmin ? 'Администратор' : 'Пользователь'}
                                    </div>
                                    ) : null}
                                </div>

                            <button
                                type="button"
                                className="btn btn-outline-light btn-sm"
                                onClick={() => {
                                    logout()
                                    navigate('/auth', {replace: true})
                                }}
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container py-4 py-lg-5">
                {(title || subtitle) && (
                    <section className="hero-panel mb-4 mb-lg-5">
                        <div className="row g-4 align-items-end">
                            <div className="col-lg-8">
                                {title ? <p className="eyebrow mb-2">dashboard</p> : null}
                                {title ? <h1 className="display-title mb-3">{title}</h1> : null}
                                {subtitle ? (
                                    <p className="hero-copy mb-0">{subtitle}</p>
                                ) : null}
                            </div>
                            <div className="col-lg-4">
                                <div className="hero-metric">
                                    <span className="hero-metric-label">Роль доступа</span>
                                    <strong>{user?.isAdmin ? 'admin' : 'user'}</strong>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {children}
            </main>
        </div>
    )
}
