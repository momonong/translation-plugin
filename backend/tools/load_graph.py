import pickle
import networkx as nx
import time

def load_graph_from_pickle(pkl_path: str) -> nx.MultiDiGraph:
    print(f"正在載入 Graph 物件 from {pkl_path}...")
    start = time.time()
    
    with open(pkl_path, "rb") as f:
        G = pickle.load(f)
        
    end = time.time()
    print(f"Graph 載入完畢！耗時: {end - start:.4f} 秒")
    print(f"節點: {G.number_of_nodes()}, 邊: {G.number_of_edges()}")
    
    return G