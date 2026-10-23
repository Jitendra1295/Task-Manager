import { useState } from 'react';
import { registerUser, loginUser } from '../api/auth';

function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);

    try {
      let res;
      if (mode === 'signup') {
        res = await registerUser({
          name: name.trim(),
          email: trimmedEmail,
          password,
        });
      } else {
        res = await loginUser({
          email: trimmedEmail,
          password,
        });
      }

      // Save token and user info
      localStorage.setItem('task_token', res.token);
      localStorage.setItem('task_user', JSON.stringify(res.user));

      onAuthSuccess(res.user);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => switchMode('login')}
        >
          Log In
        </button>
        <button
          type="button"
          className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => switchMode('signup')}
        >
          Sign Up
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}

        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label" htmlFor="auth-name">Name</label>
            <input
              id="auth-name"
              type="text"
              className="form-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={isLoading}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            className="form-input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary auth-submit-btn"
          disabled={isLoading}
        >
          {isLoading
            ? mode === 'signup'
              ? 'Creating account...'
              : 'Logging in...'
            : mode === 'signup'
            ? 'Create Account'
            : 'Log In'}
        </button>
      </form>
    </div>
  );
}

export default AuthForm;
