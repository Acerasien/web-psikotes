// client/src/Login.jsx
import { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post('http://127.0.0.1:8000/login', formData);
      onLogin(response.data.access_token);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input 
  type="text" 
  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
  value={username} 
  onChange={(e) => setUsername(e.target.value)} 
/>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
            <input 
  type="password" 
  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white mb-3 leading-tight focus:outline-none focus:shadow-outline"
  value={password} 
  onChange={(e) => setPassword(e.target.value)} 
/>
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;