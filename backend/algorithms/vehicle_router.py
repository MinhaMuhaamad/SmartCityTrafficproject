from .shortest_path import find_shortest_path, find_alternative_routes

def suggest_routes(city_graph, vehicles, traffic_data, incidents):
    """
    Suggest optimal routes for vehicles based on current traffic conditions.
    Uses a greedy approach to find the best route for each vehicle.
    
    Args:
        city_graph: CityGraph object
        vehicles: List of vehicles with their current positions and destinations
        traffic_data: Dictionary of current traffic density on each road
        incidents: List of current traffic incidents
        
    Returns:
        Dictionary of suggested routes for each vehicle
    """
    suggested_routes = {}
    
    # Create a copy of traffic data to account for incidents
    adjusted_traffic_data = traffic_data.copy()
    
    # Adjust traffic data based on incidents
    for incident in incidents:
        location = incident.get('location')
        severity = incident.get('severity', 1.0)  # Default severity factor
        
        # Find all roads connected to the incident location
        for source, target, data in city_graph.graph.edges(location, data=True):
            road_id = data['road_id']
            
            # Increase traffic density for affected roads
            if road_id in adjusted_traffic_data:
                adjusted_traffic_data[road_id] *= (1 + severity)
            else:
                adjusted_traffic_data[road_id] = 50 * severity  # Default high traffic
    
    # Process each vehicle
    for vehicle_id, vehicle_data in vehicles.items():
        current_position = vehicle_data.get('current_position')
        destination = vehicle_data.get('destination')
        
        if not current_position or not destination:
            continue
        
        # Find the best route for this vehicle
        route = find_shortest_path(city_graph, current_position, destination, adjusted_traffic_data)
        
        # If no route found or route is affected by severe incidents, find alternatives
        if not route['path'] or any(
            incident.get('location') in route['path'] and incident.get('severity', 0) > 0.5
            for incident in incidents
        ):
            alternative_routes = find_alternative_routes(city_graph, current_position, destination, adjusted_traffic_data)
            
            if alternative_routes:
                # Choose the best alternative route
                best_alternative = min(alternative_routes, key=lambda r: r['length'])
                route = {
                    'path': best_alternative['path'],
                    'length': best_alternative['length'],
                    'is_alternative': True
                }
        
        suggested_routes[vehicle_id] = route
    
    return suggested_routes

def optimize_multi_vehicle_routing(city_graph, vehicles, traffic_data):
    """
    Optimize routes for multiple vehicles to minimize overall travel time.
    This is a simplified approach to the Vehicle Routing Problem.
    
    Args:
        city_graph: CityGraph object
        vehicles: List of vehicles with their current positions and destinations
        traffic_data: Dictionary of current traffic density on each road
        
    Returns:
        Dictionary of optimized routes for each vehicle
    """
    # First, get individual optimal routes
    individual_routes = {}
    for vehicle_id, vehicle_data in vehicles.items():
        current_position = vehicle_data.get('current_position')
        destination = vehicle_data.get('destination')
        
        if current_position and destination:
            route = find_shortest_path(city_graph, current_position, destination, traffic_data)
            individual_routes[vehicle_id] = route
    
    # Identify potential congestion points
    congestion_points = {}
    for vehicle_id, route in individual_routes.items():
        for node in route.get('path', []):
            if node not in congestion_points:
                congestion_points[node] = 0
            congestion_points[node] += 1
    
    # Find nodes with high congestion (more than 2 vehicles passing through)
    high_congestion = {node: count for node, count in congestion_points.items() if count > 2}
    
    # Re-route vehicles to avoid high congestion points
    optimized_routes = {}
    
    for vehicle_id, route in individual_routes.items():
        # Check if this route passes through high congestion points
        path = route.get('path', [])
        if any(node in high_congestion for node in path):
            # Find alternative routes
            current_position = vehicles[vehicle_id].get('current_position')
            destination = vehicles[vehicle_id].get('destination')
            
            alternatives = find_alternative_routes(city_graph, current_position, destination, traffic_data, k=5)
            
            # Find the best alternative that avoids high congestion
            best_route = None
            best_congestion_score = float('inf')
            
            for alt_route in alternatives:
                # Calculate congestion score for this route
                congestion_score = sum(congestion_points.get(node, 0) for node in alt_route['path'])
                
                if congestion_score < best_congestion_score:
                    best_congestion_score = congestion_score
                    best_route = alt_route
            
            if best_route:
                optimized_routes[vehicle_id] = {
                    'path': best_route['path'],
                    'length': best_route['length'],
                    'optimized_for_congestion': True
                }
            else:
                optimized_routes[vehicle_id] = route
        else:
            optimized_routes[vehicle_id] = route
    
    return optimized_routes
