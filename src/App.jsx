import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  HeartPulse,
  History,
  LayoutDashboard,
  Search,
  Stethoscope,
  UserRound
} from "lucide-react";
import { api, reportUrl } from "./api.js";

const tabs = [
  { id: "analytics", label: "Analytics", icon: LayoutDashboard },
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "booking", label: "Book", icon: CalendarClock },
  { id: "patient", label: "Patient", icon: UserRound },
  { id: "doctor", label: "Doctor", icon: HeartPulse },
  { id: "history", label: "History", icon: History }
];

const statusOptions = ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled", "Rescheduled"];

function useLoad(loader, deps) {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let alive = true;
    setState((current) => ({ ...current, loading: true, error: "" }));
    loader()
      .then((data) => alive && setState({ loading: false, error: "", data }))
      .catch((error) => alive && setState({ loading: false, error: error.message, data: null }));
    return () => {
      alive = false;
    };
  }, deps);

  return state;
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <article className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}

function Empty({ message }) {
  return <div className="empty">{message}</div>;
}

function Notice({ type = "info", children }) {
  if (!children) return null;
  return <div className={`notice ${type}`}>{children}</div>;
}

function Toolbar({ role, setRole }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">CareSync Hub</p>
        <h1>Hospital Appointment & Patient Management</h1>
      </div>
      <label className="role-picker">
        <span>Role</span>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="admin">Admin</option>
          <option value="receptionist">Receptionist</option>
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
        </select>
      </label>
    </header>
  );
}

