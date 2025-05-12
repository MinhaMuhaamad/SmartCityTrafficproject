"use client"

import { useContext, useState, useEffect } from "react"
import { TrafficContext } from "../context/TrafficContext"
import { VEHICLE_TYPES } from "../config"

const VehicleRouting = () => {
  const { cityMap, trafficData, loading, error, calculateRoute, rerouteVehicles } = useContext(TrafficContext)

  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [routeResult, setRouteResult] = useState(null)
  const [startNode, setStartNode] = useState("")
  const [endNode, setEndNode] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [rerouteResult, setRerouteResult] = useState(null)

  // Initialize vehicles from traffic data
  useEffect(() => {
    if (trafficData.vehiclePositions) {
      const vehicleList = Object.entries(trafficData.vehiclePositions).map(([id, data]) => ({
        id,
        ...data,
      }))

      setVehicles(vehicleList)
    }
  }, [trafficData.vehiclePositions])

  // Filter vehicles based on status
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (filterStatus === "all") return true
    return vehicle.status === filterStatus
  })

  // Handle vehicle selection
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
    setStartNode(vehicle.current_position)
    setEndNode(vehicle.destination)
  }

  // Calculate route for selected vehicle
  const handleCalculateRoute = async () => {
    if (!startNode || !endNode) return

    const result = await calculateRoute(startNode, endNode)
    if (result) {
      setRouteResult(result)
    }
  }

  // Handle reroute all vehicles
  const handleRerouteAll = async () => {
    const result = await rerouteVehicles()
    if (result) {
      setRerouteResult({
        timestamp: new Date().toLocaleTimeString(),
        count: Object.keys(result.newRoutes).length,
      })
    }
  }

  if (loading) {
    return <div className="loading">Loading vehicle data...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="vehicle-routing">
      <div className="routing-header">
        <h1>Vehicle Routing</h1>
        <div className="routing-actions">
          <button className="btn btn-primary" onClick={handleRerouteAll}>
            Reroute All Vehicles
          </button>

          <div className="filter-controls">
            <label>Filter by Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Vehicles</option>
              <option value="moving">Moving</option>
              <option value="arrived">Arrived</option>
            </select>
          </div>
        </div>
      </div>

      {rerouteResult && (
        <div className="reroute-result">
          <p>
            Rerouting completed at {rerouteResult.timestamp}. Updated routes for {rerouteResult.count} vehicles.
          </p>
          <button onClick={() => setRerouteResult(null)}>Dismiss</button>
        </div>
      )}

      <div className="routing-content">
        <div className="vehicle-list">
          <h2>Vehicles ({filteredVehicles.length})</h2>

          <div className="vehicle-cards">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? "selected" : ""}`}
                onClick={() => handleSelectVehicle(vehicle)}
              >
                <div
                  className="vehicle-icon"
                  style={{ backgroundColor: VEHICLE_TYPES[vehicle.type]?.color || "#0074D9" }}
                ></div>

                <div className="vehicle-info">
                  <h3>Vehicle {vehicle.id.substring(0, 8)}...</h3>
                  <p>Type: {vehicle.type}</p>
                  <p>Status: {vehicle.status}</p>
                  <p>Current: {vehicle.current_position}</p>
                  <p>Destination: {vehicle.destination}</p>
                </div>
              </div>
            ))}

            {filteredVehicles.length === 0 && <p className="no-vehicles">No vehicles match the current filter.</p>}
          </div>
        </div>

        <div className="route-calculator">
          <h2>Route Calculator</h2>

          <div className="route-form">
            <div className="form-group">
              <label>Start Intersection:</label>
              <select value={startNode} onChange={(e) => setStartNode(e.target.value)}>
                <option value="">Select start point</option>
                {cityMap.nodes &&
                  cityMap.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.id}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Destination:</label>
              <select value={endNode} onChange={(e) => setEndNode(e.target.value)}>
                <option value="">Select destination</option>
                {cityMap.nodes &&
                  cityMap.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.id}
                    </option>
                  ))}
              </select>
            </div>

            <button className="btn btn-primary" onClick={handleCalculateRoute} disabled={!startNode || !endNode}>
              Calculate Route
            </button>
          </div>

          {routeResult && (
            <div className="route-result">
              <h3>Calculated Route</h3>

              {routeResult.path && routeResult.path.length > 0 ? (
                <>
                  <p>Route Length: {routeResult.length.toFixed(2)} units</p>
                  <p>Traffic Adjusted: {routeResult.traffic_adjusted ? "Yes" : "No"}</p>

                  <div className="route-path">
                    <h4>Path:</h4>
                    <ol>
                      {routeResult.path.map((node, index) => (
                        <li key={index}>{node}</li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : (
                <p className="error">No route found between the selected points.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VehicleRouting
