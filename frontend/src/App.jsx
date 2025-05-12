import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Dashboard from "./components/Dashboard"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import TrafficMap from "./components/TrafficMap"
import TrafficLightControl from "./components/TrafficLightControl"
import VehicleRouting from "./components/VehicleRouting"
import Simulation from "./components/Simulation"
import Analytics from "./components/Analytics"
import { TrafficProvider } from "./context/TrafficContext"
import "./App.css"

function App() {
  return (
    <TrafficProvider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <div className="content-container">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<TrafficMap />} />
                <Route path="/traffic-lights" element={<TrafficLightControl />} />
                <Route path="/routing" element={<VehicleRouting />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </TrafficProvider>
  )
}

export default App
