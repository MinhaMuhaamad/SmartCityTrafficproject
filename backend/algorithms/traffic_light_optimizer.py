def optimize_traffic_lights(city_graph, traffic_data):
    """
    Optimize traffic light timings based on current traffic conditions.
    Uses a dynamic programming approach to balance traffic flow.
    
    Args:
        city_graph: CityGraph object
        traffic_data: Dictionary of current traffic density on each road
        
    Returns:
        Dictionary of optimized traffic light timings for each intersection
    """
    optimized_timings = {}
    
    # Get all traffic lights
    traffic_lights = city_graph.get_traffic_lights()
    
    for intersection, light in traffic_lights.items():
        # Get incoming roads to this intersection
        incoming_roads = []
        for source, target, data in city_graph.graph.in_edges(intersection, data=True):
            incoming_roads.append((source, data['road_id']))
        
        # Calculate traffic density for north-south and east-west directions
        north_south_density = 0
        east_west_density = 0
        
        for source, road_id in incoming_roads:
            density = traffic_data.get(road_id, 0)
            
            # Determine if the road is north-south or east-west based on node IDs
            # Assuming node IDs are in the format "intersection_i_j"
            source_parts = source.split('_')
            intersection_parts = intersection.split('_')
            
            if len(source_parts) >= 3 and len(intersection_parts) >= 3:
                source_i, source_j = int(source_parts[1]), int(source_parts[2])
                intersection_i, intersection_j = int(intersection_parts[1]), int(intersection_parts[2])
                
                if source_i == intersection_i:  # Same column, so north-south direction
                    north_south_density += density
                elif source_j == intersection_j:  # Same row, so east-west direction
                    east_west_density += density
        
        # Calculate optimal green times based on traffic density ratio
        # Minimum green time is 15 seconds, maximum is 60 seconds
        total_density = north_south_density + east_west_density
        
        if total_density > 0:
            ns_ratio = north_south_density / total_density
            ew_ratio = east_west_density / total_density
            
            # Allocate time proportionally with minimum and maximum constraints
            cycle_time = 60  # Total cycle time in seconds
            
            ns_green_time = max(15, min(60, int(cycle_time * ns_ratio)))
            ew_green_time = max(15, min(60, int(cycle_time * ew_ratio)))
            
            # Ensure the total cycle time is maintained
            if ns_green_time + ew_green_time != cycle_time:
                # Adjust the larger one to maintain the cycle time
                if ns_green_time > ew_green_time:
                    ns_green_time = cycle_time - ew_green_time
                else:
                    ew_green_time = cycle_time - ns_green_time
        else:
            # Default to equal distribution if no traffic data
            ns_green_time = 30
            ew_green_time = 30
        
        optimized_timings[intersection] = {
            "north_south": ns_green_time,
            "east_west": ew_green_time
        }
    
    return optimized_timings
