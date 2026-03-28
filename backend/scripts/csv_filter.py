import csv
from opencc import OpenCC

cc = OpenCC('s2t')  # 簡體轉繁體

def is_en_or_zh(term):
    """檢查是否為英文或中文節點"""
    return term.startswith('/c/en/') or term.startswith('/c/zh/')

def is_simplified_chinese(term: str) -> bool:
    """
    利用 OpenCC 判斷 term 是否為簡體中文（以繁簡轉換差異為準）
    """
    if not term.startswith("/c/zh/"):
        return False
    word = term.split("/c/zh/")[-1]
    return word != cc.convert(word)

# 擴充後的保留語意關係（共 13 種）
keep_relations = {
    "/r/Synonym", "/r/SimilarTo", "/r/DefinedAs", "/r/Antonym", "/r/FormOf",
    "/r/DerivedFrom", "/r/EtymologicallyRelatedTo", "/r/TranslationOf",
    "/r/IsA", "/r/RelatedTo", "/r/HasContext", "/r/UsedFor", "/r/CapableOf"
}

total_rows = 0
kept_rows = 0
relation_counts = {}

# 檔案路徑設定
input_path = "data/conceptnet.csv"
output_path = "data/conceptnet_filtered.csv"

with open(input_path, "r", encoding="utf-8") as fin, \
     open(output_path, "w", encoding="utf-8", newline='') as fout:

    reader = csv.reader(fin, delimiter='\t')
    writer = csv.writer(fout)

    for row in reader:
        total_rows += 1
        if total_rows % 100000 == 0:
            print(f"已處理 {total_rows} 行...")

        if len(row) != 5:
            continue

        uri, rel, start, end, data = row

        if rel in keep_relations and is_en_or_zh(start) and is_en_or_zh(end):
            if is_simplified_chinese(start) or is_simplified_chinese(end):
                continue  # 🔥 過濾簡體
            kept_rows += 1
            relation_counts[rel] = relation_counts.get(rel, 0) + 1
            writer.writerow(row)

# 顯示統計結果
print("\n處理完成！")
print(f"原始總行數: {total_rows}")
print(f"保留行數: {kept_rows}")
print(f"過濾後保留比率: {(kept_rows / total_rows) * 100:.2f}%\n")

print("各保留關係類型統計：")
for rel, count in sorted(relation_counts.items(), key=lambda x: -x[1]):
    print(f"{rel}: {count:,} 筆")
