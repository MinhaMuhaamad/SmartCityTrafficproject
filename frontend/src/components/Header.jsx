"use client"

import { useContext } from "react"
import { TrafficContext } from "../context/TrafficContext"
import { useLocation } from "react-router-dom"

const Header = () => {
  const { simulationRunning, toggleSimulation } = useContext(TrafficContext)
  const location = useLocation()

  // Get current page title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Dashboard"
      case "/map":
        return "Traffic Map"
      case "/traffic-lights":
        return "Traffic Light Control"
      case "/routing":
        return "Vehicle Routing"
      case "/simulation":
        return "Simulation Control"
      case "/analytics":
        return "Traffic Analytics"
      default:
        return "Smart City Traffic Management"
    }
  }

  return (
    <header className="app-header">
      <div className="header-title">
        <h1>{getPageTitle()}</h1>
      </div>

      <div className="header-controls">
        <div className="simulation-status">
          <span className={`status-indicator ${simulationRunning ? "active" : "inactive"}`}></span>
          <span className="status-text">Simulation: {simulationRunning ? "Running" : "Paused"}</span>
        </div>

        <button className={`simulation-toggle ${simulationRunning ? "running" : "paused"}`} onClick={toggleSimulation}>
          {simulationRunning ? "Pause" : "Start"}
        </button>
      </div>
    </header>
  )
}

export default Header
