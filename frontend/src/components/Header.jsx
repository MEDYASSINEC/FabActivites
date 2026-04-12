import { Link, useLocation } from 'react-router-dom'
import { useDirtyTracker } from '../context/DirtyTrackerContext';

function DirtyBadge({ show }) {
    if (!show) return null;

    return (
        <span
            style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#E24B4A',
                marginLeft: 6,
                verticalAlign: 'middle',
                flexShrink: 0,
            }}
        />
    );
}

function Header() {
    const route = useLocation()
    const path = route.pathname
    const { isDirty } = useDirtyTracker();

    const linkStyle = (targetPath) => ({
        padding: "7px 14px",
        fontSize: 11,
        fontWeight: 600,
        color: path === targetPath ? "#fff" : "rgba(255,255,255,0.7)",
        cursor: "pointer",
        borderBottom: path === targetPath ? "2px solid #fff" : "2px solid transparent",
        background: path === targetPath ? "rgba(255,255,255,0.12)" : undefined,
        textTransform: "uppercase",
        letterSpacing: ".3px",
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center'
    });

    return (
        <div style={{ background: "#0061AA", position: "sticky", top: 0, zIndex: 1000, flexShrink: 0 }}>
            <div style={{ display: "flex", padding: "0 8px" }}>
                <Link to='/' className={`nav-link ${path === '/' ? 'active' : ''}`} style={linkStyle('/')}>
                    Dashboard
                </Link>

                <Link to='/projects' className={`nav-link ${path === '/projects' ? 'active' : ''}`} style={linkStyle('/projects')}>
                    Projects
                    <DirtyBadge show={isDirty('projets')} />
                </Link>

                <Link to='/frequentation' className={`nav-link ${path === '/frequentation' ? 'active' : ''}`} style={linkStyle('/frequentation')}>
                    Fréquentation
                    <DirtyBadge show={isDirty('frequentations')} />
                </Link>

                <Link to='/occupation' className={`nav-link ${path === '/occupation' ? 'active' : ''}`} style={linkStyle('/occupation')}>
                    Occupation
                    <DirtyBadge show={isDirty('occupations')} />
                </Link>

                <Link to='/settings' className={`nav-link ${path === '/settings' ? 'active' : ''}`} style={linkStyle('/settings')}>
                    Paramètres
                    <DirtyBadge show={isDirty('settings')} />
                </Link>
            </div>
        </div>
    )
}

export default Header;
