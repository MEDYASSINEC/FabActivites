import { Link, useLocation } from 'react-router-dom'
function Header() {
    const route = useLocation()
    const path = route.pathname

    return (
        <div style={{ background: "#0061AA", position: "sticky", top: 0, zIndex: 1000, flexShrink: 0 }}>
            <div style={{ display: "flex", padding: "0 8px" }}>
                <Link to='/' className={`nav-link ${path === '/' ? 'active' : ''}`} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: path === '/' ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", borderBottom: path === '/' ? "2px solid #fff" : "2px solid transparent", background: path === '/' ? "rgba(255,255,255,0.12)" : undefined, textTransform: "uppercase", letterSpacing: ".3px", textDecoration: 'none' }}>Dashboard</Link>
                <Link to='/projects' className={`nav-link ${path === '/projects' ? 'active' : ''}`} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: path === '/projects' ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", borderBottom: path === '/projects' ? "2px solid #fff" : "2px solid transparent", background: path === '/projects' ? "rgba(255,255,255,0.12)" : undefined, textTransform: "uppercase", letterSpacing: ".3px", textDecoration: 'none' }}>Projects</Link>
                <Link to='/frequentation' className={`nav-link ${path === '/frequentation' ? 'active' : ''}`} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: path === '/frequentation' ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", borderBottom: path === '/frequentation' ? "2px solid #fff" : "2px solid transparent", background: path === '/frequentation' ? "rgba(255,255,255,0.12)" : undefined, textTransform: "uppercase", letterSpacing: ".3px", textDecoration: 'none' }}>Fréquentation</Link>
                <Link to='/occupation' className={`nav-link ${path === '/occupation' ? 'active' : ''}`} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: path === '/occupation' ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", borderBottom: path === '/occupation' ? "2px solid #fff" : "2px solid transparent", background: path === '/occupation' ? "rgba(255,255,255,0.12)" : undefined, textTransform: "uppercase", letterSpacing: ".3px", textDecoration: 'none' }}>Occupation</Link>
                <Link to='/settings' className={`nav-link ${path === '/settings' ? 'active' : ''}`} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: path === '/settings' ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", borderBottom: path === '/settings' ? "2px solid #fff" : "2px solid transparent", background: path === '/settings' ? "rgba(255,255,255,0.12)" : undefined, textTransform: "uppercase", letterSpacing: ".3px", textDecoration: 'none' }}>Paramètres</Link>
            </div>
        </div>
    )
}

export default Header;