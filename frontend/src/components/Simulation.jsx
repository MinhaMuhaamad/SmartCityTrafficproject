"use client"

import { useContext, useState } from "react"
import { TrafficContext } from "../context/TrafficContext"

const Simulation = () => {
  const {
    simulationRunning,
    simulationSpeed,
    setSimulationSpeed,
    toggleSimulation,
    runSimulation,
    resetSimulation,
    addIncident,
    cityMap,
  } = useContext(TrafficContext)

  const [manualSteps, setManualSteps] = useState(1)
  const [incidentLocation, setIncidentLocation] = useState("")
  const [incidentType, setIncidentType] = useState("accident")
  const [incidentDuration, setIncidentDuration] = useState(10)
  const [actionResult, setActionResult] = useState(null)

  // Handle manual simulation steps
  const handleRunManualSteps = async () => {
    const steps = Number.parseInt(manualSteps, 10)
    if (isNaN(steps) || steps < 1) return

    const result = await runSimulation(steps)
    if (result) {
      setActionResult({
        type: "simulation",
        message: `Successfully ran simulation for ${steps} step${steps > 1 ? "s" : ""}.`,
        timestamp: new Date().toLocaleTimeString(),
      })
    }
  }

  // Handle simulation reset
  const handleResetSimulation = async () => {
    const result = await resetSimulation()
    if (result) {
      setActionResult({
        type: "reset",
        message: "Simulation has been reset to initial state.",
        timestamp: new Date().toLocaleTimeString(),
      })
    }
  }

  // Handle adding incident
  const handleAddIncident = async () => {
    if (!incidentLocation) return

    const result = await addIncident(incidentLocation, incidentType, Number.parseInt(incidentDuration, 10))

    if (result) {
      setActionResult({
        type: "incident",
        message: `Added ${incidentType} incident at ${incidentLocation} for ${incidentDuration} steps.`,
        timestamp: new Date().toLocaleTimeString(),
      })
    }
  }

  return (
    <div className="simulation-control">
      <div className="simulation-header">
        <h1>Simulation Control</h1>
      </div>

      {actionResult && (
        <div className={`action-result ${actionResult.type}`}>
          <p>{actionResult.message}</p>
          <p className="timestamp">at {actionResult.timestamp}</p>
          <button onClick={() => setActionResult(null)}>Dismiss</button>
        </div>
      )}

      <div className="simulation-panels">
        <div className="simulation-panel">
          <h2>Continuous Simulation</h2>

          <div className="continuous-controls">
            <div className="simulation-status">
              <p>
                Status:{" "}
                <span className={simulationRunning ? "running" : "paused"}>
                  {simulationRunning ? "Running" : "Paused"}
                </span>
              </p>
            </div>

            <button className={`btn ${simulationRunning ? "btn-danger" : "btn-success"}`} onClick={toggleSimulation}>
              {simulationRunning ? "Pause Simulation" : "Start Simulation"}
            </button>

            <div className="speed-control">
              <label>Simulation Speed:</label>
              <div className="speed-slider">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number.parseFloat(e.target.value))}
                />
                <span>{simulationSpeed}s per step</span>
              </div>
            </div>
          </div>
        </div>

        <div className="simulation-panel">
          <h2>Manual Control</h2>

          <div className="manual-controls">
            <div className="steps-control">
              <label>Number of Steps:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={handleRunManualSteps}>
              Run Steps
            </button>

            <button className="btn btn-warning" onClick={handleResetSimulation}>
              Reset Simulation
            </button>
          </div>
        </div>

        <div className="simulation-panel">
          <h2>Add Traffic Incident</h2>

          <div className="incident-form">
            <div className="form-group">
              <label>Location:</label>
              <select value={incidentLocation} onChange={(e) => setIncidentLocation(e.target.value)}>
                <option value="">Select intersection</option>
                {cityMap.nodes &&
                  cityMap.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.id}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Incident Type:</label>
              <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                <option value="accident">Accident</option>
                <option value="construction">Construction</option>
                <option value="weather">Weather</option>
              </select>
            </div>

            <div className="form-group">
              <label>Duration (steps):</label>
              <input
                type="number"
                min="1"
                max="50"
                value={incidentDuration}
                onChange={(e) => setIncidentDuration(e.target.value)}
              />
            </div>

            <button className="btn btn-danger" onClick={handleAddIncident} disabled={!incidentLocation}>
              Add Incident
            </button>
          </div>
        </div>
      </div>

      <div className="simulation-info">
        <h2>Simulation Information</h2>

        <div className="info-content">
          <p>
            The simulation runs in discrete time steps. Each step represents a unit of time in the traffic system.
            During each step, the following actions occur:
          </p>

          <ul>
            <li>Traffic lights cycle between green and red states based on their timing settings</li>
            <li>Vehicles move along their routes, affected by traffic lights, traffic density, and incidents</li>
            <li>Traffic density is updated based on vehicle positions</li>
            <li>Incidents progress and may expire after their duration</li>
          </ul>

          <p>You can control the simulation in two ways:</p>

          <ol>
            <li>
              <strong>Continuous Mode:</strong> The simulation runs automatically at the specified speed
            </li>
            <li>
              <strong>Manual Mode:</strong> You control exactly how many steps to run at once
            </li>
          </ol>

          <p>
            To test the system's response to traffic incidents, you can add accidents, construction, or weather events
            at specific intersections. These will affect traffic flow and trigger rerouting algorithms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Simulation
