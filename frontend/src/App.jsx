import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SchedulePage from '@/pages/SchedulePage'
import PickPage from '@/pages/PickPage'
import NewListingPage from '@/pages/NewListingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SchedulePage />} />
        <Route path="/admin/new-listing" element={<NewListingPage />} />
        <Route path="/pick/:token" element={<PickPage />} />
      </Routes>
    </BrowserRouter>
  )
}
