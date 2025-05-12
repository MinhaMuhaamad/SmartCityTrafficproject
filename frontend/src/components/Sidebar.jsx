import { NavLink } from "react-router-dom"
import { LayoutDashboard, Map, StopCircle, Car, PlayCircle, BarChart2 } from "lucide-react"

const Sidebar = () => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h2>Smart City</h2>
        <p>Traffic Management</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")}>
          <Map size={20} />
          <span>Traffic Map</span>
        </NavLink>

        <NavLink to="/traffic-lights" className={({ isActive }) => (isActive ? "active" : "")}>
          <StopCircle size={20} />
          <span>Traffic Lights</span>
        </NavLink>

        <NavLink to="/routing" className={({ isActive }) => (isActive ? "active" : "")}>
          <Car size={20} />
          <span>Vehicle Routing</span>
        </NavLink>

        <NavLink to="/simulation" className={({ isActive }) => (isActive ? "active" : "")}>
          <PlayCircle size={20} />
          <span>Simulation</span>
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : "")}>
          <BarChart2 size={20} />
          <span>Analytics</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <p>© 2025 Smart City</p>
      </div>
    </aside>
  )
}

export default Sidebar
