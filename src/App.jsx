import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Filter,
  HeartPulse,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UserRound,
  Users
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
  blood_group: "",
  address: "",
  emergency_contact: "",
  allergies: ""
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

const emptyReschedule = {
  appointment_date: "",
  start_time: "",
  end_time: ""
};

const emptyConsultation = {
  appointment_id: "",
  patient_id: "",
  doctor_id: "",
  visit_date: "",
  diagnosis: "",
  symptoms: "",
  treatment: "",
  medicine: "",
  dosage: "",
  instructions: "",
  duration_days: ""
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
const consultationStatus = ["Pending", "Confirmed", "In Progress", "Completed"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const demoPassword = "demo123";
const demoAccounts = [
  { role: "admin", label: "Admin", email: "admin@caresync.test", name: "Hospital Admin" },
  { role: "receptionist", label: "Reception", email: "reception@caresync.test", name: "Riya Reception" },
  { role: "doctor", label: "Doctor", email: "neha.rao@caresync.test", name: "Dr. Neha Rao" },
  { role: "patient", label: "Patient", email: "aarav@caresync.test", name: "Aarav Sharma" }
];

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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem("caresync-session") || "null");
  } catch {
    return null;
  }
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

function LoginScreen({ onLogin }) {
  const [account, setAccount] = useState(demoAccounts[0]);
  const [password, setPassword] = useState(demoPassword);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const session = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: account.email, password })
      });
      onLogin(session);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="brand-mark"><HeartPulse size={30} /></div>
        <p className="eyebrow">CareSync Hub</p>
        <h1>Hospital workflows, appointments, and care records in one dashboard.</h1>
        <div className="login-metrics" aria-label="Demo coverage">
          <span><ShieldCheck size={17} /> Role-based access</span>
          <span><CalendarClock size={17} /> No double booking</span>
          <span><FileText size={17} /> CSV reports</span>
        </div>
      </section>

      <form className="login-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">Demo Login</p>
          <h2>Choose a workspace</h2>
          <p>Use the seeded demo users to review admin, receptionist, doctor, and patient flows.</p>
        </div>
        <div className="account-grid">
          {demoAccounts.map((item) => (
            <button
              type="button"
              className={account.role === item.role ? "account-tile active" : "account-tile"}
              key={item.role}
              onClick={() => setAccount(item)}
            >
              <span>{item.label}</span>
              <strong>{item.name}</strong>
            </button>
          ))}
        </div>
        <label>
          <span>Email</span>
          <input value={account.email} readOnly />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <Notice type="error">{message}</Notice>
        <button type="submit" disabled={loading}>
          <LogIn size={17} /> {loading ? "Signing in..." : "Enter Dashboard"}
        </button>
      </form>
    </main>
  );
}

