import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Archive from './pages/Archive'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/feed/:date" element={<Feed />} />
        <Route path="/archive" element={<Archive />} />
      </Routes>
    </BrowserRouter>
  )
}
