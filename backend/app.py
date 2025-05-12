from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import time
from models.city_graph import CityGraph
from algorithms.shortest_path import find_shortest_path
from algorithms.traffic_light_optimizer import optimize_traffic_lights
from algorithms.vehicle_router import suggest_routes
from simulation.traffic_simulator import TrafficSimulator

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize city graph and simulator
city_graph = CityGraph()
simulator = TrafficSimulator(city_graph)

@app.route('/api/city-map', methods=['GET'])
def get_city_map():
    """Return the current city map with nodes and edges"""
    return jsonify({
        'nodes': city_graph.get_nodes(),
        'edges': city_graph.get_edges(),
        'trafficLights': city_graph.get_traffic_lights()
    })

@app.route('/api/traffic-data', methods=['GET'])
def get_traffic_data():
    """Return current traffic data from simulation"""
    return jsonify({
        'vehiclePositions': simulator.get_vehicle_positions(),
        'trafficDensity': simulator.get_traffic_density(),
        'incidents': simulator.get_incidents()
    })

@app.route('/api/optimize-lights', methods=['POST'])
def optimize_lights():
    """Optimize traffic light timings based on current traffic"""
    traffic_data = simulator.get_traffic_density()
    new_timings = optimize_traffic_lights(city_graph, traffic_data)
    city_graph.update_traffic_light_timings(new_timings)
    return jsonify({'success': True, 'newTimings': new_timings})

@app.route('/api/route', methods=['POST'])
def calculate_route():
    """Calculate optimal route between two points"""
    data = request.json
    start_node = data.get('start')
    end_node = data.get('end')
    
    if not start_node or not end_node:
        return jsonify({'error': 'Start and end nodes are required'}), 400
    
    traffic_data = simulator.get_traffic_density()
    route = find_shortest_path(city_graph, start_node, end_node, traffic_data)
    
    return jsonify({'route': route})

@app.route('/api/reroute-vehicles', methods=['POST'])
def reroute_vehicles():
    """Reroute vehicles based on current traffic conditions"""
    vehicles = simulator.get_vehicle_positions()
    traffic_data = simulator.get_traffic_density()
    incidents = simulator.get_incidents()
    
    new_routes = suggest_routes(city_graph, vehicles, traffic_data, incidents)
    simulator.update_vehicle_routes(new_routes)
    
    return jsonify({'success': True, 'newRoutes': new_routes})

@app.route('/api/simulate', methods=['POST'])
def run_simulation():
    """Run simulation for a specified number of steps"""
    data = request.json
    steps = data.get('steps', 1)
    
    for _ in range(steps):
        simulator.step()
    
    return jsonify({'success': True})

@app.route('/api/reset-simulation', methods=['POST'])
def reset_simulation():
    """Reset the simulation to initial state"""
    simulator.reset()
    return jsonify({'success': True})

@app.route('/api/add-incident', methods=['POST'])
def add_incident():
    """Add a traffic incident at a specific location"""
    data = request.json
    location = data.get('location')
    incident_type = data.get('type', 'accident')
    duration = data.get('duration', 10)
    
    simulator.add_incident(location, incident_type, duration)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
