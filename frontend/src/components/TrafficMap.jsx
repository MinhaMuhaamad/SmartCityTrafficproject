"use client"

import { useContext, useRef, useEffect, useState } from "react"
import { TrafficContext } from "../context/TrafficContext"
import { MAP_CONFIG, TRAFFIC_LIGHT_COLORS, VEHICLE_TYPES, TRAFFIC_DENSITY_COLORS, INCIDENT_TYPES } from "../config"

const TrafficMap = () => {
  const { cityMap, trafficData, loading, error, addIncident } = useContext(TrafficContext)

  const canvasRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [mapOffset, setMapOffset] = useState({ x: 50, y: 50 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showTrafficDensity, setShowTrafficDensity] = useState(true)
  const [showVehicles, setShowVehicles] = useState(true)
  const [showTrafficLights, setShowTrafficLights] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)

  // Draw the city map on canvas
  useEffect(() => {
    if (loading || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Apply zoom and offset
    ctx.save()
    ctx.translate(mapOffset.x, mapOffset.y)
    ctx.scale(zoom, zoom)

    // Draw roads (edges)
    if (cityMap.edges && showTrafficDensity) {
      cityMap.edges.forEach((edge) => {
        const sourceNode = cityMap.nodes.find((n) => n.id === edge.source)
        const targetNode = cityMap.nodes.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
          // Get traffic density for this road
          const density = trafficData.trafficDensity[edge.id] || 0

          // Determine color based on traffic density
          let color = "#2ECC40" // Default green
          for (let i = TRAFFIC_DENSITY_COLORS.length - 1; i >= 0; i--) {
            if (density >= TRAFFIC_DENSITY_COLORS[i].threshold) {
              color = TRAFFIC_DENSITY_COLORS[i].color
              break
            }
          }

          // Draw road
          ctx.beginPath()
          ctx.moveTo(sourceNode.x, sourceNode.y)
          ctx.lineTo(targetNode.x, targetNode.y)
          ctx.strokeStyle = color
          ctx.lineWidth = MAP_CONFIG.roadWidth
          ctx.stroke()

          // Draw direction arrow
          const dx = targetNode.x - sourceNode.x
          const dy = targetNode.y - sourceNode.y
          const angle = Math.atan2(dy, dx)
          const midX = (sourceNode.x + targetNode.x) / 2
          const midY = (sourceNode.y + targetNode.y) / 2

          ctx.beginPath()
          ctx.moveTo(midX, midY)
          ctx.lineTo(midX - 10 * Math.cos(angle - Math.PI / 6), midY - 10 * Math.sin(angle - Math.PI / 6))
          ctx.lineTo(midX - 10 * Math.cos(angle + Math.PI / 6), midY - 10 * Math.sin(angle + Math.PI / 6))
          ctx.closePath()
          ctx.fillStyle = color
          ctx.fill()
        }
      })
    } else if (cityMap.edges) {
      // Draw roads without traffic density coloring
      cityMap.edges.forEach((edge) => {
        const sourceNode = cityMap.nodes.find((n) => n.id === edge.source)
        const targetNode = cityMap.nodes.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
          ctx.beginPath()
          ctx.moveTo(sourceNode.x, sourceNode.y)
          ctx.lineTo(targetNode.x, targetNode.y)
          ctx.strokeStyle = "#AAAAAA"
          ctx.lineWidth = MAP_CONFIG.roadWidth
          ctx.stroke()
        }
      })
    }

    // Draw intersections (nodes)
    if (cityMap.nodes) {
      cityMap.nodes.forEach((node) => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, MAP_CONFIG.nodeRadius, 0, 2 * Math.PI)

        // Highlight selected node
        if (selectedNode && selectedNode.id === node.id) {
          ctx.fillStyle = "#FF4136"
        } else {
          ctx.fillStyle = "#333333"
        }

        ctx.fill()

        // Draw traffic lights
        if (showTrafficLights && cityMap.trafficLights && cityMap.trafficLights[node.id]) {
          const light = cityMap.trafficLights[node.id]

          // Draw north-south traffic light
          const nsColor =
            light.north_south.current_state === "green" ? TRAFFIC_LIGHT_COLORS.green : TRAFFIC_LIGHT_COLORS.red

          ctx.beginPath()
          ctx.arc(node.x, node.y - 15, 5, 0, 2 * Math.PI)
          ctx.fillStyle = nsColor
          ctx.fill()

          // Draw east-west traffic light
          const ewColor =
            light.east_west.current_state === "green" ? TRAFFIC_LIGHT_COLORS.green : TRAFFIC_LIGHT_COLORS.red

          ctx.beginPath()
          ctx.arc(node.x + 15, node.y, 5, 0, 2 * Math.PI)
          ctx.fillStyle = ewColor
          ctx.fill()
        }
      })
    }

    // Draw vehicles
    if (showVehicles && trafficData.vehiclePositions) {
      Object.entries(trafficData.vehiclePositions).forEach(([id, vehicle]) => {
        const node = cityMap.nodes.find((n) => n.id === vehicle.current_position)

        if (node) {
          const vehicleType = VEHICLE_TYPES[vehicle.type] || VEHICLE_TYPES.car

          ctx.beginPath()
          ctx.arc(node.x, node.y, vehicleType.size, 0, 2 * Math.PI)
          ctx.fillStyle = vehicleType.color
          ctx.fill()
        }
      })
    }

    // Draw incidents
    if (showIncidents && trafficData.incidents) {
      trafficData.incidents.forEach((incident) => {
        const node = cityMap.nodes.find((n) => n.id === incident.location)

        if (node) {
          const incidentType = INCIDENT_TYPES[incident.type] || INCIDENT_TYPES.accident

          // Draw warning icon
          ctx.beginPath()
          ctx.moveTo(node.x, node.y - 20)
          ctx.lineTo(node.x + 15, node.y + 5)
          ctx.lineTo(node.x - 15, node.y + 5)
          ctx.closePath()
          ctx.fillStyle = incidentType.color
          ctx.fill()
          ctx.strokeStyle = "#FFFFFF"
          ctx.lineWidth = 2
          ctx.stroke()

          // Draw exclamation mark
          ctx.beginPath()
          ctx.moveTo(node.x, node.y - 10)
          ctx.lineTo(node.x, node.y - 2)
          ctx.strokeStyle = "#FFFFFF"
          ctx.lineWidth = 2
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(node.x, node.y + 1, 1, 0, 2 * Math.PI)
          ctx.fillStyle = "#FFFFFF"
          ctx.fill()
        }
      })
    }

    ctx.restore()
  }, [
    cityMap,
    trafficData,
    loading,
    mapOffset,
    zoom,
    selectedNode,
    showTrafficDensity,
    showVehicles,
    showTrafficLights,
    showIncidents,
  ])

  // Handle mouse events for panning and zooming
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      setMapOffset({
        x: mapOffset.x + dx,
        y: mapOffset.y + dy,
      })

      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(2, zoom * zoomFactor))

    setZoom(newZoom)
  }

  // Handle node selection
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - mapOffset.x) / zoom
    const y = (e.clientY - rect.top - mapOffset.y) / zoom

    // Find clicked node
    const clickedNode = cityMap.nodes.find((node) => {
      const dx = node.x - x
      const dy = node.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)

      return distance <= MAP_CONFIG.nodeRadius
    })

    setSelectedNode(clickedNode)
  }

  // Add incident at selected node
  const handleAddIncident = (type) => {
    if (selectedNode) {
      addIncident(selectedNode.id, type)
      setSelectedNode(null)
    }
  }

  if (loading) {
    return <div className="loading">Loading map data...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="traffic-map-container">
      <div className="map-controls">
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.min(2, zoom * 1.2))}>+</button>
          <button onClick={() => setZoom(Math.max(0.5, zoom / 1.2))}>-</button>
          <button
            onClick={() => {
              setZoom(1)
              setMapOffset({ x: 50, y: 50 })
            }}
          >
            Reset
          </button>
        </div>

        <div className="layer-controls">
          <label>
            <input
              type="checkbox"
              checked={showTrafficDensity}
              onChange={() => setShowTrafficDensity(!showTrafficDensity)}
            />
            Traffic Density
          </label>

          <label>
            <input type="checkbox" checked={showVehicles} onChange={() => setShowVehicles(!showVehicles)} />
            Vehicles
          </label>

          <label>
            <input
              type="checkbox"
              checked={showTrafficLights}
              onChange={() => setShowTrafficLights(!showTrafficLights)}
            />
            Traffic Lights
          </label>

          <label>
            <input type="checkbox" checked={showIncidents} onChange={() => setShowIncidents(!showIncidents)} />
            Incidents
          </label>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="traffic-map"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
      />

      {selectedNode && (
        <div className="node-info-panel">
          <h3>Intersection: {selectedNode.id}</h3>
          <p>
            Position: ({selectedNode.x}, {selectedNode.y})
          </p>

          {cityMap.trafficLights && cityMap.trafficLights[selectedNode.id] && (
            <div className="traffic-light-info">
              <h4>Traffic Light Status</h4>
              <p>North-South: {cityMap.trafficLights[selectedNode.id].north_south.current_state}</p>
              <p>East-West: {cityMap.trafficLights[selectedNode.id].east_west.current_state}</p>
            </div>
          )}

          <div className="incident-actions">
            <h4>Add Incident</h4>
            <button onClick={() => handleAddIncident("accident")}>Accident</button>
            <button onClick={() => handleAddIncident("construction")}>Construction</button>
            <button onClick={() => handleAddIncident("weather")}>Weather</button>
          </div>

          <button onClick={() => setSelectedNode(null)}>Close</button>
        </div>
      )}
    </div>
  )
}

export default TrafficMap
