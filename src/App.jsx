import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import LoginPage from './pages/LoginPage'
import MyTickets from './pages/Mytickets'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkin" element={<CheckIn />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
