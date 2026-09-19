import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { humanError, post } from '../services/api';
import { useStore } from '../components/store';
import { Panel } from '../components/UI';
import type { Session } from '../types';

export default function Login() {
  const { signIn, session } = useStore();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session?.role === 'participant') navigate('/dashboard', { replace: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await post<Session>('login', { employeeId: employeeId.trim(), pin: pin.trim() });
      signIn({ token: data.token, role: 'participant', name: data.name, employeeId: data.employeeId });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: 520 }}>
      <Panel raised>
        <div className="label">RIPPLEIN LTD. · EMPLOYEE ACCESS</div>
        <h1 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>دخول الموظفين</h1>
        <p className="hint">
          استخدم رقم الموظف والرقم السري اللي استلمتهم مع بطاقتك. مش معاك؟ كلّم فريق التنظيم.
        </p>

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span className="label">رقم الموظف</span>
            <input
              className="input serial"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="RPL-0264"
              autoComplete="username"
              inputMode="text"
              required
            />
          </label>

          <label className="field">
            <span className="label">الرقم السري</span>
            <input
              className="input"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoComplete="current-password"
              inputMode="numeric"
              required
            />
          </label>

          {error && <div className="note" role="alert" style={{ borderColor: 'var(--impact)' }}>{error}</div>}

          <button className="btn btn--primary btn--block" disabled={busy} style={{ marginTop: 'var(--s-3)' }}>
            {busy ? 'جارٍ التحقق…' : 'دخول الشركة'}
          </button>
        </form>

        <hr style={{ border: 0, borderTop: '1.5px solid var(--concrete-2)', margin: 'var(--s-5) 0' }} />
        <blockquote className="verse" style={{ fontSize: 'var(--t-base)' }}>
          لأَنَّ الَّذِي فِيكُمْ أَعْظَمُ مِنَ الَّذِي فِي الْعَالَمِ.
          <cite>١ يوحنا ٤: ٤</cite>
        </blockquote>
        <p className="hint" style={{ marginBottom: 0 }}>
          من فريق التنظيم؟ <Link to="/admin/login">دخول غرفة التحكم</Link>
        </p>
      </Panel>
    </div>
  );
}