function Toolbar({ session, onLogout }) {
  const role = session.user.role;
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">CareSync Hub</p>
        <h1>Hospital Appointment & Patient Management</h1>
      </div>
      <div className="session-card">
        <span>{role}</span>
        <strong>{session.user.name}</strong>
        <small>{session.user.email}</small>
        <button type="button" className="secondary-button compact-button" onClick={onLogout} title="Sign out">
          <LogOut size={16} /> Sign out
        </button>
      </div>
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

function Doctors({ role, session }) {
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
  const canCreateDoctor = role === "admin";
  const canSetAvailability = ["admin", "doctor"].includes(role);
  const availabilityDoctors = role === "doctor" && session?.user?.doctor_id
    ? doctors.filter((doctor) => doctor.id === session.user.doctor_id)
    : doctors;

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
        {canCreateDoctor && (
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
        {canSetAvailability && (
          <form className="panel form-panel" onSubmit={createAvailability}>
            <h2>Set Availability</h2>
            <select required value={slotForm.doctor_id} onChange={(event) => setSlotForm({ ...slotForm, doctor_id: event.target.value })}>
              <option value="">Select doctor</option>
              {availabilityDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
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
        {!canSetAvailability && <Empty message="Doctor profiles and availability are managed by admins and doctors." />}
      </div>
    </section>
  );
}

function Booking({ role, session }) {
  const [refresh, setRefresh] = useState(0);
  const doctors = useLoad(() => api("/api/doctors", { role }), [role, refresh]);
  const patients = useLoad(
    () => role === "patient" ? Promise.resolve([session.user]) : api("/api/users?role=patient", { role }),
    [role, refresh, session.user.id]
  );
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [bookingForm, setBookingForm] = useState(role === "patient" ? { ...emptyBooking, patient_id: session.user.id } : emptyBooking);
  const [message, setMessage] = useState("");
  const canRegisterPatient = ["admin", "receptionist"].includes(role);

  useEffect(() => {
    if (role === "patient") {
      setBookingForm((current) => ({ ...current, patient_id: session.user.id }));
    }
  }, [role, session.user.id]);

  async function registerPatient(event) {
    event.preventDefault();
    setMessage("");
    try {
      requiredValues(patientForm, { name: "Patient name", email: "Email", phone: "Phone" });
      await api("/api/users", {
        role,
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
      {canRegisterPatient ? (
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
            <TextField placeholder="Blood group" value={patientForm.blood_group} onChange={(blood_group) => setPatientForm({ ...patientForm, blood_group })} />
            <TextField placeholder="Address" value={patientForm.address} onChange={(address) => setPatientForm({ ...patientForm, address })} />
            <TextField placeholder="Emergency contact" value={patientForm.emergency_contact} onChange={(emergency_contact) => setPatientForm({ ...patientForm, emergency_contact })} />
            <TextField placeholder="Known allergies" value={patientForm.allergies} onChange={(allergies) => setPatientForm({ ...patientForm, allergies })} />
          </div>
          <button type="submit"><UserPlus size={17} /> Register Patient</button>
        </form>
      ) : (
        <article className="panel profile-panel">
          <Users size={24} />
          <h2>{session.user.name}</h2>
          <p>{session.user.email}</p>
          <div className="mini-grid">
            <span>Age <strong>{session.user.age || "N/A"}</strong></span>
            <span>Blood <strong>{session.user.blood_group || "N/A"}</strong></span>
            <span>Allergies <strong>{session.user.allergies || "None recorded"}</strong></span>
          </div>
        </article>
      )}

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
          <select required value={bookingForm.patient_id} disabled={role === "patient"} onChange={(event) => setBookingForm({ ...bookingForm, patient_id: event.target.value })}>
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

function AppointmentTable({ role, session, patientOnly = false, doctorMode = false }) {
  const [filters, setFilters] = useState({ search: "", status: "", date: "" });
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState("");
  const [selectedReschedule, setSelectedReschedule] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState(emptyReschedule);
  const scopedPatientId = patientOnly && role === "patient" ? session.user.id : "";
  const scopedDoctorId = doctorMode && role === "doctor" ? session.user.doctor_id : "";
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    if (scopedPatientId) params.set("patient_id", scopedPatientId);
    if (scopedDoctorId) params.set("doctor_id", scopedDoctorId);
    return params.toString();
  }, [filters, scopedPatientId, scopedDoctorId]);
  const { data, loading, error } = useLoad(() => api(`/api/appointments${query ? `?${query}` : ""}`, { role }), [role, query, refresh]);
  const rows = data || [];
  const options = nextStatusOptions(role, doctorMode ? "doctor" : "appointment");
  const canUpdateStatus = role !== "patient";
  const canReschedule = ["admin", "receptionist"].includes(role);

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

  function startReschedule(row) {
    setSelectedReschedule(row);
    setRescheduleForm({
      appointment_date: row.appointment_date,
      start_time: row.start_time,
      end_time: row.end_time
    });
  }

  async function reschedule(event) {
    event.preventDefault();
    if (!selectedReschedule) return;
    setMessage("");
    try {
      requiredValues(rescheduleForm, { appointment_date: "Date", start_time: "Start time", end_time: "End time" });
      await api(`/api/appointments/${selectedReschedule.id}/reschedule`, {
        role,
        method: "PUT",
        body: JSON.stringify(rescheduleForm)
      });
      setMessage("Appointment rescheduled.");
      setSelectedReschedule(null);
      setRescheduleForm(emptyReschedule);
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
                    <div className="row-actions">
                      {canUpdateStatus && (
                        <select value={row.status} onChange={(event) => setStatus(row.id, event.target.value)}>
                          {!options.includes(row.status) && <option value={row.status}>{row.status}</option>}
                          {options.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      )}
                      {canReschedule && !["Completed", "Cancelled"].includes(row.status) && (
                        <button type="button" className="secondary-button compact-button" onClick={() => startReschedule(row)}>
                          <RefreshCcw size={15} /> Reschedule
                        </button>
                      )}
                      {!canUpdateStatus && <span className="muted">View only</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedReschedule && (
        <form className="reschedule-panel" onSubmit={reschedule}>
          <div>
            <strong>Reschedule #{selectedReschedule.id}</strong>
            <span>{selectedReschedule.patient_name} with {selectedReschedule.doctor_name}</span>
          </div>
          <input required type="date" value={rescheduleForm.appointment_date} onChange={(event) => setRescheduleForm({ ...rescheduleForm, appointment_date: event.target.value })} />
          <input required type="time" value={rescheduleForm.start_time} onChange={(event) => setRescheduleForm({ ...rescheduleForm, start_time: event.target.value })} />
          <input required type="time" value={rescheduleForm.end_time} onChange={(event) => setRescheduleForm({ ...rescheduleForm, end_time: event.target.value })} />
          <button type="submit"><Save size={16} /> Save</button>
          <button type="button" className="secondary-button" onClick={() => setSelectedReschedule(null)}>Cancel</button>
        </form>
      )}
    </section>
  );
}

function ConsultationForm({ role, session }) {
  const [refresh, setRefresh] = useState(0);
  const canCreate = ["admin", "doctor"].includes(role);
  const scopedDoctorId = role === "doctor" ? session.user.doctor_id : "";
  const doctors = useLoad(() => api("/api/doctors", { role }), [role, refresh]);
  const patients = useLoad(() => api("/api/users?role=patient", { role }), [role, refresh]);
  const appointments = useLoad(() => {
    const params = new URLSearchParams();
    if (scopedDoctorId) params.set("doctor_id", scopedDoctorId);
    return api(`/api/appointments${params.toString() ? `?${params}` : ""}`, { role });
  }, [role, scopedDoctorId, refresh]);
  const [form, setForm] = useState({
    ...emptyConsultation,
    visit_date: today(),
    doctor_id: scopedDoctorId || ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (scopedDoctorId) setForm((current) => ({ ...current, doctor_id: scopedDoctorId }));
  }, [scopedDoctorId]);

  function useAppointment(appointmentId) {
    const appointment = (appointments.data || []).find((item) => String(item.id) === String(appointmentId));
    setForm((current) => ({
      ...current,
      appointment_id: appointmentId,
      patient_id: appointment?.patient_id || current.patient_id,
      doctor_id: appointment?.doctor_id || current.doctor_id
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      requiredValues(form, {
        patient_id: "Patient",
        doctor_id: "Doctor",
        visit_date: "Visit date",
        diagnosis: "Diagnosis"
      });
      const prescriptions = form.medicine && form.dosage ? [{
        medicine: form.medicine,
        dosage: form.dosage,
        instructions: form.instructions,
        duration_days: form.duration_days ? Number(form.duration_days) : null
      }] : [];
      await api("/api/medical-records", {
        role,
        method: "POST",
        body: JSON.stringify({ ...form, prescriptions })
      });
      setMessage("Consultation record saved and linked appointment marked completed.");
      setForm({ ...emptyConsultation, visit_date: today(), doctor_id: scopedDoctorId || "" });
      setRefresh((value) => value + 1);
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!canCreate) {
    return <Empty message="Consultation records are created by doctors and admins." />;
  }

  return (
    <form className="panel form-panel wide-form" onSubmit={submit}>
      <div className="section-head compact">
        <div>
          <h2>Consultation Record</h2>
          <p>Save diagnosis, treatment, and prescription details into the patient medical history.</p>
        </div>
      </div>
      <Notice>{message}</Notice>
      {(doctors.error || patients.error || appointments.error) && <Notice type="error">{doctors.error || patients.error || appointments.error}</Notice>}
      <div className="form-grid">
        <select value={form.appointment_id} onChange={(event) => useAppointment(event.target.value)}>
          <option value="">Link appointment</option>
          {(appointments.data || []).map((item) => (
            <option key={item.id} value={item.id}>
              #{item.id} {item.appointment_date} {item.start_time} - {item.patient_name}
            </option>
          ))}
        </select>
        <input required type="date" value={form.visit_date} onChange={(event) => setForm({ ...form, visit_date: event.target.value })} />
        <select required value={form.patient_id} onChange={(event) => setForm({ ...form, patient_id: event.target.value })}>
          <option value="">Select patient</option>
          {(patients.data || []).map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
        </select>
        <select required value={form.doctor_id} disabled={role === "doctor"} onChange={(event) => setForm({ ...form, doctor_id: event.target.value })}>
          <option value="">Select doctor</option>
          {(doctors.data || []).map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialization}</option>)}
        </select>
        <TextField required placeholder="Diagnosis" value={form.diagnosis} onChange={(diagnosis) => setForm({ ...form, diagnosis })} />
        <TextField placeholder="Symptoms" value={form.symptoms} onChange={(symptoms) => setForm({ ...form, symptoms })} />
        <TextField placeholder="Treatment plan" value={form.treatment} onChange={(treatment) => setForm({ ...form, treatment })} />
        <TextField placeholder="Medicine" value={form.medicine} onChange={(medicine) => setForm({ ...form, medicine })} />
        <TextField placeholder="Dosage" value={form.dosage} onChange={(dosage) => setForm({ ...form, dosage })} />
        <TextField placeholder="Instructions" value={form.instructions} onChange={(instructions) => setForm({ ...form, instructions })} />
        <TextField type="number" min="1" placeholder="Duration days" value={form.duration_days} onChange={(duration_days) => setForm({ ...form, duration_days })} />
      </div>
      <button type="submit"><Save size={17} /> Save Consultation</button>
    </form>
  );
}

function HistoryView({ role, session }) {
  const patients = useLoad(
    () => role === "patient" ? Promise.resolve([session.user]) : api("/api/users?role=patient", { role }),
    [role, session.user.id]
  );
  const [patientId, setPatientId] = useState(role === "patient" ? session.user.id : "");
  const history = useLoad(
    () => patientId ? api(`/api/patients/${patientId}/history`, { role }) : Promise.resolve(null),
    [role, patientId]
  );

  useEffect(() => {
    if (role === "patient") setPatientId(session.user.id);
  }, [role, session.user.id]);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Medical History</h2>
          <p>Patient visit records, diagnosis, treatment, and prescriptions.</p>
        </div>
      </div>
      {patients.error && <Notice type="error">{patients.error}</Notice>}
      <select value={patientId} disabled={role === "patient"} onChange={(event) => setPatientId(event.target.value)}>
        <option value="">Select patient</option>
        {(patients.data || []).map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </select>
      {!patientId && <Empty message="Choose a patient to view medical history." />}
      {history.loading && patientId && <Empty message="Loading patient history..." />}
      {history.error && <Notice type="error">{history.error}</Notice>}
      {history.data && (
        <div className="timeline">
          <div className="patient-summary">
            <span>Age <strong>{history.data.patient.age || "N/A"}</strong></span>
            <span>Blood <strong>{history.data.patient.blood_group || "N/A"}</strong></span>
            <span>Emergency <strong>{history.data.patient.emergency_contact || "N/A"}</strong></span>
            <span>Allergies <strong>{history.data.patient.allergies || "None recorded"}</strong></span>
          </div>
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
  const [session, setSession] = useState(readStoredSession);
  const role = session?.user?.role || "patient";
  const visibleTabs = useMemo(() => tabs.filter((tab) => tab.roles.includes(role)), [role]);
  const current = visibleTabs.find((tab) => tab.id === active) || visibleTabs[0];
  const ActiveIcon = current?.icon || ClipboardList;

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some((tab) => tab.id === active)) setActive(visibleTabs[0].id);
  }, [active, visibleTabs]);

  function login(nextSession) {
    localStorage.setItem("caresync-session", JSON.stringify(nextSession));
    setSession(nextSession);
    setActive("analytics");
  }

  function logout() {
    localStorage.removeItem("caresync-session");
    setSession(null);
    setActive("analytics");
  }

  if (!session) return <LoginScreen onLogin={login} />;

  return (
    <div className="app-shell">
      <Toolbar session={session} onLogout={logout} />
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
        {current?.id === "doctors" && <Doctors role={role} session={session} />}
        {current?.id === "booking" && <Booking role={role} session={session} />}
        {current?.id === "patient" && <AppointmentTable role={role} session={session} patientOnly />}
        {current?.id === "doctor" && (
          <div className="stack">
            <AppointmentTable role={role} session={session} doctorMode />
            <ConsultationForm role={role} session={session} />
          </div>
        )}
        {current?.id === "history" && <HistoryView role={role} session={session} />}
      </main>
    </div>
  );
}
