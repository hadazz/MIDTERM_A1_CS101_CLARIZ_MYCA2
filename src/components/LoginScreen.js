import React, { useState } from 'react';
import './LoginScreen.css';

function LoginScreen({ onLogin, error, loading }) {
  const [studentNumber, setStudentNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(studentNumber);
  };

  return (
    <div className="login-container">
      <h2>Student Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentNumber">Student Number:</label>
          <input
            type="text"
            id="studentNumber"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder="Enter your student number (e.g., C12345)"
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Validating...' : 'Play Game'}
        </button>
      </form>
    </div>
  );
}

export default LoginScreen;