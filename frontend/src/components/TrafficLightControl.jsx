"use client"

import { useContext, useState, useEffect } from "react"
import { TrafficContext } from "../context/TrafficContext"
import { TRAFFIC_LIGHT_COLORS } from "../config"

const TrafficLightControl = () => {
  const { cityMap, loading, error, optimizeTrafficLights } = useContext(TrafficContext)

  const [trafficLights, setTrafficLights] = useState({})
  const [selectedLight, setSelectedLight] = useState(null)
  const [editedTimings, setEditedTimings] = useState({
    north_south: 30,
    east_west: 30,
  })
  const [filterText, setFilterText] = useState("")
  const [optimizationResult, setOptimizationResult] = useState(null)

  // Initialize traffic lights from city map
  useEffect(() => {
    if (cityMap.trafficLights) {
      setTrafficLights(cityMap.trafficLights)
    }
  }, [cityMap.trafficLights])

  // Filter traffic lights based on search text
  const filteredLights = Object.entries(trafficLights).filter(([id]) => {
    return id.toLowerCase().includes(filterText.toLowerCase())
  })

  // Handle traffic light selection
  const handleSelectLight = (id) => {
    setSelectedLight(id)
    setEditedTimings({
      north_south: trafficLights[id].north_south.green_time,
      east_west: trafficLights[id].east_west.green_time,
    })
  }

  // Handle timing changes
  const handleTimingChange = (direction, value) => {
    setEditedTimings({
      ...editedTimings,
      [direction]: Number.parseInt(value, 10),
    })
  }

  // Save edited timings
  const handleSaveTimings = () => {
    if (!selectedLight) return

    const updatedLights = {
      ...trafficLights,
      [selectedLight]: {
        ...trafficLights[selectedLight],
        north_south: {
          ...trafficLights[selectedLight].north_south,
          green_time: editedTimings.north_south,
        },
        east_west: {
          ...trafficLights[selectedLight].east_west,
          green_time: editedTimings.east_west,
        },
      },
    }

    setTrafficLights(updatedLights)
    setSelectedLight(null)
  }

  // Handle optimization
  const handleOptimize = async () => {
    const result = await optimizeTrafficLights()
    if (result) {
      setOptimizationResult({
        timestamp: new Date().toLocaleTimeString(),
        changes: Object.keys(result.newTimings).length,
      })

      // Update local state with new timings
      setTrafficLights((prevLights) => {
        const updatedLights = { ...prevLights }

        Object.entries(result.newTimings).forEach(([id, timing]) => {
          if (updatedLights[id]) {
            updatedLights[id] = {
              ...updatedLights[id],
              north_south: {
                ...updatedLights[id].north_south,
                green_time: timing.north_south,
              },
              east_west: {
                ...updatedLights[id].east_west,
                green_time: timing.east_west,
              },
            }
          }
        })

        return updatedLights
      })
    }
  }

  if (loading) {
    return <div className="loading">Loading traffic light data...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="traffic-light-control">
      <div className="control-header">
        <h1>Traffic Light Control</h1>
        <div className="control-actions">
          <button className="btn btn-primary" onClick={handleOptimize}>
            Optimize All Traffic Lights
          </button>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search intersections..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {optimizationResult && (
        <div className="optimization-result">
          <p>
            Optimization completed at {optimizationResult.timestamp}. Updated {optimizationResult.changes} traffic
            lights.
          </p>
          <button onClick={() => setOptimizationResult(null)}>Dismiss</button>
        </div>
      )}

      <div className="traffic-light-grid">
        {filteredLights.map(([id, light]) => (
          <div
            key={id}
            className={`traffic-light-card ${selectedLight === id ? "selected" : ""}`}
            onClick={() => handleSelectLight(id)}
          >
            <h3>{id}</h3>

            <div className="light-status">
              <div className="light-direction">
                <span>North-South:</span>
                <div
                  className="light-indicator"
                  style={{
                    backgroundColor:
                      light.north_south.current_state === "green"
                        ? TRAFFIC_LIGHT_COLORS.green
                        : TRAFFIC_LIGHT_COLORS.red,
                  }}
                ></div>
              </div>

              <div className="light-timing">
                <span>Green Time: {light.north_south.green_time}s</span>
                <span>Time in State: {light.north_south.time_in_state}s</span>
              </div>
            </div>

            <div className="light-status">
              <div className="light-direction">
                <span>East-West:</span>
                <div
                  className="light-indicator"
                  style={{
                    backgroundColor:
                      light.east_west.current_state === "green" ? TRAFFIC_LIGHT_COLORS.green : TRAFFIC_LIGHT_COLORS.red,
                  }}
                ></div>
              </div>

              <div className="light-timing">
                <span>Green Time: {light.east_west.green_time}s</span>
                <span>Time in State: {light.east_west.time_in_state}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedLight && (
        <div className="edit-panel">
          <h2>Edit Traffic Light: {selectedLight}</h2>

          <div className="timing-controls">
            <div className="timing-group">
              <label>North-South Green Time (seconds):</label>
              <input
                type="range"
                min="15"
                max="60"
                value={editedTimings.north_south}
                onChange={(e) => handleTimingChange("north_south", e.target.value)}
              />
              <span>{editedTimings.north_south}s</span>
            </div>

            <div className="timing-group">
              <label>East-West Green Time (seconds):</label>
              <input
                type="range"
                min="15"
                max="60"
                value={editedTimings.east_west}
                onChange={(e) => handleTimingChange("east_west", e.target.value)}
              />
              <span>{editedTimings.east_west}s</span>
            </div>
          </div>

          <div className="edit-actions">
            <button className="btn btn-primary" onClick={handleSaveTimings}>
              Save Changes
            </button>

            <button className="btn btn-secondary" onClick={() => setSelectedLight(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrafficLightControl
