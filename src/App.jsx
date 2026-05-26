import React, { useEffect, useMemo, useState } from "react";
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
  Plus,
  RefreshCcw,
  Save,
  Search,
  Stethoscope,
  UserPlus,
  UserRound
} from "lucide-react";
import { api, downloadReport } from "./api.js";

const emptyDoctor = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
  qualification: "",
  room_number: ""
};

const emptyPatient = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  address: ""
};

const emptyBooking = {
  patient_id: "",
  doctor_id: "",
  appointment_date: "",
  start_time: "",
  end_time: "",
  reason: ""
};

const emptyAvailability = {
  doctor_id: "",
  day_of_week: "Monday",
  start_time: "",
  end_time: ""
};

const tabs = [
  { id: "analytics", label: "Analytics", icon: LayoutDashboard, roles: ["admin", "receptionist", "doctor"] },
  { id: "doctors", label: "Doctors", icon: Stethoscope, roles: ["admin", "receptionist", "patient", "doctor"] },
  { id: "booking", label: "Book", icon: CalendarClock, roles: ["admin", "receptionist", "patient"] },
  { id: "patient", label: "Patient", icon: UserRound, roles: ["admin", "receptionist", "patient"] },
  { id: "doctor", label: "Doctor", icon: HeartPulse, roles: ["admin", "doctor", "receptionist"] },
  { id: "history", label: "History", icon: History, roles: ["admin", "doctor", "receptionist", "patient"] }
];

