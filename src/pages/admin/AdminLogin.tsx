import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { humanError, post } from '../../services/api';
import { useStore } from '../../components/store';
import { Panel } from '../../components/UI';

export default function AdminLogin() {
  const { signIn } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const d = await post<{ token: string; name: string; adminId: string }>('adminLogin', {
        username: username.trim(), secret,
      });
      signIn({ token: d.token, role: 'admin', name: d.name, adminId: d.adminId });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: 460 }}>
      <Panel raised>
        <div className="hazard-bar hazard-bar--thin" style={{ margin: '-24px -24px 16px' }} />
        <div className="label">RIPPLEIN LTD. · CONTROL CENTER</div>
        <h1 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>غرفة التحكم</h1>
        <p className="hint">الدخول لفريق التنظيم فقط.</p>

        <form onSubmit={submit}>
          <label className="field">
            <span className="label">اسم المستخدم</span>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
              autoComplete="username" required />
          </label>
          <label className="field">
            <span className="label">كلمة السر</span>
            <input className="input" type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password" required />
          </label>
          {error && <div className="note" role="alert" style={{ borderColor: 'var(--impact)' }}>{error}</div>}
          <button className="btn btn--ink btn--block" disabled={busy} style={{ marginTop: 12 }}>
            {busy ? 'جارٍ التحقق…' : 'دخول'}
          </button>
        </form>
      </Panel>
    </div>
  );
}
