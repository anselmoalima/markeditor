import 'markmd/styles';
import { MarkmdEditor } from 'markmd';

export default function App() {
  return (
    <main style={{ padding: '1rem' }}>
      <MarkmdEditor style={{ display: 'block', minHeight: '400px' }} />
    </main>
  );
}
