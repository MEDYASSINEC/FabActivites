import { Link, useLocation } from 'react-router-dom'
function Header({ unsavedByPage = {}, hasUnsavedChanges = false }) {
    const route = useLocation()
    const path = route.pathname

    const navItems = [
        { to: '/', label: 'Dashboard' },
        { to: '/projects', label: 'Projects' },
        { to: '/frequentation', label: 'Fréquentation' },
        { to: '/occupation', label: 'Occupation' },
        { to: '/settings', label: 'Paramètres' },
    ];

    const handleNavigate = (e, to) => {
        if (to === path) return;
        if (!hasUnsavedChanges) return;

        const shouldLeave = window.confirm('Vous avez des modifications non sauvegardées. Quitter sans sauvegarder ?');
        if (!shouldLeave) {
            e.preventDefault();
        }
    };

    return (
        <div style={{ background: "#0061AA", position: "sticky", top: 0, zIndex: 1000, flexShrink: 0 }}>
            <div style={{ display: "flex", padding: "0 8px" }}>
                {navItems.map((item) => {
                    const isActive = path === item.to;
                    const hasUnsavedOnPage = Boolean(unsavedByPage[item.to]);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={(e) => handleNavigate(e, item.to)}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                            style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: isActive ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", borderBottom: isActive ? "2px solid #fff" : "2px solid transparent", background: isActive ? "rgba(255,255,255,0.12)" : undefined, textTransform: "uppercase", letterSpacing: ".3px", textDecoration: 'none', position: 'relative' }}
                        >
                            {item.label}
                            {hasUnsavedOnPage && (
                                <span
                                    title="Modifications non sauvegardées"
                                    style={{
                                        position: 'absolute',
                                        top: 5,
                                        right: 4,
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        background: '#ff3b30',
                                        boxShadow: '0 0 0 1px rgba(255,255,255,0.6)',
                                    }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    )
}

export default Header;
