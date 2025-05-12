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
  TimeScale,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import "chartjs-adapter-date-fns"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, TimeScale)

const Analytics = () => {
  const { trafficData, cityMap } = useContext(TrafficContext)

  const [historicalData, setHistoricalData] = useState({
    timestamps: [],
    averageTrafficDensity: [],
    movingVehicles: [],
    arrivedVehicles: [],
    activeIncidents: [],
  })

  const [trafficHotspots, setTrafficHotspots] = useState([])
  const [congestionTrend, setCongestionTrend] = useState("stable")
  const [timeRange, setTimeRange] = useState("1h")

  // Update historical data with current traffic data
  useEffect(() => {
    if (trafficData.vehiclePositions && trafficData.trafficDensity) {
      const timestamp = new Date()

      // Calculate current metrics
      const vehicles = Object.values(trafficData.vehiclePositions)
      const movingVehicles = vehicles.filter((v) => v.status === "moving").length
      const arrivedVehicles = vehicles.filter((v) => v.status === "arrived").length

      const densityValues = Object.values(trafficData.trafficDensity)
      const averageTrafficDensity =
        densityValues.length > 0 ? densityValues.reduce((sum, val) => sum + val, 0) / densityValues.length : 0

      const activeIncidents = trafficData.incidents ? trafficData.incidents.length : 0

      // Update historical data
      setHistoricalData((prev) => {
        // Keep only the last 60 data points (for 1 hour at 1 minute intervals)
        const maxDataPoints = 60

        const newTimestamps = [...prev.timestamps, timestamp]
        const newAverageTrafficDensity = [...prev.averageTrafficDensity, averageTrafficDensity]
        const newMovingVehicles = [...prev.movingVehicles, movingVehicles]
        const newArrivedVehicles = [...prev.arrivedVehicles, arrivedVehicles]
        const newActiveIncidents = [...prev.activeIncidents, activeIncidents]

        // Trim arrays if they exceed max length
        if (newTimestamps.length > maxDataPoints) {
          return {
            timestamps: newTimestamps.slice(-maxDataPoints),
            averageTrafficDensity: newAverageTrafficDensity.slice(-maxDataPoints),
            movingVehicles: newMovingVehicles.slice(-maxDataPoints),
            arrivedVehicles: newArrivedVehicles.slice(-maxDataPoints),
            activeIncidents: newActiveIncidents.slice(-maxDataPoints),
          }
        }

        return {
          timestamps: newTimestamps,
          averageTrafficDensity: newAverageTrafficDensity,
          movingVehicles: newMovingVehicles,
          arrivedVehicles: newArrivedVehicles,
          activeIncidents: newActiveIncidents,
        }
      })

      // Update traffic hotspots
      const hotspots = Object.entries(trafficData.trafficDensity)
        .filter(([_, density]) => density > 70)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([roadId, density]) => ({ roadId, density }))

      setTrafficHotspots(hotspots)

      // Determine congestion trend
      if (historicalData.averageTrafficDensity.length >= 10) {
        const recentAvg = historicalData.averageTrafficDensity.slice(-5).reduce((sum, val) => sum + val, 0) / 5
        const previousAvg = historicalData.averageTrafficDensity.slice(-10, -5).reduce((sum, val) => sum + val, 0) / 5

        if (recentAvg > previousAvg * 1.1) {
          setCongestionTrend("increasing")
        } else if (recentAvg < previousAvg * 0.9) {
          setCongestionTrend("decreasing")
        } else {
          setCongestionTrend("stable")
        }
      }
    }
  }, [trafficData])

  useEffect(() => {
    // Update dependencies array
  }, [historicalData.averageTrafficDensity, trafficData])

  // Filter data based on selected time range
  const getFilteredData = () => {
    let dataPoints

    switch (timeRange) {
      case "15m":
        dataPoints = 15
        break
      case "30m":
        dataPoints = 30
        break
      case "1h":
      default:
        dataPoints = 60
        break
    }

    return {
      timestamps: historicalData.timestamps.slice(-dataPoints),
      averageTrafficDensity: historicalData.averageTrafficDensity.slice(-dataPoints),
      movingVehicles: historicalData.movingVehicles.slice(-dataPoints),
      arrivedVehicles: historicalData.arrivedVehicles.slice(-dataPoints),
      activeIncidents: historicalData.activeIncidents.slice(-dataPoints),
    }
  }

  const filteredData = getFilteredData()

  // Prepare chart data
  const trafficDensityChartData = {
    labels: filteredData.timestamps,
    datasets: [
      {
        label: "Average Traffic Density (%)",
        data: filteredData.averageTrafficDensity,
        borderColor: "#FF4136",
        backgroundColor: "rgba(255, 65, 54, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const vehiclesChartData = {
    labels: filteredData.timestamps,
    datasets: [
      {
        label: "Moving Vehicles",
        data: filteredData.movingVehicles,
        borderColor: "#0074D9",
        backgroundColor: "rgba(0, 116, 217, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Arrived Vehicles",
        data: filteredData.arrivedVehicles,
        borderColor: "#2ECC40",
        backgroundColor: "rgba(46, 204, 64, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const incidentsChartData = {
    labels: filteredData.timestamps,
    datasets: [
      {
        label: "Active Incidents",
        data: filteredData.activeIncidents,
        borderColor: "#FF851B",
        backgroundColor: "rgba(255, 133, 27, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const hotspotChartData = {
    labels: trafficHotspots.map((h) => h.roadId),
    datasets: [
      {
        label: "Traffic Density (%)",
        data: trafficHotspots.map((h) => h.density),
        backgroundColor: trafficHotspots.map((h) =>
          h.density > 90 ? "#FF4136" : h.density > 80 ? "#FF851B" : "#FFDC00",
        ),
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
    },
  }

  const barChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
    },
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h1>Traffic Analytics</h1>

        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="15m">Last 15 minutes</option>
            <option value="30m">Last 30 minutes</option>
            <option value="1h">Last hour</option>
          </select>
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <h3>Current Traffic Status</h3>
          <div className="status-indicator">
            {historicalData.averageTrafficDensity.length > 0 && (
              <>
                <div
                  className={`indicator ${
                    historicalData.averageTrafficDensity[historicalData.averageTrafficDensity.length - 1] > 75
                      ? "critical"
                      : historicalData.averageTrafficDensity[historicalData.averageTrafficDensity.length - 1] > 50
                        ? "warning"
                        : "normal"
                  }`}
                ></div>
                <span>
                  {historicalData.averageTrafficDensity[historicalData.averageTrafficDensity.length - 1] > 75
                    ? "Heavy Traffic"
                    : historicalData.averageTrafficDensity[historicalData.averageTrafficDensity.length - 1] > 50
                      ? "Moderate Traffic"
                      : "Light Traffic"}
                </span>
              </>
            )}
          </div>
          <p>
            Congestion Trend: <span className={`trend-${congestionTrend}`}>{congestionTrend}</span>
          </p>
        </div>

        <div className="summary-card">
          <h3>Traffic Efficiency</h3>
          <p>Vehicles in Transit: {historicalData.movingVehicles[historicalData.movingVehicles.length - 1] || 0}</p>
          <p>Vehicles Arrived: {historicalData.arrivedVehicles[historicalData.arrivedVehicles.length - 1] || 0}</p>
          <p>Active Incidents: {historicalData.activeIncidents[historicalData.activeIncidents.length - 1] || 0}</p>
        </div>

        <div className="summary-card">
          <h3>System Performance</h3>
          <p>Traffic Lights: {Object.keys(cityMap.trafficLights || {}).length}</p>
          <p>Monitored Roads: {Object.keys(trafficData.trafficDensity || {}).length}</p>
          <p>Congestion Hotspots: {trafficHotspots.length}</p>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h3>Traffic Density Over Time</h3>
          <Line data={trafficDensityChartData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>Vehicle Status Over Time</h3>
          <Line data={vehiclesChartData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>Active Incidents Over Time</h3>
          <Line data={incidentsChartData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>Current Traffic Hotspots</h3>
          <Bar data={hotspotChartData} options={barChartOptions} />
        </div>
      </div>

      <div className="analytics-insights">
        <h2>Traffic Insights</h2>

        <div className="insights-content">
          {historicalData.averageTrafficDensity.length > 0 ? (
            <>
              <div className="insight-card">
                <h3>Congestion Analysis</h3>
                <p>
                  The average traffic density is currently{" "}
                  {historicalData.averageTrafficDensity[historicalData.averageTrafficDensity.length - 1].toFixed(1)}%,
                  which is{" "}
                  {congestionTrend === "increasing"
                    ? "higher than"
                    : congestionTrend === "decreasing"
                      ? "lower than"
                      : "consistent with"}{" "}
                  recent trends.
                </p>
                {trafficHotspots.length > 0 && (
                  <p>
                    The most congested area is {trafficHotspots[0].roadId} with {trafficHotspots[0].density.toFixed(1)}%
                    traffic density.
                  </p>
                )}
              </div>

              <div className="insight-card">
                <h3>Traffic Flow Efficiency</h3>
                <p>
                  {historicalData.arrivedVehicles[historicalData.arrivedVehicles.length - 1]} vehicles have reached
                  their destinations, while {historicalData.movingVehicles[historicalData.movingVehicles.length - 1]}{" "}
                  are still in transit.
                </p>
                {historicalData.activeIncidents[historicalData.activeIncidents.length - 1] > 0 ? (
                  <p>
                    There are currently {historicalData.activeIncidents[historicalData.activeIncidents.length - 1]}{" "}
                    active incidents affecting traffic flow.
                  </p>
                ) : (
                  <p>There are no active incidents affecting traffic flow.</p>
                )}
              </div>

              <div className="insight-card">
                <h3>Recommendations</h3>
                <ul>
                  {congestionTrend === "increasing" && (
                    <li>Traffic congestion is increasing. Consider optimizing traffic light timings.</li>
                  )}
                  {trafficHotspots.length > 3 && (
                    <li>Multiple congestion hotspots detected. Rerouting vehicles may improve traffic flow.</li>
                  )}
                  {historicalData.activeIncidents[historicalData.activeIncidents.length - 1] > 0 && (
                    <li>Active incidents are affecting traffic. Emergency response may be needed.</li>
                  )}
                  {congestionTrend === "stable" && trafficHotspots.length <= 3 && (
                    <li>Traffic flow is stable. Continue monitoring for changes.</li>
                  )}
                  {congestionTrend === "decreasing" && (
                    <li>Traffic congestion is decreasing. Current traffic management is effective.</li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <p>Collecting traffic data. Insights will be available soon.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
