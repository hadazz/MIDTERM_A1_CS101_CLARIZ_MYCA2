import React, { useState, useEffect } from 'react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import SlotMachine from './components/SlotMachine';
import { validatePlayer } from './services/api';

function App() {
  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (number) => {
    if (!number.startsWith('C') || !/^C\d+$/.test(number)) {
      setError('Invalid student number format. Must start with "C" followed by numbers only.');
      return;
    }

    setLoading(true);
    try {
      const response = await validatePlayer(number);
      
      if (response.isValid) {
        setStudentNumber(number);
        setStudentName(response.studentName);
        setIsLoggedIn(true);
        setError('');
      } else {
        setError('Invalid student number or you cannot play at this time. Please try again later.');
      }
    } catch (error) {
      setError('Error validating student number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudentNumber('');
    setStudentName('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Slot Machine Game</h1>
      </header>
      <main>
        {!isLoggedIn ? (
          <LoginScreen 
            onLogin={handleLogin} 
            error={error} 
            loading={loading}
          />
        ) : (
          <SlotMachine 
            studentNumber={studentNumber}
            studentName={studentName}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}

export default App;