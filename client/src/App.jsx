import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Login and registration states
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('token')
  );

  // Dashboard navigation states
  const [activeSection, setActiveSection] = useState('');
  const [selectedReadingDate, setSelectedReadingDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // User form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Report states
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [previousMonthReport, setPreviousMonthReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  // Message states
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Reading states
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readingError, setReadingError] = useState('');
  const [readingDate, setReadingDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning fasting');
  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Handle login and registration
  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setError('');

    try {
      const endpoint = isLogin
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register';

      const requestBody = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        return;
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setIsLoggedIn(true);
        setPassword('');
      } else {
        setMessage('Account created successfully! You can now login.');

        setName('');
        setEmail('');
        setPassword('');
      }

    } catch (error) {
      setError('Unable to connect to the server.');
    }
  }

  // Fetch the user's glucose readings
  async function fetchReadings() {
    setLoading(true);
    setReadingError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/readings',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setReadingError(data.message || 'Unable to fetch readings');
        return;
      }

      setReadings(data);

    } catch (error) {
      setReadingError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch monthly reports
  async function fetchReports() {
    setReportLoading(true);
    setReportError('');

    try {
      const token = localStorage.getItem('token');

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [monthlyResponse, previousResponse] = await Promise.all([
        fetch(
          'http://localhost:5000/api/readings/reports/month-to-date',
          { headers }
        ),
        fetch(
          'http://localhost:5000/api/readings/reports/previous-month',
          { headers }
        )
      ]);

      const monthlyData = await monthlyResponse.json();
      const previousData = await previousResponse.json();

      if (!monthlyResponse.ok || !previousResponse.ok) {
        throw new Error(
          monthlyData.message ||
          previousData.message ||
          'Unable to fetch monthly reports'
        );
      }

      setMonthlyReport(monthlyData);
      setPreviousMonthReport(previousData);

    } catch (error) {
      setReportError(error.message || 'Unable to load reports');
    } finally {
      setReportLoading(false);
    }
  }

  // Add a new glucose reading
  async function handleAddReading(event) {
    event.preventDefault();

    setFormMessage('');
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/readings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            reading_date: readingDate,
            time_slot: timeSlot,
            glucose_level: Number(glucoseLevel)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || 'Unable to add reading');
        return;
      }

      setFormMessage('Reading added successfully!');

      setReadingDate('');
      setTimeSlot('Morning fasting');
      setGlucoseLevel('');

      await fetchReadings();
      await fetchReports();

    } catch (error) {
      setFormError('Unable to connect to the server.');
    }
  }

  // Update an existing glucose reading
  async function handleUpdateReading(event) {
    event.preventDefault();

    setFormMessage('');
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/readings/${editingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            reading_date: readingDate,
            time_slot: timeSlot,
            glucose_level: Number(glucoseLevel)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || 'Unable to update reading');
        return;
      }

      setFormMessage('Reading updated successfully!');

      setEditingId(null);
      setReadingDate('');
      setTimeSlot('Morning fasting');
      setGlucoseLevel('');

      await fetchReadings();
      await fetchReports();

    } catch (error) {
      setFormError('Unable to connect to the server.');
    }
  }

  // Delete a glucose reading
  async function handleDeleteReading(id) {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this reading?'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/readings/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || 'Unable to delete reading');
        return;
      }

      setFormMessage('Reading deleted successfully!');

      await fetchReadings();
      await fetchReports();

    } catch (error) {
      setFormError('Unable to connect to the server.');
    }
  }

  // Fill the form when editing a reading
  function startEditing(reading) {
    setEditingId(reading.id);

    setReadingDate(
      String(reading.reading_date).slice(0, 10)
    );

    setTimeSlot(reading.time_slot);
    setGlucoseLevel(String(reading.glucose_level));

    setFormMessage('');
    setFormError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Open a section from the dashboard
  function openSection(section) {
    setActiveSection(section);
    setSelectedReadingDate('');
    setSelectedMonth('');
    setFormMessage('');
    setFormError('');
    setEditingId(null);
  }

  // Return to the main dashboard
  function goBackToDashboard() {
    setActiveSection('');
    setSelectedReadingDate('');
    setSelectedMonth('');
    setEditingId(null);
    setFormMessage('');
    setFormError('');
  }

  // Fetch readings and monthly reports after login
  useEffect(() => {
    if (isLoggedIn) {
      fetchReadings();
      fetchReports();
    }
  }, [isLoggedIn]);

  // Group the readings by date
  const readingDates = [
    ...new Set(
      readings.map((reading) =>
        String(reading.reading_date).slice(0, 10)
      )
    )
  ].sort((a, b) => b.localeCompare(a));

  // Get readings for the selected daily report date
  const selectedDateReadings = readings.filter(
    (reading) =>
      String(reading.reading_date).slice(0, 10) === selectedReadingDate
  );

  // Calculate daily statistics
  const selectedDateStats = {
    count: selectedDateReadings.length,

    high: selectedDateReadings.length > 0
      ? Math.max(
          ...selectedDateReadings.map((reading) =>
            Number(reading.glucose_level)
          )
        )
      : null,

    low: selectedDateReadings.length > 0
      ? Math.min(
          ...selectedDateReadings.map((reading) =>
            Number(reading.glucose_level)
          )
        )
      : null,

    average: selectedDateReadings.length > 0
      ? (
          selectedDateReadings.reduce(
            (total, reading) =>
              total + Number(reading.glucose_level),
            0
          ) / selectedDateReadings.length
        ).toFixed(1)
      : null
  };

  // Dashboard screen
  if (isLoggedIn) {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
      <div className="dashboard-container">

        <header className="dashboard-header">
          <div>
            <h1>Sweety</h1>
            <p>Blood Glucose Tracker</p>
          </div>

          <div className="user-section">
            <span>Welcome, {user?.name}</span>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                setIsLoggedIn(false);
                setIsLogin(true);
                setReadings([]);
                setActiveSection('');
                setSelectedReadingDate('');
                setSelectedMonth('');
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">

          {/* MAIN DASHBOARD */}
          {activeSection === '' && (
            <>
              <h2>Your Dashboard</h2>

              <p>
                Track your blood glucose readings and monitor your daily progress.
              </p>

              <div className="dashboard-cards">

                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() => openSection('readings')}
                >
                  <h3>Blood Glucose Readings</h3>
                  <p>Record and manage your glucose levels.</p>
                  <span>View Readings →</span>
                </button>

                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() => openSection('daily')}
                >
                  <h3>Daily Reports</h3>
                  <p>View your daily glucose statistics.</p>
                  <span>View Daily Reports →</span>
                </button>

                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() => openSection('monthly')}
                >
                  <h3>Monthly Reports</h3>
                  <p>Monitor your monthly glucose trends.</p>
                  <span>View Monthly Reports →</span>
                </button>

              </div>
            </>
          )}
                    {/* BLOOD GLUCOSE READINGS SECTION */}
          {activeSection === 'readings' && (
            <section className="readings-section">

              <button
                type="button"
                className="back-button"
                onClick={goBackToDashboard}
              >
                ← Back to Dashboard
              </button>

              <h2>Blood Glucose Readings</h2>

              <p>View and manage your readings date by date.</p>

              <div className="add-reading-section">

                <h2>
                  {editingId
                    ? 'Update Blood Glucose Reading'
                    : 'Add Blood Glucose Reading'}
                </h2>

                <form
                  onSubmit={
                    editingId
                      ? handleUpdateReading
                      : handleAddReading
                  }
                >

                  <div className="form-group">
                    <label>Reading Date</label>

                    <input
                      type="date"
                      value={readingDate}
                      max={new Date().toLocaleDateString('en-CA')}
                      onChange={(event) =>
                        setReadingDate(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Time Slot</label>

                    <select
                      value={timeSlot}
                      onChange={(event) =>
                        setTimeSlot(event.target.value)
                      }
                      required
                    >
                      <option>Morning fasting</option>
                      <option>After breakfast</option>
                      <option>After lunch</option>
                      <option>After dinner</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Glucose Level (mg/dL)</label>

                    <input
                      type="number"
                      placeholder="Enter glucose level"
                      value={glucoseLevel}
                      onChange={(event) =>
                        setGlucoseLevel(event.target.value)
                      }
                      min="40"
                      max="600"
                      step="1"
                      required
                    />
                  </div>

                  <button type="submit">
                    {editingId ? 'Update Reading' : 'Add Reading'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setReadingDate('');
                        setTimeSlot('Morning fasting');
                        setGlucoseLevel('');
                        setFormMessage('');
                        setFormError('');
                      }}
                    >
                      Cancel
                    </button>
                  )}

                </form>

                {formMessage && (
                  <p className="success-message">{formMessage}</p>
                )}

                {formError && (
                  <p className="error-message">{formError}</p>
                )}

              </div>

              <h2>Saved Readings by Date</h2>

              {loading && <p>Loading readings...</p>}

              {readingError && (
                <p className="error-message">{readingError}</p>
              )}

              {!loading && !readingError && readings.length === 0 && (
                <p>No readings available. Add your first reading!</p>
              )}

              {!loading && readingDates.map((date) => (
                <div className="date-group" key={date}>

                  <h3>{date}</h3>

                  {readings
                    .filter(
                      (reading) =>
                        String(reading.reading_date).slice(0, 10) === date
                    )
                    .map((reading) => (
                      <div className="reading-item" key={reading.id}>

                        <div>
                          <h3>{reading.glucose_level} mg/dL</h3>
                          <p>{reading.time_slot}</p>
                        </div>

                        <div className="reading-actions">

                          <button
                            type="button"
                            onClick={() => startEditing(reading)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReading(reading.id)}
                          >
                            Delete
                          </button>

                        </div>

                      </div>
                    ))}

                </div>
              ))}

            </section>
          )}

          {/* DAILY REPORTS SECTION */}
          {activeSection === 'daily' && (
            <section className="reports-section">

              <button
                type="button"
                className="back-button"
                onClick={goBackToDashboard}
              >
                ← Back to Dashboard
              </button>

              <h2>Daily Glucose Reports</h2>

              {loading && <p>Loading readings...</p>}

              {readingError && (
                <p className="error-message">{readingError}</p>
              )}

              {!selectedReadingDate && (
                <>
                  <p>Select a date to view its glucose report.</p>

                  {readingDates.length === 0 && !loading && !readingError && (
                    <p>No dates with glucose readings are available yet.</p>
                  )}

                  {readingDates.map((date) => {
                    const dateReadings = readings.filter(
                      (reading) =>
                        String(reading.reading_date).slice(0, 10) === date
                    );

                    return (
                      <button
                        type="button"
                        className="report-card date-card"
                        key={date}
                        onClick={() => setSelectedReadingDate(date)}
                      >
                        <h3>{date}</h3>

                        <div className="date-reading-list">
                          {dateReadings.map((reading) => (
                            <div
                              className="date-reading-item"
                              key={reading.id}
                            >
                              <span>{reading.time_slot}</span>

                              <strong>
                                {reading.glucose_level} mg/dL
                              </strong>
                            </div>
                          ))}
                        </div>

                        <span>View Daily Report →</span>
                      </button>
                    );
                  })}
                </>
              )}

              {selectedReadingDate && (
                <div className="report-card">

                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setSelectedReadingDate('')}
                  >
                    ← Back to Dates
                  </button>

                  <h3>Daily Report: {selectedReadingDate}</h3>

                  {selectedDateStats.count === 0 ? (
                    <p className="empty-report-message">
                      No glucose readings recorded for this date.
                    </p>
                  ) : (
                    <>
                      <div className="report-stats">

                        <p>
                          Highest: {selectedDateStats.high} mg/dL
                        </p>

                        <p>
                          Lowest: {selectedDateStats.low} mg/dL
                        </p>

                        <p>
                          Average: {selectedDateStats.average} mg/dL
                        </p>

                        <p>
                          Total Readings: {selectedDateStats.count}
                        </p>

                      </div>

                      <h4>Individual Readings</h4>

                      {selectedDateReadings.map((reading) => (
                        <div
                          className="report-reading"
                          key={reading.id}
                        >
                          <span>{reading.time_slot}</span>

                          <strong>
                            {reading.glucose_level} mg/dL
                          </strong>
                        </div>
                      ))}

                    </>
                  )}

                </div>
              )}

            </section>
          )}
                    {/* MONTHLY REPORTS SECTION */}
          {activeSection === 'monthly' && (
            <section className="reports-section">

              <button
                type="button"
                className="back-button"
                onClick={goBackToDashboard}
              >
                ← Back to Dashboard
              </button>

              <h2>Monthly Glucose Reports</h2>

              {reportLoading && <p>Loading reports...</p>}

              {reportError && (
                <p className="error-message">{reportError}</p>
              )}

              {!selectedMonth && (
                <>
                  <p>
                    Select a month report to view your glucose statistics.
                  </p>

                  <button
                    type="button"
                    className="report-card date-card"
                    onClick={() => setSelectedMonth('current')}
                  >
                    <h3>Month-to-date Report</h3>

                    {monthlyReport && (
                      <>
                        <p>
                          {monthlyReport.start_date} to {monthlyReport.end_date}
                        </p>

                        <p>
                          Total Readings: {monthlyReport.summary.count}
                        </p>
                      </>
                    )}

                    <span>View Report →</span>
                  </button>

                  <button
                    type="button"
                    className="report-card date-card"
                    onClick={() => setSelectedMonth('previous')}
                  >
                    <h3>Previous Month Report</h3>

                    {previousMonthReport && (
                      <>
                        <p>
                          {previousMonthReport.start_date} to {previousMonthReport.end_date}
                        </p>

                        <p>
                          Total Readings: {previousMonthReport.summary.count}
                        </p>
                      </>
                    )}

                    <span>View Report →</span>
                  </button>
                </>
              )}

              {selectedMonth === 'current' && monthlyReport && (
                <div className="report-card">

                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setSelectedMonth('')}
                  >
                    ← Back to Monthly Reports
                  </button>

                  <h3>Month-to-date Report</h3>

                  <p>
                    Period: {monthlyReport.start_date} to {monthlyReport.end_date}
                  </p>

                  <div className="report-stats">

                    <p>
                      Highest: {monthlyReport.summary.high ?? '--'} mg/dL
                    </p>

                    <p>
                      Lowest: {monthlyReport.summary.low ?? '--'} mg/dL
                    </p>

                    <p>
                      Average: {monthlyReport.summary.average ?? '--'} mg/dL
                    </p>

                    <p>
                      Total Readings: {monthlyReport.summary.count}
                    </p>

                  </div>

                </div>
              )}

              {selectedMonth === 'previous' && previousMonthReport && (
                <div className="report-card">

                  <button
                    type="button"
                    className="back-button"
                    onClick={() => setSelectedMonth('')}
                  >
                    ← Back to Monthly Reports
                  </button>

                  <h3>Previous Month Report</h3>

                  <p>
                    Period: {previousMonthReport.start_date} to {previousMonthReport.end_date}
                  </p>

                  <div className="report-stats">

                    <p>
                      Highest: {previousMonthReport.summary.high ?? '--'} mg/dL
                    </p>

                    <p>
                      Lowest: {previousMonthReport.summary.low ?? '--'} mg/dL
                    </p>

                    <p>
                      Average: {previousMonthReport.summary.average ?? '--'} mg/dL
                    </p>

                    <p>
                      Total Readings: {previousMonthReport.summary.count}
                    </p>

                  </div>

                </div>
              )}

            </section>
          )}

        </main>
      </div>
    );
  }

  // Login and registration screen
  return (
    <div className="app-container">
      <div className="auth-card">

        <h1>Sweety</h1>

        <p className="subtitle">
          Your personal blood glucose tracker
        </p>

        <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>

        <p className="description">
          {isLogin
            ? 'Login to manage your glucose readings.'
            : 'Sign up to start tracking your glucose levels.'}
        </p>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength="8"
            />
          </div>

          <button type="submit" className="auth-button">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>

        </form>

        {message && (
          <p className="success-message">{message}</p>
        )}

        {error && (
          <p className="error-message">{error}</p>
        )}

        <p className="switch-text">
          {isLogin
            ? "Don't have an account?"
            : 'Already have an account?'}

          <button
            type="button"
            className="switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
              setError('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>

      </div>
    </div>
  );
}

export default App;