import csv
import json
import networkx as nx


def build_knowledge_graph(csv_path: str) -> nx.MultiDiGraph:
    G = nx.MultiDiGraph()

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=",")
        line_count = 0

        for row in reader:
            row = [cell.strip().strip('"') for cell in row]
            if len(row) != 5:
                continue
            _, rel, start, end, data = row
            if not (start.startswith("/c/en/") or start.startswith("/c/zh/")):
                continue
            if not (end.startswith("/c/en/") or end.startswith("/c/zh/")):
                continue

            # 嘗試從 data 欄位中解析 weight
            try:
                data_dict = json.loads(data)
                weight = float(data_dict.get("weight", 1.0))
            except Exception:
                weight = 1.0  # fallback

            G.add_node(start)
            G.add_node(end)
            G.add_edge(start, end, key=rel, label=rel, weight=weight)
            line_count += 1

    print(f"共建立 {G.number_of_nodes()} 節點，{G.number_of_edges()} 邊")
    return G


if __name__ == "__main__":
    from tools.graph_query import get_related_terms

    # 替換為你的 CSV 檔案路徑
    csv_path = "data/conceptnet_filtered.csv"
    G = build_knowledge_graph(csv_path)

    print(f"\n節點數：{G.number_of_nodes()}")
    print(f"邊數：{G.number_of_edges()}")

    sample_nodes = list(G.nodes)[:10]
    print("\n範例節點前 10 筆：")
    for node in sample_nodes:
        print(node)

    # 測試詞彙查詢
    test_term = "/c/en/course"
    results = get_related_terms(G, test_term)

    print(f"\n關鍵詞：{test_term}")
    for source, rel, target, weight in results:
        print(f"{source} --[{rel} ({weight:.2f})]--> {target}")

    print(f"\n總關聯數量：{len(results)}")
