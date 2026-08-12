import { signOutAction } from '@/app/logout/actions'

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="switch-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
        Log out
      </button>
    </form>
  )
}