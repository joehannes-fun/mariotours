import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

interface PasswordModalProps {
  onAuthenticate: (isAuthenticated: boolean) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onAuthenticate }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onAuthenticate(true);
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center">
          <FormattedMessage id="admin.title" />
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FormattedMessage id="admin.passwordPrompt" />
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition duration-300"
          >
            <FormattedMessage id="admin.login" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;