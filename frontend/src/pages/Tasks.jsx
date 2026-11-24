import { useState } from 'react'
import {
  Plus, Pencil, Trash2, Circle, CheckCircle, Clock, AlertTriangle, CalendarDays,
  CheckSquare, MapPin,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ItemForm from '../components/common/ItemForm'
import Tabs, { tabPanelProps } from '../components/common/Tabs'
import { formatDate, daysUntil } from '../utils/helpers'
import { PRIORITIES, taskFields, appointmentFields } from '../utils/fields'
import { useConfirm } from '../context/ConfirmContext'
import { dueStatus, formatTime } from '../utils/display'
import useFocusItem from '../hooks/useFocusItem'

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 } // used for sorting

export default function Tasks() {
  const {
    tasks, addTask, updateTask, deleteTask, toggleTask,
    appointments, addAppointment, updateAppointment, deleteAppointment, toggleAppointment,
  } = useApp()
  const confirm = useConfirm()

  const [tab, setTab] = useState('tasks') // 'tasks' | 'appointments'
  // Each tab remembers its own status filter: 'pending' | 'completed' | 'all'
  const [statusFilters, setStatusFilters] = useState({ tasks: 'pending', appointments: 'pending' })
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null) // null = adding something new

  const isTasks = tab === 'tasks'
  const statusFilter = statusFilters[tab]
  const setStatusFilter = (value) => setStatusFilters((current) => ({ ...current, [tab]: value }))

  // Opened from a link such as Search ("/tasks?focus=<id>"): open the right tab, show every status, highlight the row.
  useFocusItem((id, tabParam) => {
    const target = tabParam === 'appointments' || appointments.some((a) => a.id === id) ? 'appointments' : 'tasks'
    setTab(target)
    setStatusFilters((current) => ({ ...current, [target]: 'all' }))
    setPriorityFilter('All')
  })

  // ----- Numbers for the stat cards and tab labels -----
  const pendingTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.length - pendingTasks.length
  const overdueTasks = pendingTasks.filter((t) => daysUntil(t.deadline) < 0).length
  const pendingAppointments = appointments.filter((a) => !a.completed)
  const upcomingAppointments = pendingAppointments.filter((a) => daysUntil(a.date) >= 0).length
  const overdueAppointments = pendingAppointments.length - upcomingAppointments // pending and already in the past

  // ----- Lists to show -----
  const matchesStatus = (item) =>
    statusFilter === 'all' || (statusFilter === 'completed' ? item.completed : !item.completed)

  // Tasks: earliest deadline first; same deadline -> higher priority first.
  const visibleTasks = tasks
    .filter(matchesStatus)
    .filter((t) => priorityFilter === 'All' || t.priority === priorityFilter)
    .sort(
      (a, b) =>
        a.deadline.localeCompare(b.deadline) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    )

  // Appointments: earliest date and time first.
  const visibleAppointments = appointments
    .filter(matchesStatus)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

  const visible = isTasks ? visibleTasks : visibleAppointments

  // ----- Add / edit / delete -----
  const openAdd = () => {
    setEditingItem(null)
    setModalOpen(true)
  }
  const openEdit = (item) => {
    setEditingItem(item)
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const handleSubmit = (values) => {
    if (isTasks) editingItem ? updateTask(editingItem.id, values) : addTask(values)
    else editingItem ? updateAppointment(editingItem.id, values) : addAppointment(values)
    closeModal()
  }

    const handleDelete = async (item) => {
    const ok = await confirm({ title: `Delete ${isTasks ? 'task' : 'appointment'}`, message: `Delete "${item.title}"? This cannot be undone.` })
    if (!ok) return
    isTasks ? deleteTask(item.id) : deleteAppointment(item.id)
  }

  const noun = isTasks ? 'task' : 'appointment'

  return (
    <>
      <PageHeader
        title="Tasks & Appointments"
        subtitle="Plan your day with tasks, priorities and appointments."
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add {noun}
          </button>
        }
      />

      <div className="stat-grid">
        <StatCard label="Pending tasks" value={pendingTasks.length} icon={Clock} tone="warning" />
        <StatCard label="Completed tasks" value={completedTasks} icon={CheckCircle} tone="success" />
        <StatCard label="Overdue tasks" value={overdueTasks} icon={AlertTriangle} tone="danger" />
        <StatCard label="Upcoming appointments" value={upcomingAppointments} icon={CalendarDays} tone="primary" />
      </div>

      {/* Tabs + filters */}
      <div className="toolbar">
        <Tabs
          id="tasks-tabs"
          label="Tasks or appointments"
          tabs={[
            { key: 'tasks', label: `Tasks (${pendingTasks.length} pending)` },
            {
              key: 'appointments',
              label: `Appointments (${pendingAppointments.length} pending${overdueAppointments ? `, ${overdueAppointments} overdue` : ''})`,
            },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div className="toolbar-filters">
          <select className="filter-select" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="all">All</option>
          </select>

          {isTasks && (
            <select className="filter-select" aria-label="Filter by priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="All">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div {...tabPanelProps('tasks-tabs', tab)}>
      {visible.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={`No ${noun}s here`}
          message={`Add a ${noun}, or change the filters above.`}
          action={
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={18} /> Add {noun}
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th><span className="sr-only">Done</span></th>
                <th>{isTasks ? 'Task' : 'Appointment'}</th>
                {isTasks ? <th>Priority</th> : <th>Location</th>}
                <th>{isTasks ? 'Deadline' : 'Date & time'}</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const date = isTasks ? item.deadline : item.date
                const toggle = () => (isTasks ? toggleTask(item.id) : toggleAppointment(item.id))
                return (
                  <tr key={item.id} data-item-id={item.id}>
                    {/* Round button: click to mark done / not done */}
                    <td className="col-check">
                      <button
                        className={`check-btn ${item.completed ? 'done' : ''}`}
                        title={item.completed ? 'Mark as pending' : 'Mark as done'}
                        aria-label={`${item.completed ? 'Mark as pending' : 'Mark as done'}: ${item.title}`}
                        onClick={toggle}
                      >
                        {item.completed ? <CheckCircle size={22} /> : <Circle size={22} />}
                      </button>
                    </td>
                    <td className={item.completed ? 'done-text' : ''}>
                      <strong>{item.title}</strong>
                    </td>
                    <td data-label={isTasks ? 'Priority' : 'Location'}>
                      {isTasks ? (
                        <StatusBadge status={item.priority.toLowerCase()} />
                      ) : item.location ? (
                        <span className="muted-inline"><MapPin size={14} /> {item.location}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td data-label={isTasks ? 'Deadline' : 'Date & time'}>
                      {formatDate(date)}
                      {!isTasks && <span className="muted"> · {formatTime(item.time)}</span>}
                      <div>
                        <StatusBadge status={dueStatus(date, item.completed)} />
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" title="Edit" aria-label={`Edit ${item.title}`} onClick={() => openEdit(item)}>
                          <Pencil size={18} />
                        </button>
                        <button className="icon-btn" title="Delete" aria-label={`Delete ${item.title}`} onClick={() => handleDelete(item)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* The same modal is used for adding and editing, for both tasks and appointments */}
      <Modal isOpen={modalOpen} title={`${editingItem ? 'Edit' : 'Add'} ${noun}`} onClose={closeModal}>
        <ItemForm
          fields={isTasks ? taskFields : appointmentFields}
          initialValues={editingItem}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitLabel={editingItem ? 'Save changes' : `Add ${noun}`}
        />
      </Modal>
    </>
  )
}