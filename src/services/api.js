const API_BASE_URL = 'https://localhost:7190/api'; 
export const validatePlayer = async (studentNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-player?studentNumber=${studentNumber}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating player:', error);
    throw error;
  }
};

export const saveGameResult = async (gameData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving game result:', error);
    throw error;
  }
};