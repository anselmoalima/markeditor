import 'markeditor/styles';
import { MarkEditor } from 'markeditor';

export default function App() {
  return (
    <main style={{ padding: '1rem' }}>
      <MarkEditor style={{ display: 'block', minHeight: '400px' }} />
    </main>
  );
}
