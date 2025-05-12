import heapq
import networkx as nx

def find_shortest_path(city_graph, start_node, end_node, traffic_data):
    """
    Find the shortest path between two nodes considering current traffic.
    Uses Dijkstra's algorithm with traffic-adjusted weights.
    
    Args:
        city_graph: CityGraph object
        start_node: Starting intersection ID
        end_node: Destination intersection ID
        traffic_data: Dictionary of current traffic density on each road
        
    Returns:
        List of nodes representing the shortest path
    """
    # Create a copy of the graph to modify weights based on traffic
    graph = city_graph.graph.copy()
    
    # Adjust edge weights based on traffic density
    for edge in graph.edges(data=True):
        source, target, data = edge
        road_id = data['road_id']
        
        # Get traffic density for this road (default to 0 if not available)
        density = traffic_data.get(road_id, 0)
        
        # Adjust weight: higher traffic = higher weight
        # Base weight is 1, traffic factor ranges from 1 (no traffic) to 5 (heavy traffic)
        traffic_factor = 1 + (density / 20)  # Assuming density is 0-100
        new_weight = data['weight'] * traffic_factor
        
        # Update the edge weight
        graph[source][target]['weight'] = new_weight
    
    try:
        # Use NetworkX's Dijkstra algorithm to find shortest path
        path = nx.dijkstra_path(graph, start_node, end_node, weight='weight')
        
        # Calculate total path length for information
        path_length = nx.dijkstra_path_length(graph, start_node, end_node, weight='weight')
        
        return {
            'path': path,
            'length': path_length,
            'traffic_adjusted': True
        }
    except nx.NetworkXNoPath:
        return {
            'path': [],
            'length': float('inf'),
            'error': 'No path found between the specified nodes'
        }

def find_alternative_routes(city_graph, start_node, end_node, traffic_data, k=3):
    """
    Find k alternative routes between two nodes.
    Uses Yen's algorithm for k shortest paths.
    
    Args:
        city_graph: CityGraph object
        start_node: Starting intersection ID
        end_node: Destination intersection ID
        traffic_data: Dictionary of current traffic density on each road
        k: Number of alternative routes to find
        
    Returns:
        List of k paths from start to end
    """
    # Create a copy of the graph to modify weights based on traffic
    graph = city_graph.graph.copy()
    
    # Adjust edge weights based on traffic density
    for edge in graph.edges(data=True):
        source, target, data = edge
        road_id = data['road_id']
        density = traffic_data.get(road_id, 0)
        traffic_factor = 1 + (density / 20)
        new_weight = data['weight'] * traffic_factor
        graph[source][target]['weight'] = new_weight
    
    try:
        # Use NetworkX's k shortest paths algorithm
        routes = list(nx.shortest_simple_paths(graph, start_node, end_node, weight='weight'))
        
        # Limit to k routes
        routes = routes[:k]
        
        # Format the results
        result = []
        for i, route in enumerate(routes):
            # Calculate path length
            length = sum(graph[route[j]][route[j+1]]['weight'] for j in range(len(route)-1))
            
            result.append({
                'id': i + 1,
                'path': route,
                'length': length
            })
        
        return result
    except nx.NetworkXNoPath:
        return []
