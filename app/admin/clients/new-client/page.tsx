import { AddClientForm } from '@/components/admin/AddClientForm'

export default function NewClientPage() {
  return (
    <div>
      <div className="crumb">
        <a href="/admin/clients" style={{ color: 'var(--ink-soft)', textDecoration: 'underline' }}>Clients</a>
        {' · New client'}
      </div>
      <AddClientForm />
    </div>
  )
}