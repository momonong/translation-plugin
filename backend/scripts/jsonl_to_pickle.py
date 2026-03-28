import json
import pickle
import networkx as nx
import time

INPUT_FILE = r'data\graph_data.jsonl' # 記得改回你的路徑
OUTPUT_FILE = r'data\graph.pkl'       # 注意：副檔名還是 .pkl，但內容變了

def create_graph_pickle():
    print(f"1. 正在讀取並建立 Graph 物件...")
    start_time = time.time()
    
    # 初始化你的圖
    G = nx.MultiDiGraph()
    
    # 讀取並直接建立圖 (完全複製你的邏輯)
    count = 0
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)
            u = data["source"]
            v = data["target"]
            rel = data["relation"]
            weight = data.get("weight", 1.0)

            # 在這裡直接 add_edge
            # 雖然這裡跑起來會花點時間 (本地端沒差)，但存起來後讀取是秒殺
            G.add_node(u)
            G.add_node(v)
            G.add_edge(u, v, key=rel, label=rel, weight=weight)
            
            count += 1
            if count % 500000 == 0:
                print(f"   已處理 {count} 條邊...")

    build_time = time.time() - start_time
    print(f"圖建立完成！共 {G.number_of_nodes()} 節點，{G.number_of_edges()} 邊。耗時: {build_time:.2f} 秒")
    
    print(f"2. 正在寫入 Pickle (儲存整個 Graph 物件)...")
    start_dump = time.time()
    
    with open(OUTPUT_FILE, 'wb') as f:
        pickle.dump(G, f, protocol=pickle.HIGHEST_PROTOCOL)
        
    print(f"寫入完成！耗時: {time.time() - start_dump:.2f} 秒")
    print("現在 Cloud Run 讀取這個檔案時，不需要再跑 add_edge 了！")

if __name__ == "__main__":
    create_graph_pickle()