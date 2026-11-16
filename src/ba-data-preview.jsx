import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import BaDataPreview from './components/BaDataPreview';

createRoot(document.getElementById('root')).render(<StrictMode><BaDataPreview /></StrictMode>);