function Analytics({ role }) {
  const { data, loading, error } = useLoad(() => api("/api/dashboard/summary", { role }), [role]);

  if (loading) return <Empty message="Loading hospital analytics..." />;
  if (error) return <Notice type="error">{error}</Notice>;

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Hospital Analytics</h2>
          <p>Appointment volume, active patients, consultations, and workload.</p>
        </div>
        <div className="actions">
          <a className="icon-button" href={reportUrl("/api/reports/appointments")} title="Download appointments report">
            <Download size={17} /> Appointments
          </a>
          <a className="icon-button" href={reportUrl("/api/reports/consultations")} title="Download consultations report">
            <Download size={17} /> Consultations
          </a>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Total Appointments" value={data.totalAppointments} icon={CalendarClock} />
        <StatCard label="Active Patients" value={data.activePatients} icon={UserRound} />
        <StatCard label="Completed Consultations" value={data.completedConsultations} icon={CheckCircle2} />
        <StatCard label="Open Visits" value={data.pendingAppointments} icon={Activity} />
      </div>
      <h3>Doctor Workload</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialization</th>
              <th>Appointments</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {data.doctorWorkload.map((row) => (
              <tr key={row.doctor_id}>
                <td>{row.doctor_name}</td>
                <td>{row.specialization}</td>
                <td>{row.appointment_count}</td>
                <td>{row.completed_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Doctors({ role }) {
  const { data, loading, error } = useLoad(() => api("/api/doctors", { role }), [role]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", specialization: "", qualification: "", room_number: "" });
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api("/api/doctors", { role, method: "POST", body: JSON.stringify(form) });
      setMessage("Doctor profile created. Refresh the page to see the latest list.");
      setForm({ name: "", email: "", phone: "", specialization: "", qualification: "", room_number: "" });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="grid-two">
      <div className="panel">
        <div className="section-head">
          <div>
            <h2>Doctor Listing</h2>
            <p>Specializations, rooms, ratings, and consultation availability.</p>
          </div>
        </div>
        {loading && <Empty message="Loading doctors..." />}
        {error && <Notice type="error">{error}</Notice>}
        <div className="doctor-list">
          {(data || []).map((doctor) => (
            <article className="doctor-card" key={doctor.id}>
              <div>
                <h3>{doctor.name}</h3>
                <p>{doctor.specialization} · {doctor.qualification || "Qualification pending"}</p>
              </div>
              <span className="badge">Room {doctor.room_number || "TBD"}</span>
              <div className="availability">
                {doctor.availability.length ? doctor.availability.map((slot) => (
                  <span key={slot.id}>{slot.day_of_week} {slot.start_time}-{slot.end_time}</span>
                )) : <span>No availability configured</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
      <form className="panel form-panel" onSubmit={submit}>
        <h2>Create Doctor</h2>
        <Notice>{message}</Notice>
        <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
        <input placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
        <input placeholder="Room number" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
        <button type="submit">Create Profile</button>
      </form>
    </section>
  );
}

function Booking({ role }) {
  const doctors = useLoad(() => api("/api/doctors", { role }), [role]);
  const patients = useLoad(() => api("/api/users?role=patient", { role: role === "patient" ? "admin" : role }), [role]);
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    start_time: "",
    end_time: "",
    reason: ""
  });
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api("/api/appointments", { role, method: "POST", body: JSON.stringify(form) });
      setMessage("Appointment request submitted and visible in dashboards.");
      setForm({ patient_id: "", doctor_id: "", appointment_date: "", start_time: "", end_time: "", reason: "" });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <form className="panel form-panel wide-form" onSubmit={submit}>
      <h2>Appointment Booking</h2>
      <p>Duplicate active bookings for the same doctor, date, and time are rejected by the API.</p>
      <Notice>{message}</Notice>
      <div className="form-grid">
        <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
          <option value="">Select patient</option>
          {(patients.data || []).map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
        </select>
        <select required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
          <option value="">Select doctor</option>
          {(doctors.data || []).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialization}</option>)}
        </select>
        <input required type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
        <input required type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        <input required type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        <input required placeholder="Reason for visit" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      </div>
      <button type="submit">Book Appointment</button>
    </form>
  );
}

function AppointmentTable({ role, patientOnly = false, doctorMode = false }) {
  const [filters, setFilters] = useState({ search: "", status: "", date: "" });
  const [refresh, setRefresh] = useState(0);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    return params.toString();
  }, [filters]);
  const { data, loading, error } = useLoad(() => api(`/api/appointments${query ? `?${query}` : ""}`, { role }), [role, query, refresh]);
  const rows = patientOnly ? (data || []).filter((row) => row.patient_name) : data || [];

  async function setStatus(id, status) {
    await api(`/api/appointments/${id}/status`, {
      role,
      method: "PUT",
      body: JSON.stringify({ status })
    });
    setRefresh((value) => value + 1);
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>{doctorMode ? "Doctor Dashboard" : patientOnly ? "Patient Dashboard" : "Appointments"}</h2>
          <p>Confirmations, status changes, search, filters, and visit tracking.</p>
        </div>
      </div>
      <div className="filters">
        <label>
          <Search size={16} />
          <input placeholder="Search doctor, patient, reason" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </label>
        <label>
          <Filter size={16} />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
      </div>
      {loading && <Empty message="Loading appointments..." />}
      {error && <Notice type="error">{error}</Notice>}
      {!loading && !rows.length && <Empty message="No appointments match the current filters." />}
      {!!rows.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.appointment_date}</td>
                  <td>{row.start_time}-{row.end_time}</td>
                  <td>{row.patient_name}</td>
                  <td>{row.doctor_name}</td>
                  <td>{row.reason}</td>
                  <td><span className={`status ${row.status.toLowerCase().replaceAll(" ", "-")}`}>{row.status}</span></td>
                  <td>
                    <select value={row.status} onChange={(e) => setStatus(row.id, e.target.value)}>
                      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function HistoryView({ role }) {
  const patients = useLoad(() => api("/api/users?role=patient", { role: role === "patient" ? "admin" : role }), [role]);
  const [patientId, setPatientId] = useState("");
  const history = useLoad(
    () => patientId ? api(`/api/patients/${patientId}/history`, { role }) : Promise.resolve(null),
    [role, patientId]
  );

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Medical History</h2>
          <p>Patient visit records, diagnosis, treatment, and prescriptions.</p>
        </div>
      </div>
      <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
        <option value="">Select patient</option>
        {(patients.data || []).map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </select>
      {!patientId && <Empty message="Choose a patient to view medical history." />}
      {history.error && <Notice type="error">{history.error}</Notice>}
      {history.data && (
        <div className="timeline">
          {history.data.records.length ? history.data.records.map((record) => (
            <article key={record.id} className="visit-card">
              <div>
                <strong>{record.visit_date}</strong>
                <span>{record.doctor_name} · {record.specialization}</span>
              </div>
              <h3>{record.diagnosis}</h3>
              <p>{record.symptoms || "No symptoms recorded."}</p>
              <p>{record.treatment || "No treatment notes recorded."}</p>
              {record.prescriptions.length > 0 && <small>{record.prescriptions.map((p) => `${p.medicine} ${p.dosage}`).join(", ")}</small>}
            </article>
          )) : <Empty message="No medical records found for this patient." />}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState("analytics");
  const [role, setRole] = useState("admin");
  const ActiveIcon = tabs.find((tab) => tab.id === active)?.icon || ClipboardList;

  return (
    <div className="app-shell">
      <Toolbar role={role} setRole={setRole} />
      <nav className="tabs" aria-label="Primary">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button className={active === tab.id ? "active" : ""} key={tab.id} onClick={() => setActive(tab.id)}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <main>
        <div className="page-title">
          <ActiveIcon size={24} />
          <span>{tabs.find((tab) => tab.id === active)?.label}</span>
        </div>
        {active === "analytics" && <Analytics role={role} />}
        {active === "doctors" && <Doctors role={role} />}
        {active === "booking" && <Booking role={role} />}
        {active === "patient" && <AppointmentTable role={role} patientOnly />}
        {active === "doctor" && <AppointmentTable role={role} doctorMode />}
        {active === "history" && <HistoryView role={role} />}
      </main>
    </div>
  );
}
