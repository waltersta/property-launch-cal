import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SchedulePage from '@/pages/SchedulePage'
import PickPage from '@/pages/PickPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SchedulePage />} />
        <Route path="/pick/:token" element={<PickPage />} />
      </Routes>
    </BrowserRouter>
  )
}
