// client/src/CreateUser.jsx
import { useState } from 'react';
import axios from 'axios';

function CreateUser({ token, onUserCreated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.post('http://127.0.0.1:8000/users/', 
        {
          username: username,
          password: password,
          role: 'participant' // Hardcoded for now
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage('Participant created successfully!');
      setUsername('');
      setPassword('');
      
      // Notify parent to refresh the list (we will add this next)
      if (onUserCreated) onUserCreated();

    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-bold mb-4">Add New Participant</h3>
      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required 
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="text" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required 
          />
        </div>
        <button 
          type="submit"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Add User
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
    </div>
  );
}

export default CreateUser;