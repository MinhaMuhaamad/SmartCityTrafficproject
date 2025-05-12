import random
import time
import uuid

class TrafficSimulator:
    """
    Simulates traffic flow in the city, including vehicles, traffic density,
    and incidents.
    """
    def __init__(self, city_graph, num_vehicles=50):
        self.city_graph = city_graph
        self.vehicles = {}
        self.incidents = []
        self.traffic_density = {}
        self.time_step = 0
        
        # Initialize vehicles
        self._initialize_vehicles(num_vehicles)
        
        # Initialize traffic density
        self._initialize_traffic_density()
    
    def _initialize_vehicles(self, num_vehicles):
        """Initialize random vehicles in the city"""
        nodes = list(self.city_graph.graph.nodes())
        
        for _ in range(num_vehicles):
            vehicle_id = str(uuid.uuid4())
            
            # Random start and end positions
            start_node = random.choice(nodes)
            end_node = random.choice([n for n in nodes if n != start_node])
            
            # Find initial route
            route = self._find_initial_route(start_node, end_node)
            
            self.vehicles[vehicle_id] = {
                'current_position': start_node,
                'destination': end_node,
                'route': route,
                'progress': 0,
                'speed': random.uniform(0.5, 1.0),  # Speed factor
                'type': random.choice(['car', 'bus', 'truck']),
                'status': 'moving'
            }
    
    def _find_initial_route(self, start_node, end_node):
        """Find initial route for a vehicle"""
        try:
            path = []
            # Simple BFS for initial route
            visited = {start_node}
            queue = [(start_node, [start_node])]
            
            while queue:
                (node, path) = queue.pop(0)
                
                if node == end_node:
                    return path
                
                for neighbor in self.city_graph.graph.neighbors(node):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, path + [neighbor]))
            
            return []  # No path found
        except Exception as e:
            print(f"Error finding initial route: {e}")
            return []
    
    def _initialize_traffic_density(self):
        """Initialize traffic density on all roads"""
        for source, target, data in self.city_graph.graph.edges(data=True):
            road_id = data['road_id']
            # Random initial traffic density (0-50)
            self.traffic_density[road_id] = random.randint(0, 50)
    
    def step(self):
        """Advance simulation by one time step"""
        self.time_step += 1
        
        # Update traffic lights
        self.city_graph.step_traffic_lights()
        
        # Move vehicles
        self._move_vehicles()
        
        # Update traffic density
        self._update_traffic_density()
        
        # Update incidents (reduce duration, remove expired)
        self._update_incidents()
        
        # Randomly add new incidents (small probability)
        if random.random() < 0.05:  # 5% chance per step
            self._add_random_incident()
    
    def _move_vehicles(self):
        """Move all vehicles along their routes"""
        for vehicle_id, vehicle in self.vehicles.items():
            if vehicle['status'] == 'arrived':
                continue
                
            route = vehicle.get('route', [])
            progress = vehicle.get('progress', 0)
            speed = vehicle.get('speed', 1.0)
            
            if not route or len(route) < 2:
                # No valid route, try to find a new one
                if vehicle['current_position'] != vehicle['destination']:
                    new_route = self._find_initial_route(vehicle['current_position'], vehicle['destination'])
                    vehicle['route'] = new_route
                    vehicle['progress'] = 0
                continue
            
            # Calculate current road segment
            current_idx = int(progress)
            if current_idx >= len(route) - 1:
                # Vehicle has arrived at destination
                vehicle['current_position'] = vehicle['destination']
                vehicle['status'] = 'arrived'
                continue
            
            current_node = route[current_idx]
            next_node = route[current_idx + 1]
            
            # Check if the next intersection has a red light
            if next_node in self.city_graph.traffic_lights:
                # Determine direction (north-south or east-west)
                current_parts = current_node.split('_')
                next_parts = next_node.split('_')
                
                if len(current_parts) >= 3 and len(next_parts) >= 3:
                    current_i, current_j = int(current_parts[1]), int(current_parts[2])
                    next_i, next_j = int(next_parts[1]), int(next_parts[2])
                    
                    direction = "north_south" if current_i == next_i else "east_west"
                    
                    # Check if light is red for this direction
                    if self.city_graph.traffic_lights[next_node][direction]['current_state'] == 'red':
                        # Slow down vehicle approaching red light
                        speed *= 0.2
            
            # Check for incidents on the current road
            road_id = None
            for s, t, data in self.city_graph.graph.edges(data=True):
                if s == current_node and t == next_node:
                    road_id = data['road_id']
                    break
            
            if road_id:
                for incident in self.incidents:
                    if incident['road_id'] == road_id:
                        # Slow down vehicle on road with incident
                        speed *= (1 - incident['severity'])
            
            # Check traffic density on current road
            if road_id and road_id in self.traffic_density:
                density = self.traffic_density[road_id]
                # Slow down based on traffic density (0-100)
                speed *= max(0.1, 1 - (density / 100))
            
            # Update vehicle progress
            vehicle['progress'] += speed
            
            # Update current position if moved to next node
            if int(vehicle['progress']) > current_idx:
                vehicle['current_position'] = route[int(vehicle['progress'])]
    
    def _update_traffic_density(self):
        """Update traffic density based on vehicle positions"""
        # Decay current traffic density (traffic dissipates over time)
        for road_id in self.traffic_density:
            self.traffic_density[road_id] = max(0, self.traffic_density[road_id] * 0.95)
        
        # Count vehicles on each road segment
        road_counts = {}
        
        for vehicle in self.vehicles.values():
            if vehicle['status'] == 'arrived':
                continue
                
            route = vehicle.get('route', [])
            progress = vehicle.get('progress', 0)
            
            if not route or len(route) < 2:
                continue
            
            current_idx = int(progress)
            if current_idx >= len(route) - 1:
                continue
            
            current_node = route[current_idx]
            next_node = route[current_idx + 1]
            
            # Find the road ID for this segment
            for s, t, data in self.city_graph.graph.edges(data=True):
                if s == current_node and t == next_node:
                    road_id = data['road_id']
                    if road_id not in road_counts:
                        road_counts[road_id] = 0
                    road_counts[road_id] += 1
                    break
        
        # Update traffic density based on vehicle counts
        for road_id, count in road_counts.items():
            # Convert count to density (0-100)
            # Assuming capacity is around 20 vehicles per road
            density_increase = min(100, count * 5)
            
            if road_id in self.traffic_density:
                self.traffic_density[road_id] = min(100, self.traffic_density[road_id] + density_increase)
            else:
                self.traffic_density[road_id] = density_increase
    
    def _update_incidents(self):
        """Update and remove expired incidents"""
        updated_incidents = []
        
        for incident in self.incidents:
            incident['duration'] -= 1
            
            if incident['duration'] > 0:
                updated_incidents.append(incident)
        
        self.incidents = updated_incidents
    
    def _add_random_incident(self):
        """Add a random traffic incident"""
        # Choose a random road
        edges = list(self.city_graph.graph.edges(data=True))
        if not edges:
            return
            
        source, target, data = random.choice(edges)
        road_id = data['road_id']
        
        # Create incident
        incident = {
            'id': str(uuid.uuid4()),
            'road_id': road_id,
            'location': source,  # Incident at the start of the road
            'type': random.choice(['accident', 'construction', 'weather']),
            'severity': random.uniform(0.3, 0.9),  # How much it slows traffic
            'duration': random.randint(5, 20)  # Time steps
        }
        
        self.incidents.append(incident)
    
    def get_vehicle_positions(self):
        """Return current positions of all vehicles"""
        return {
            vehicle_id: {
                'current_position': vehicle['current_position'],
                'destination': vehicle['destination'],
                'type': vehicle['type'],
                'status': vehicle['status']
            }
            for vehicle_id, vehicle in self.vehicles.items()
        }
    
    def get_traffic_density(self):
        """Return current traffic density on all roads"""
        return self.traffic_density
    
    def get_incidents(self):
        """Return current traffic incidents"""
        return self.incidents
    
    def add_incident(self, location, incident_type='accident', duration=10):
        """Add a traffic incident at a specific location"""
        # Find roads connected to this location
        if location not in self.city_graph.graph:
            return False
        
        # Choose a random outgoing edge
        edges = list(self.city_graph.graph.out_edges(location, data=True))
        if not edges:
            return False
            
        _, target, data = random.choice(edges)
        road_id = data['road_id']
        
        # Create incident
        incident = {
            'id': str(uuid.uuid4()),
            'road_id': road_id,
            'location': location,
            'type': incident_type,
            'severity': random.uniform(0.5, 0.9),
            'duration': duration
        }
        
        self.incidents.append(incident)
        return True
    
    def update_vehicle_routes(self, new_routes):
        """Update routes for vehicles based on suggestions"""
        for vehicle_id, route_data in new_routes.items():
            if vehicle_id in self.vehicles and 'path' in route_data:
                self.vehicles[vehicle_id]['route'] = route_data['path']
                # Reset progress to current position in new route
                current_pos = self.vehicles[vehicle_id]['current_position']
                if current_pos in route_data['path']:
                    self.vehicles[vehicle_id]['progress'] = route_data['path'].index(current_pos)
                else:
                    self.vehicles[vehicle_id]['progress'] = 0
    
    def reset(self):
        """Reset the simulation to initial state"""
        # Keep the same city graph but reset everything else
        num_vehicles = len(self.vehicles)
        self.vehicles = {}
        self.incidents = []
        self.traffic_density = {}
        self.time_step = 0
        
        self._initialize_vehicles(num_vehicles)
        self._initialize_traffic_density()
