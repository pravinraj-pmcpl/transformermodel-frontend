import logoUrl from '../assets/precimeasure-logo-white.png'

interface NavItem {
  label: string
  hasDropdown?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home' },
  { label: 'Company', hasDropdown: true },
  { label: 'Products', hasDropdown: true },
  { label: 'Resource', hasDropdown: true },
]

function Header() {
  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '18px 40px',
        background: 'rgba(15, 23, 42, 0.35)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <img src={logoUrl} alt="Precimeasure - Protection and Beyond" style={{ height: 42, width: 'auto' }} />

      <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {NAV_ITEMS.map((item) => (
          <span
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#fff',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {item.label}
            {item.hasDropdown && <span style={{ fontSize: 10 }}>▾</span>}
          </span>
        ))}
      </nav>

      <button
        type="button"
        style={{
          background: '#1652c9',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '10px 22px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Contact Us
      </button>
    </header>
  )
}

export default Header
