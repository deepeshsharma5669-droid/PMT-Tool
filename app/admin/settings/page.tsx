import { getOrgSettings, getHolidays } from '@/lib/data-access'
import { HolidaysPanel } from '@/components/admin/HolidaysPanel'
import { AgencyCalendarForm } from '@/components/admin/AgencyCalendarForm'

export default async function AdminSettings() {
  const settings = await getOrgSettings()
  const holidays = await getHolidays()

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Org Settings</h1>
          <p className="sub">Business hours, working days, holidays.</p>
        </div>
      </div>

      <div className="two-col">
        <AgencyCalendarForm settings={settings} />
        <HolidaysPanel initialHolidays={holidays} />
      </div>
    </div>
  )
}