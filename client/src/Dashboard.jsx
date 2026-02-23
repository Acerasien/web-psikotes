// client/src/Dashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ token, onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data using the token
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
        // If token is bad (expired), force logout
        onLogout(); 
      }
    };

    fetchUser();
  }, [token]);

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <h3>Welcome, {user.username}!</h3>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>ID:</strong> {user.id}</p>
      
      <hr />
      
      {/* Later we will add "Create Participant" here */}
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;