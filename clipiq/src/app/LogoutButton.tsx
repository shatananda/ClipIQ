'use client';

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: '500',
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLButtonElement).style.backgroundColor = 'var(--bg-light)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
      }}
    >
      Logout
    </button>
  );
}
