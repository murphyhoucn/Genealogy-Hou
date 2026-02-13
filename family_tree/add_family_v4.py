import os
import time
import random
import string
import hashlib
import yaml  # pip install pyyaml

# --- 配置 ---
DATA_DIR = "./family_data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# --- 工具函数 ---
def base62_encode(num):
    alphabet = string.digits + string.ascii_lowercase + string.ascii_uppercase
    if num == 0: return alphabet[0]
    arr = []
    base = len(alphabet)
    while num:
        num, rem = divmod(num, base)
        arr.append(alphabet[rem])
    arr.reverse()
    return ''.join(arr)

def generate_custom_uid(name):
    timestamp = str(int(time.time() * 1000))
    name_encode = str(sum(ord(c) for c in name))
    random_salt = str(random.randint(10000, 99999))
    raw_str = f"{timestamp}-{name_encode}-{random_salt}"
    md5_hash = hashlib.md5(raw_str.encode('utf-8')).hexdigest()
    hash_int = int(md5_hash, 16)
    b62_str = base62_encode(hash_int)
    result_id = b62_str[-6:]
    while len(result_id) < 6:
        result_id += random.choice(string.ascii_letters + string.digits)
    return result_id

def save_to_yaml(generation, data_dict):
    filename = os.path.join(DATA_DIR, f"G{generation}.yaml")
    current_data = []
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            try:
                loaded = yaml.safe_load(f)
                if loaded: current_data = loaded
            except yaml.YAMLError: pass
    
    current_data.append(data_dict)
    
    with open(filename, 'w', encoding='utf-8') as f:
        # sort_keys=False 极其重要，用于保证输出顺序与字典定义顺序一致
        yaml.dump(current_data, f, allow_unicode=True, sort_keys=False, default_flow_style=False)
    print(f"✅ 保存成功: {filename}")

# --- 主程序 ---
def main():
    print("==========================================")
    print("            家谱录入助手 v4.0              ")
    print("==========================================")
    
    last_gen = ""
    last_father_uid = ""

    while True:
        try:
            print("\n------------------------------------------")
            
            # --- 1. 基础信息录入 ---
            
            # 代数
            gen_prompt = f"代数 [回车复用 '{last_gen}']: " if last_gen else "代数: "
            gen_input = input(gen_prompt).strip()
            if not gen_input and last_gen: generation = last_gen
            elif gen_input: generation = gen_input; last_gen = gen_input
            else: continue

            # 父亲 UID
            father_prompt = f"父亲UID [回车复用 '{last_father_uid}']: " if last_father_uid else "父亲UID: "
            father_uid_input = input(father_prompt).strip()
            if not father_uid_input and last_father_uid: father_uid = last_father_uid
            else: father_uid = father_uid_input; last_father_uid = father_uid
            # 如果没填父亲且没缓存，father_uid 为 None
            father_uid = father_uid if father_uid else None

            # 姓名
            name = input("姓名 (必填): ").strip()
            if not name: continue

            # 生成 UID
            full_uid = f"G{generation}-{generate_custom_uid(name)}"
            print(f"🆔 UID: {full_uid}")

            # --- 2. 属性录入 ---

            # 性别
            gender_input = input("性别 [默认 男, 输入 f/0 为女]: ").strip().lower()
            if gender_input in ['f', '0', '女', 'female']:
                gender = "女"
            else:
                gender = "男"

            # 排行 (sibling_order)
            rank_input = input("排行 (sibling_order): ").strip()
            sibling_order = int(rank_input) if rank_input.isdigit() else (rank_input if rank_input else None)

            # --- 3. 生死状态 ---
            birth_date_input = input("出生日期 (YYYY): ").strip()
            birth_date = int(birth_date_input) if birth_date_input.isdigit() else (birth_date_input if birth_date_input else None)

            # 默认为在世
            is_alive = True
            death_date = None
            
            is_alive_input = input("还在世吗? (y/n) [默认 y]: ").strip().lower()
            if is_alive_input == 'n':
                is_alive = False
                dd_input = input("去世日期 (YYYY): ").strip()
                death_date = int(dd_input) if dd_input.isdigit() else (dd_input if dd_input else None)
            
            # --- 4. 其他信息 ---
            spouse_input = input("配偶: ").strip()
            spouse = spouse_input if spouse_input else None

            official_input = input("官职 (official_position): ").strip()
            official_position = official_input if official_input else None

            place_input = input("居住地 (residence_place): ").strip()
            residence_place = place_input if place_input else None

            bio_input = input("备注 (bio): ").strip()
            bio = bio_input if bio_input else None

            # --- 5. 构造字典 (严格按照要求的顺序) ---
            person = {
                "uid": full_uid,
                "father_uid": father_uid,
                "generation": int(generation),
                "name": name,
                "gender": gender,
                "sibling_order": sibling_order,
                "is_alive": is_alive,
                "birth_date": birth_date,
                "death_date": death_date,
                "spouse": spouse,
                "official_position": official_position,
                "residence_plac": residence_place,
                "bio": bio
            }

            save_to_yaml(generation, person)

        except KeyboardInterrupt:
            print("\n👋 退出")
            break
        except Exception as e:
            print(f"\n❌ 错误: {e}")

if __name__ == "__main__":
    main()