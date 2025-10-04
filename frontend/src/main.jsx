import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n/index.js';
import { AppProviders } from './context/index.jsx';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<AppProviders>
			<App />
		</AppProviders>
	</StrictMode>,
)