const statusOptions = ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled", "Rescheduled"];
const consultationStatus = ["Pending", "In Progress", "Completed"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

function requiredValues(values, labels) {
  const missing = Object.entries(labels).find(([key]) => !String(values[key] || "").trim());
  if (missing) throw new Error(`${missing[1]} is required.`);
}

function nextStatusOptions(role, mode) {
  if (role === "doctor" || mode === "doctor") return consultationStatus;
  if (role === "receptionist") return ["Confirmed", "Rescheduled", "Cancelled"];
  return statusOptions;
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

function TextField({ value, onChange, ...props }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} {...props} />;
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
  const [message, setMessage] = useState("");

  async function report(path, filename) {
    setMessage("");
    try {
      await downloadReport(path, { role, filename });
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) return <Empty message="Loading hospital analytics..." />;
  if (error) return <Notice type="error">{error}</Notice>;

  const workload = data.doctorWorkload || data.workload || [];

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Hospital Analytics</h2>
          <p>Appointment volume, active patients, consultations, and doctor workload.</p>
        </div>
        <div className="actions">
          <button type="button" className="icon-button" onClick={() => report("/api/reports/appointments", "appointments-report.csv")} title="Download appointments report">
            <Download size={17} /> Appointments
          </button>
          <button type="button" className="icon-button" onClick={() => report("/api/reports/consultations", "consultations-report.csv")} title="Download consultations report">
            <Download size={17} /> Consultations
          </button>
        </div>
      </div>
      <Notice type="error">{message}</Notice>
      <div className="stats-grid">
        <StatCard label="Total Appointments" value={data.totalAppointments} icon={CalendarClock} />
        <StatCard label="Active Patients" value={data.activePatients} icon={UserRound} />
        <StatCard label="Completed Consultations" value={data.completedConsultations} icon={CheckCircle2} />
        <StatCard label="Open Visits" value={data.pendingAppointments} icon={Activity} />
      </div>
      <h3>Doctor Workload</h3>
      {!workload.length && <Empty message="No doctor workload data is available yet." />}
      {!!workload.length && (
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
              {workload.map((row) => (
                <tr key={row.doctor_id || row.id || row.doctor_name}>
                  <td>{row.doctor_name || row.name}</td>
                  <td>{row.specialization || "Not specified"}</td>
                  <td>{row.appointment_count ?? row.appointments ?? 0}</td>
                  <td>{row.completed_count ?? row.completed ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Doctors({ role }) {
  const [refresh, setRefresh] = useState(0);
  const { data, loading, error } = useLoad(() => api("/api/doctors", { role }), [role, refresh]);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [slotForm, setSlotForm] = useState(emptyAvailability);
  const [message, setMessage] = useState("");

  async function createDoctor(event) {
    event.preventDefault();
    setMessage("");
    try {
      requiredValues(doctorForm, { name: "Doctor name", email: "Email", specialization: "Specialization" });
      await api("/api/doctors", { role, method: "POST", body: JSON.stringify(doctorForm) });
      setMessage("Doctor profile created.");
      setDoctorForm(emptyDoctor);
      setRefresh((value) => value + 1);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createAvailability(event) {
    event.preventDefault();
    setMessage("");
    try {
      requiredValues(slotForm, { doctor_id: "Doctor", day_of_week: "Day", start_time: "Start time", end_time: "End time" });
      await api(`/api/doctors/${slotForm.doctor_id}/availability`, {
        role,
        method: "POST",
        body: JSON.stringify(slotForm)
      });
      setMessage("Availability slot saved.");
      setSlotForm(emptyAvailability);
      setRefresh((value) => value + 1);
    } catch (error) {
      setMessage(error.message);
    }
  }

  const doctors = data || [];
  const canManage = ["admin", "doctor"].includes(role);

  return (
    <section className="grid-two">
      <div className="panel">
        <div className="section-head">
          <div>
            <h2>Doctor Listing</h2>
            <p>Specializations, rooms, ratings, and consultation availability.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => setRefresh((value) => value + 1)} title="Refresh doctors">
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
        {loading && <Empty message="Loading doctors..." />}
        {error && <Notice type="error">{error}</Notice>}
        {!loading && !doctors.length && <Empty message="No doctors found. Add doctor profiles to start scheduling." />}
        <div className="doctor-list">
          {doctors.map((doctor) => (
            <article className="doctor-card" key={doctor.id}>
              <div className="doctor-card-head">
                <div>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialization} &middot; {doctor.qualification || "Qualification pending"}</p>
                </div>
                <span className="badge">Room {doctor.room_number || "TBD"}</span>
              </div>
              <div className="availability">
                {(doctor.availability || []).length ? doctor.availability.map((slot) => (
                  <span key={slot.id || `${slot.day_of_week}-${slot.start_time}`}>
                    {slot.day_of_week} {slot.start_time}-{slot.end_time}
                  </span>
                )) : <span>No availability configured</span>}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="stack">
        <Notice>{message}</Notice>
        {canManage && (
          <form className="panel form-panel" onSubmit={createDoctor}>
            <h2>Create Doctor</h2>
            <TextField required placeholder="Full name" value={doctorForm.name} onChange={(name) => setDoctorForm({ ...doctorForm, name })} />
            <TextField required type="email" placeholder="Email" value={doctorForm.email} onChange={(email) => setDoctorForm({ ...doctorForm, email })} />
            <TextField placeholder="Phone" value={doctorForm.phone} onChange={(phone) => setDoctorForm({ ...doctorForm, phone })} />
            <TextField required placeholder="Specialization" value={doctorForm.specialization} onChange={(specialization) => setDoctorForm({ ...doctorForm, specialization })} />
            <TextField placeholder="Qualification" value={doctorForm.qualification} onChange={(qualification) => setDoctorForm({ ...doctorForm, qualification })} />
            <TextField placeholder="Room number" value={doctorForm.room_number} onChange={(room_number) => setDoctorForm({ ...doctorForm, room_number })} />
            <button type="submit"><Plus size={17} /> Create Profile</button>
          </form>
        )}
        {canManage && (
          <form className="panel form-panel" onSubmit={createAvailability}>
            <h2>Set Availability</h2>
            <select required value={slotForm.doctor_id} onChange={(event) => setSlotForm({ ...slotForm, doctor_id: event.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
            </select>
            <select required value={slotForm.day_of_week} onChange={(event) => setSlotForm({ ...slotForm, day_of_week: event.target.value })}>
              {days.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <div className="form-grid one-line">
              <input required type="time" value={slotForm.start_time} onChange={(event) => setSlotForm({ ...slotForm, start_time: event.target.value })} />
              <input required type="time" value={slotForm.end_time} onChange={(event) => setSlotForm({ ...slotForm, end_time: event.target.value })} />
            </div>
            <button type="submit"><Save size={17} /> Save Slot</button>
          </form>
        )}
        {!canManage && <Empty message="Doctor profiles and availability are managed by admins and doctors." />}
      </div>
    </section>
  );
}

function Booking({ role }) {
  const [refresh, setRefresh] = useState(0);
  const doctors = useLoad(() => api("/api/doctors", { role }), [role, refresh]);
  const patients = useLoad(() => api("/api/users?role=patient", { role: role === "patient" ? "admin" : role }), [role, refresh]);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [message, setMessage] = useState("");

  async function registerPatient(event) {
    event.preventDefault();
    setMessage("");
    try {
      requiredValues(patientForm, { name: "Patient name", email: "Email", phone: "Phone" });
      await api("/api/users", {
        role: role === "patient" ? "admin" : role,
        method: "POST",
        body: JSON.stringify({ ...patientForm, role: "patient" })
      });
      setMessage("Patient registered and available for booking.");
      setPatientForm(emptyPatient);
      setRefresh((value) => value + 1);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function bookAppointment(event) {
    event.preventDefault();
    setMessage("");
    try {
      requiredValues(bookingForm, {
        patient_id: "Patient",
        doctor_id: "Doctor",
        appointment_date: "Date",
        start_time: "Start time",
        end_time: "End time",
        reason: "Reason"
      });
      await api("/api/appointments", { role, method: "POST", body: JSON.stringify(bookingForm) });
      setMessage("Appointment request submitted. Confirmation status is visible in dashboards.");
      setBookingForm(emptyBooking);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="booking-layout">
      <form className="panel form-panel" onSubmit={registerPatient}>
        <h2>Patient Registration</h2>
        <div className="form-grid">
          <TextField required placeholder="Full name" value={patientForm.name} onChange={(name) => setPatientForm({ ...patientForm, name })} />
          <TextField required type="email" placeholder="Email" value={patientForm.email} onChange={(email) => setPatientForm({ ...patientForm, email })} />
          <TextField required placeholder="Phone" value={patientForm.phone} onChange={(phone) => setPatientForm({ ...patientForm, phone })} />
          <TextField type="number" min="0" placeholder="Age" value={patientForm.age} onChange={(age) => setPatientForm({ ...patientForm, age })} />
          <select value={patientForm.gender} onChange={(event) => setPatientForm({ ...patientForm, gender: event.target.value })}>
            <option value="">Gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
          <TextField placeholder="Address" value={patientForm.address} onChange={(address) => setPatientForm({ ...patientForm, address })} />
        </div>
        <button type="submit"><UserPlus size={17} /> Register Patient</button>
      </form>

      <form className="panel form-panel" onSubmit={bookAppointment}>
        <div className="section-head compact">
          <div>
            <h2>Appointment Booking</h2>
            <p>The API rejects duplicate active bookings for the same doctor, date, and time.</p>
          </div>
        </div>
        <Notice>{message}</Notice>
        {(doctors.error || patients.error) && <Notice type="error">{doctors.error || patients.error}</Notice>}
        <div className="form-grid">
          <select required value={bookingForm.patient_id} onChange={(event) => setBookingForm({ ...bookingForm, patient_id: event.target.value })}>
            <option value="">Select patient</option>
            {(patients.data || []).map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
          </select>
          <select required value={bookingForm.doctor_id} onChange={(event) => setBookingForm({ ...bookingForm, doctor_id: event.target.value })}>
            <option value="">Select doctor</option>
            {(doctors.data || []).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialization}</option>)}
          </select>
          <input required type="date" value={bookingForm.appointment_date} onChange={(event) => setBookingForm({ ...bookingForm, appointment_date: event.target.value })} />
          <input required type="time" value={bookingForm.start_time} onChange={(event) => setBookingForm({ ...bookingForm, start_time: event.target.value })} />
          <input required type="time" value={bookingForm.end_time} onChange={(event) => setBookingForm({ ...bookingForm, end_time: event.target.value })} />
          <TextField required placeholder="Reason for visit" value={bookingForm.reason} onChange={(reason) => setBookingForm({ ...bookingForm, reason })} />
        </div>
        <button type="submit"><CalendarClock size={17} /> Book Appointment</button>
      </form>
    </section>
  );
}

function AppointmentTable({ role, patientOnly = false, doctorMode = false }) {
  const [filters, setFilters] = useState({ search: "", status: "", date: "" });
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    return params.toString();
  }, [filters]);
  const { data, loading, error } = useLoad(() => api(`/api/appointments${query ? `?${query}` : ""}`, { role }), [role, query, refresh]);
  const rows = data || [];
  const options = nextStatusOptions(role, doctorMode ? "doctor" : "appointment");

  async function setStatus(id, status) {
    setMessage("");
    try {
      await api(`/api/appointments/${id}/status`, {
        role,
        method: "PUT",
        body: JSON.stringify({ status })
      });
      setMessage(`Appointment marked ${status}.`);
      setRefresh((value) => value + 1);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>{doctorMode ? "Doctor Dashboard" : patientOnly ? "Patient Dashboard" : "Appointments"}</h2>
          <p>Confirmations, status changes, search, filters, and visit tracking.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => setRefresh((value) => value + 1)} title="Refresh appointments">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>
      <div className="filters">
        <label>
          <Search size={16} />
          <input placeholder="Search doctor, patient, reason" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <label>
          <Filter size={16} />
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
      </div>
      <Notice>{message}</Notice>
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
                  <td><span className={`status ${String(row.status).toLowerCase().replaceAll(" ", "-")}`}>{row.status}</span></td>
                  <td>
                    <select value={row.status} onChange={(event) => setStatus(row.id, event.target.value)}>
                      {options.map((status) => <option key={status} value={status}>{status}</option>)}
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
      {patients.error && <Notice type="error">{patients.error}</Notice>}
      <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>
        <option value="">Select patient</option>
        {(patients.data || []).map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </select>
      {!patientId && <Empty message="Choose a patient to view medical history." />}
      {history.loading && patientId && <Empty message="Loading patient history..." />}
      {history.error && <Notice type="error">{history.error}</Notice>}
      {history.data && (
        <div className="timeline">
          {(history.data.records || []).length ? history.data.records.map((record) => (
            <article key={record.id} className="visit-card">
              <div>
                <strong>{record.visit_date}</strong>
                <span>{record.doctor_name} &middot; {record.specialization}</span>
              </div>
              <h3>{record.diagnosis}</h3>
              <p>{record.symptoms || "No symptoms recorded."}</p>
              <p>{record.treatment || "No treatment notes recorded."}</p>
              {(record.prescriptions || []).length > 0 && <small>{record.prescriptions.map((p) => `${p.medicine} ${p.dosage}`).join(", ")}</small>}
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
  const visibleTabs = useMemo(() => tabs.filter((tab) => tab.roles.includes(role)), [role]);
  const current = visibleTabs.find((tab) => tab.id === active) || visibleTabs[0];
  const ActiveIcon = current?.icon || ClipboardList;

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some((tab) => tab.id === active)) setActive(visibleTabs[0].id);
  }, [active, visibleTabs]);

  return (
    <div className="app-shell">
      <Toolbar role={role} setRole={setRole} />
      <nav className="tabs" aria-label="Primary">
        {visibleTabs.map((tab) => {
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
          <span>{current?.label}</span>
        </div>
        {current?.id === "analytics" && <Analytics role={role} />}
        {current?.id === "doctors" && <Doctors role={role} />}
        {current?.id === "booking" && <Booking role={role} />}
        {current?.id === "patient" && <AppointmentTable role={role} patientOnly />}
        {current?.id === "doctor" && <AppointmentTable role={role} doctorMode />}
        {current?.id === "history" && <HistoryView role={role} />}
      </main>
    </div>
  );
}
