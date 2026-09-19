import { Link } from 'react-router-dom';
import { Panel } from '../components/UI';

export default function NotFound() {
  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <Panel raised>
        <span className="stamp">FILE NOT FOUND</span>
        <h1 style={{ marginTop: 'var(--s-3)' }}>الصفحة دي مش موجودة في أرشيف الشركة.</h1>
        <p className="hint">يمكن الرابط قديم أو فيه حرف ناقص.</p>
        <Link className="btn btn--primary" to="/">رجوع للاستقبال</Link>
      </Panel>
    </div>
  );
}
