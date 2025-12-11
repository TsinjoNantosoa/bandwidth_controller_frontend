import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      // Redirect to dashboard after successful login
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <Lock size={40} />
            </div>
            <h1>BandwidthCtrl</h1>
            <p>Sign in to manage bandwidth rules</p>
          </div>

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">
                <User size={16} />
                <span>Username</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={16} />
                <span>Password</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading || !username || !password}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="demo-info">
              <strong>Demo credentials:</strong><br />
              Username: <code>admin</code> Password: <code>admin123</code><br />
              Username: <code>user</code> Password: <code>user123</code>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
        }

        .login-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-container {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, var(--blue) 0%, #1E90FF 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .login-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          color: var(--text-primary);
        }

        .login-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          color: var(--red);
          margin-bottom: 24px;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--blue) 0%, #1E90FF 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 144, 255, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .demo-info {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          padding: 12px;
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .demo-info strong {
          color: var(--text-primary);
        }

        .demo-info code {
          background: rgba(59, 130, 246, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--blue);
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
