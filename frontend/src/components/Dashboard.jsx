"use client"

import { useContext, useState, useEffect } from "react"
import { TrafficContext } from "../context/TrafficContext"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js"
import { Bar, Pie } from "react-chartjs-2"
import { CarIcon, AlertTriangleIcon, ActivityIcon, TrafficConeIcon } from "lucide-react"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement)

const Dashboard = () => {
  const {
    trafficData,
    loading,
    error,
    optimizeTrafficLights,
    rerouteVehicles,
    simulationRunning,
    toggleSimulation,
  } = useContext(TrafficContext)

  const [stats, setStats] = useState({
    totalVehicles: 0,
    movingVehicles: 0,
    arrivedVehicles: 0,
    averageTrafficDensity: 0,
    activeIncidents: 0,
    congestionHotspots: [],
  })

  // Calculate dashboard statistics
  useEffect(() => {
    if (trafficData.vehiclePositions && trafficData.trafficDensity && trafficData.incidents) {
      // Count vehicles
      const vehicles = Object.values(trafficData.vehiclePositions)
      const totalVehicles = vehicles.length
      const movingVehicles = vehicles.filter((v) => v.status === "moving").length
      const arrivedVehicles = vehicles.filter((v) => v.status === "arrived").length

      // Calculate average traffic density
      const densityValues = Object.values(trafficData.trafficDensity)
      const averageTrafficDensity =
        densityValues.length > 0 ? densityValues.reduce((sum, val) => sum + val, 0) / densityValues.length : 0

      // Count active incidents
      const activeIncidents = trafficData.incidents.length

      // Find congestion hotspots (roads with density > 75)
      const congestionHotspots = Object.entries(trafficData.trafficDensity)
        .filter(([_, density]) => density > 75)
        .map(([roadId]) => roadId)
        .slice(0, 5) // Top 5 hotspots

      setStats({
        totalVehicles,
        movingVehicles,
        arrivedVehicles,
        averageTrafficDensity,
        activeIncidents,
        congestionHotspots,
      })
    }
  }, [trafficData])

  // Prepare chart data
  const trafficDensityData = {
    labels: ["0-25", "26-50", "51-75", "76-100"],
    datasets: [
      {
        label: "Road Segments by Traffic Density",
        data: [
          Object.values(trafficData.trafficDensity || {}).filter((d) => d <= 25).length,
          Object.values(trafficData.trafficDensity || {}).filter((d) => d > 25 && d <= 50).length,
          Object.values(trafficData.trafficDensity || {}).filter((d) => d > 50 && d <= 75).length,
          Object.values(trafficData.trafficDensity || {}).filter((d) => d > 75).length,
        ],
        backgroundColor: ["#2ECC40", "#FFDC00", "#FF851B", "#FF4136"],
      },
    ],
  }

  const vehicleStatusData = {
    labels: ["Moving", "Arrived"],
    datasets: [
      {
        label: "Vehicle Status",
        data: [stats.movingVehicles, stats.arrivedVehicles],
        backgroundColor: ["#0074D9", "#2ECC40"],
      },
    ],
  }

  const incidentTypeData = {
    labels: ["Accident", "Construction", "Weather"],
    datasets: [
      {
        label: "Incident Types",
        data: [
          trafficData.incidents?.filter((i) => i.type === "accident").length || 0,
          trafficData.incidents?.filter((i) => i.type === "construction").length || 0,
          trafficData.incidents?.filter((i) => i.type === "weather").length || 0,
        ],
        backgroundColor: ["#FF4136", "#FF851B", "#0074D9"],
      },
    ],
  }

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Smart City Traffic Management Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={toggleSimulation}>
            {simulationRunning ? "Pause Simulation" : "Start Simulation"}
          </button>
          <button className="btn btn-secondary" onClick={optimizeTrafficLights}>
            Optimize Traffic Lights
          </button>
          <button className="btn btn-secondary" onClick={rerouteVehicles}>
            Reroute Vehicles
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <CarIcon size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Vehicles</h3>
            <p className="stat-value">{stats.totalVehicles}</p>
            <p className="stat-detail">
              {stats.movingVehicles} moving, {stats.arrivedVehicles} arrived
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ActivityIcon size={24} />
          </div>
          <div className="stat-content">
            <h3>Average Traffic</h3>
            <p className="stat-value">{stats.averageTrafficDensity.toFixed(1)}%</p>
            <p className="stat-detail">Across all roads</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangleIcon size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Incidents</h3>
            <p className="stat-value">{stats.activeIncidents}</p>
            <p className="stat-detail">Affecting traffic flow</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrafficConeIcon size={24} />
          </div>
          <div className="stat-content">
            <h3>Congestion Hotspots</h3>
            <p className="stat-value">{stats.congestionHotspots.length}</p>
            <p className="stat-detail">Roads with heavy traffic</p>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Traffic Density Distribution</h3>
          <Bar
            data={trafficDensityData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: true,
                  text: "Road Segments by Traffic Density",
                },
              },
            }}
          />
        </div>

        <div className="chart-container">
          <h3>Vehicle Status</h3>
          <Pie
            data={vehicleStatusData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: true,
                  text: "Vehicle Status Distribution",
                },
              },
            }}
          />
        </div>

        <div className="chart-container">
          <h3>Incident Types</h3>
          <Pie
            data={incidentTypeData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: true,
                  text: "Current Incidents by Type",
                },
              },
            }}
          />
        </div>
      </div>

      <div className="dashboard-tables">
        <div className="table-container">
          <h3>Congestion Hotspots</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Road ID</th>
                <th>Traffic Density</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.congestionHotspots.map((roadId) => (
                <tr key={roadId}>
                  <td>{roadId}</td>
                  <td>{trafficData.trafficDensity[roadId].toFixed(1)}%</td>
                  <td>
                    <span className="status-badge status-critical">Critical</span>
                  </td>
                </tr>
              ))}
              {stats.congestionHotspots.length === 0 && (
                <tr>
                  <td colSpan="3">No congestion hotspots detected</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <h3>Active Incidents</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {trafficData.incidents &&
                trafficData.incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>{incident.location}</td>
                    <td>{incident.type}</td>
                    <td>{(incident.severity * 100).toFixed(0)}%</td>
                    <td>{incident.duration} steps</td>
                  </tr>
                ))}
              {(!trafficData.incidents || trafficData.incidents.length === 0) && (
                <tr>
                  <td colSpan="4">No active incidents</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
