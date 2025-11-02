import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n/index.js';
import { AppProviders } from './context/index.jsx';
import { ThemeProvider } from './context/ThemeProvider.jsx';

var root = document.getElementById('root');

createRoot(root).render(
	<ThemeProvider>
		<AppProviders>
			<App />
		</AppProviders>
	</ThemeProvider>,
)
