import networkx as nx
import random
import json

class CityGraph:
    """
    Represents the city as a graph where intersections are nodes
    and roads are edges.
    """
    def __init__(self, load_default=True):
        self.graph = nx.DiGraph()
        self.traffic_lights = {}
        
        if load_default:
            self._create_default_city()
    
    def _create_default_city(self):
        """Create a default city grid layout"""
        # Create a 5x5 grid of intersections
        for i in range(5):
            for j in range(5):
                node_id = f"intersection_{i}_{j}"
                self.graph.add_node(
                    node_id, 
                    pos=(i*100, j*100),
                    type="intersection"
                )
                
                # Add traffic lights to intersections
                if i > 0 and j > 0:  # Not on the edges
                    self.traffic_lights[node_id] = {
                        "north_south": {
                            "green_time": 30,
                            "current_state": "green" if random.choice([True, False]) else "red",
                            "time_in_state": random.randint(0, 30)
                        },
                        "east_west": {
                            "green_time": 30,
                            "current_state": "red" if self.traffic_lights.get(node_id, {}).get("north_south", {}).get("current_state") == "green" else "green",
                            "time_in_state": random.randint(0, 30)
                        }
                    }
        
        # Connect intersections with roads
        for i in range(5):
            for j in range(5):
                current = f"intersection_{i}_{j}"
                
                # Connect to east neighbor
                if i < 4:
                    east = f"intersection_{i+1}_{j}"
                    self.graph.add_edge(
                        current, east, 
                        weight=1,
                        capacity=100,
                        current_flow=0,
                        road_id=f"road_e_{i}_{j}"
                    )
                    self.graph.add_edge(
                        east, current, 
                        weight=1,
                        capacity=100,
                        current_flow=0,
                        road_id=f"road_w_{i+1}_{j}"
                    )
                
                # Connect to north neighbor
                if j < 4:
                    north = f"intersection_{i}_{j+1}"
                    self.graph.add_edge(
                        current, north, 
                        weight=1,
                        capacity=100,
                        current_flow=0,
                        road_id=f"road_n_{i}_{j}"
                    )
                    self.graph.add_edge(
                        north, current, 
                        weight=1,
                        capacity=100,
                        current_flow=0,
                        road_id=f"road_s_{i}_{j+1}"
                    )
    
    def get_nodes(self):
        """Return all nodes with their attributes"""
        return [
            {
                "id": node,
                "x": self.graph.nodes[node]["pos"][0],
                "y": self.graph.nodes[node]["pos"][1],
                "type": self.graph.nodes[node]["type"]
            }
            for node in self.graph.nodes
        ]
    
    def get_edges(self):
        """Return all edges with their attributes"""
        return [
            {
                "id": data["road_id"],
                "source": source,
                "target": target,
                "weight": data["weight"],
                "capacity": data["capacity"],
                "current_flow": data["current_flow"]
            }
            for source, target, data in self.graph.edges(data=True)
        ]
    
    def get_traffic_lights(self):
        """Return all traffic lights with their current state"""
        return self.traffic_lights
    
    def update_edge_weight(self, source, target, new_weight):
        """Update the weight of an edge based on traffic conditions"""
        if self.graph.has_edge(source, target):
            self.graph[source][target]["weight"] = new_weight
    
    def update_traffic_light_timings(self, new_timings):
        """Update traffic light timings"""
        for intersection, timing in new_timings.items():
            if intersection in self.traffic_lights:
                self.traffic_lights[intersection]["north_south"]["green_time"] = timing["north_south"]
                self.traffic_lights[intersection]["east_west"]["green_time"] = timing["east_west"]
    
    def step_traffic_lights(self):
        """Update traffic light states for one time step"""
        for intersection, light in self.traffic_lights.items():
            # Update north-south direction
            light["north_south"]["time_in_state"] += 1
            if light["north_south"]["time_in_state"] >= light["north_south"]["green_time"]:
                light["north_south"]["current_state"] = "red" if light["north_south"]["current_state"] == "green" else "green"
                light["north_south"]["time_in_state"] = 0
                
                # Toggle east-west direction
                light["east_west"]["current_state"] = "green" if light["north_south"]["current_state"] == "red" else "red"
                light["east_west"]["time_in_state"] = 0
            
            # Update east-west direction if not just toggled
            elif light["east_west"]["time_in_state"] >= light["east_west"]["green_time"]:
                light["east_west"]["current_state"] = "red" if light["east_west"]["current_state"] == "green" else "green"
                light["east_west"]["time_in_state"] = 0
                
                # Toggle north-south direction
                light["north_south"]["current_state"] = "green" if light["east_west"]["current_state"] == "red" else "red"
                light["north_south"]["time_in_state"] = 0
            else:
                light["east_west"]["time_in_state"] += 1
