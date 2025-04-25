import React, { useState, useEffect, useRef } from 'react';
import { saveGameResult } from '../services/api';
import './SlotMachine.css';

function SlotMachine({ studentNumber, studentName, onLogout }) {
  const [symbols, setSymbols] = useState(['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩']);
  const [reels, setReels] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [message, setMessage] = useState('');
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  const spinSound = useRef(null);
  const winSound = useRef(null);
  const audioContext = useRef(null);
  
  // Load audio files once on component mount
  useEffect(() => {
    // Create audio context for mobile devices
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    
    // Correct paths to sound files (using relative path from public directory)
    const spinSoundPath = '/sounds/spin.wav';
    const winSoundPath = '/sounds/win.wav';
    
    // Check if the sounds directory exists
    const checkSoundsDirectory = async () => {
      try {
        // Create audio elements
        spinSound.current = new Audio(spinSoundPath);
        winSound.current = new Audio(winSoundPath);
        
        // Set properties
        spinSound.current.preload = 'auto';
        winSound.current.preload = 'auto';
        
        // Add event listeners to check if sounds load correctly
        const loadSpinSound = new Promise((resolve, reject) => {
          spinSound.current.addEventListener('canplaythrough', resolve);
          spinSound.current.addEventListener('error', (e) => reject(`Spin sound error: ${e.message}`));
          // Trigger load explicitly
          spinSound.current.load();
        });

        const loadWinSound = new Promise((resolve, reject) => {
          winSound.current.addEventListener('canplaythrough', resolve);
          winSound.current.addEventListener('error', (e) => reject(`Win sound error: ${e.message}`));
          // Trigger load explicitly
          winSound.current.load();
        });

        // Set a timeout to prevent hanging if sounds don't load
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject('Sound loading timed out'), 5000);
        });

        await Promise.race([
          Promise.all([loadSpinSound, loadWinSound]),
          timeoutPromise
        ]);
        
        console.log('Sounds loaded successfully');
        setSoundsLoaded(true);
      } catch (error) {
        console.error('Error loading sound files:', error);
        // Handle missing sounds gracefully - create empty Audio objects to prevent errors
        if (!spinSound.current) spinSound.current = new Audio();
        if (!winSound.current) winSound.current = new Audio();
      }
    };

    checkSoundsDirectory();
    
    // Cleanup function
    return () => {
      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current.src = '';
        spinSound.current = null;
      }
      
      if (winSound.current) {
        winSound.current.pause();
        winSound.current.src = '';
        winSound.current = null;
      }
    };
  }, []);

  // Initialize audio (for browsers that require user interaction)
  const initializeAudio = () => {
    if (audioInitialized) return;
    
    // Resume audio context (important for iOS)
    if (audioContext.current && audioContext.current.state === 'suspended') {
      audioContext.current.resume().catch(err => {
        console.error("Error resuming audio context:", err);
      });
    }
    
    // Initialize both sounds with short plays
    const initSound = (soundRef) => {
      if (!soundRef.current) return Promise.reject("Sound not loaded");
      
      soundRef.current.volume = 0.01; // Nearly silent for initialization
      soundRef.current.currentTime = 0;
      
      const promise = soundRef.current.play();
      
      if (promise !== undefined) {
        return promise.then(() => {
          setTimeout(() => {
            soundRef.current.pause();
            soundRef.current.currentTime = 0;
            soundRef.current.volume = 1.0; // Reset volume
          }, 50);
        });
      } else {
        return Promise.reject("Play returned undefined");
      }
    };
    
    // Try to initialize both sounds
    Promise.all([
      initSound(spinSound).catch(e => console.warn("Init spin sound:", e)),
      initSound(winSound).catch(e => console.warn("Init win sound:", e))
    ]).then(() => {
      console.log("Audio successfully initialized");
      setAudioInitialized(true);
    }).catch(err => {
      console.error("Audio initialization error:", err);
    });
  };

  // Improved spin sound playback
  const playSpinSound = () => {
    if (!spinSound.current) {
      console.warn("Spin sound not available");
      return;
    }
    
    // Stop any existing playback
    spinSound.current.pause();
    spinSound.current.currentTime = 0;
    spinSound.current.volume = 1.0;
    spinSound.current.loop = true; // Make the spin sound loop during spinning
    
    // Play the sound with error handling
    const playPromise = spinSound.current.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Error playing spin sound:', error);
        
        // If it's a user interaction issue, try to initialize audio
        if (error.name === 'NotAllowedError') {
          console.log("Trying to initialize audio after NotAllowedError");
          initializeAudio();
        }
      });
    }
  };

  // Win sound playback
  const playWinSound = () => {
    if (!winSound.current) {
      console.warn("Win sound not available");
      return;
    }
    
    // Stop any existing playback
    winSound.current.pause();
    winSound.current.currentTime = 0;
    winSound.current.volume = 1.0;
    
    // Play the sound with error handling
    const playPromise = winSound.current.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Error playing win sound:', error);
        
        // If it's a user interaction issue, try to initialize audio
        if (error.name === 'NotAllowedError') {
          console.log("Trying to initialize audio after NotAllowedError");
          initializeAudio();
        }
      });
    }
  };

  // Generate matching or non-matching reels with true 50/50 probability
  const generateFinalReels = () => {
    // Use a fixed value to ensure exact 50/50 probability
    const winProbability = 0.5;
    const randomValue = Math.random();
    const shouldWin = randomValue < winProbability;
    
    console.log(`Win probability check: random=${randomValue}, threshold=${winProbability}, shouldWin=${shouldWin}`);
    
    if (shouldWin) {
      // Create winning combination (all same symbol)
      const randomSymbolIndex = Math.floor(Math.random() * symbols.length);
      return [randomSymbolIndex, randomSymbolIndex, randomSymbolIndex];
    } else {
      // Create losing combination (at least one different symbol)
      // First choose two positions that will match
      const matchingPosition = Math.floor(Math.random() * 3); // 0, 1, or 2
      const matchSymbolIndex = Math.floor(Math.random() * symbols.length);
      
      // Choose a different symbol for the remaining position
      let differentSymbolIndex;
      do {
        differentSymbolIndex = Math.floor(Math.random() * symbols.length);
      } while (differentSymbolIndex === matchSymbolIndex);
      
      // Create the reels array with different symbol at the chosen position
      const result = [matchSymbolIndex, matchSymbolIndex, matchSymbolIndex];
      result[matchingPosition] = differentSymbolIndex;
      
      return result;
    }
  };

  // Spin the reels with improved sound handling
  const spinReels = () => {
    if (spinning) return;
    
    // Always try to initialize audio on spin action
    initializeAudio();
    
    setSpinning(true);
    setGameResult(null);
    setMessage('');
    
    const spinDuration = 4000; 
    
    // Play spin sound immediately
    playSpinSound();
    
    // Animation interval
    const spinInterval = setInterval(() => {
      setReels([
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
      ]);
    }, 100);
    
    // End the spin after duration
    setTimeout(() => {
      clearInterval(spinInterval);
      
      // Make sure spin sound stops
      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
        spinSound.current.loop = false; // Turn off looping
      }
      
      // Generate 50/50 win/lose final reels
      const finalReels = generateFinalReels();
      
      setReels(finalReels);
      checkResult(finalReels);
      setSpinning(false);
    }, spinDuration);
  };
  
  const checkResult = async (finalReels) => {
    const isWin = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
    
    if (isWin) {
      setGameResult('win');
      setMessage('Congratulations! You won!');
      
      // Play win sound with a slight delay to ensure it's heard
      setTimeout(() => playWinSound(), 100);
      
      try {
        await saveGameResult({
          studentNumber,
          result: 'win',
          retryCount,
          datePlayed: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving game result:', error);
      }
    } else {
      setRetryCount(prev => prev + 1);
      setGameResult('lose');
      setMessage('Try again!');
    }
  };
  
  const handleQuit = async () => {
    if (retryCount > 0) {
      try {
        await saveGameResult({
          studentNumber,
          result: 'quit',
          retryCount,
          datePlayed: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving game result:', error);
      }
    }
    
    onLogout();
  };

  // Game Card
  return (
    <div className="slot-machine" onClick={initializeAudio}>
      <div className="welcome">
        <h2>Welcome, {studentName}!</h2>
        <p>Student Number: {studentNumber}</p>
      </div>
      
      <div className="reels-container">
        {reels.map((symbolIndex, index) => (
          <div key={index} className="reel">
            <div className="symbol">{symbols[symbolIndex]}</div>
          </div>
        ))}
      </div>
      
      <div className="game-controls">
        <button 
          onClick={spinReels} 
          disabled={spinning || gameResult === 'win'}
          className="spin-button"
        >
          {spinning ? 'Spinning...' : 'SPIN'}
        </button>
        
        <button onClick={handleQuit} className="quit-button">
          Quit Game
        </button>
      </div>
      
      {message && (
        <div className={`message ${gameResult === 'win' ? 'win' : 'lose'}`}>
          {message}
        </div>
      )}
      
      {gameResult === 'win' && (
        <div className="win-message">
          <p>Congratulations! You've won after {retryCount} retries!</p>
          <p>You can play again after 3 hours.</p>
        </div>
      )}
      
      <div className="retry-counter">
        Retries: {retryCount}
      </div>
      
      {!soundsLoaded && (
        <div className="warning-message">
          <p>Sound effects might not be available. Check that sound files exist in the public/sounds directory.</p>
        </div>
      )}
    </div>
  );
}

export default SlotMachine;