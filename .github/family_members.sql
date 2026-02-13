-- ========================================
-- 创建 family_members 表 - 统一字段模式
-- ========================================
-- 在 Supabase SQL Editor 中直接执行

-- 删除旧表（如有）
DROP TABLE IF EXISTS family_members CASCADE;

-- 创建新表
CREATE TABLE family_members (
  -- 系统字段
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 核心字段（13项）
  uid TEXT NOT NULL UNIQUE,                    -- 族谱ID（如 P001, P002）
  name TEXT NOT NULL,                          -- 姓名
  generation INTEGER,                          -- 第几代
  sibling_order INTEGER,                       -- 兄弟姐妹排序
  father_uid TEXT,                             -- 父亲的 uid（自引用）
  gender TEXT CHECK (gender IN ('男', '女')), -- 性别
  is_alive BOOLEAN,                            -- 是否在世
  birth_date INTEGER,                          -- 出生年份（整数）
  death_date INTEGER,                          -- 死亡年份（整数）
  official_position TEXT,                      -- 官职
  residence_place TEXT,                        -- 住所
  bio TEXT,                                    -- 个人传记
  spouse TEXT                                  -- 配偶名字
);

-- 创建索引优化查询
CREATE INDEX idx_family_members_uid ON family_members(uid);
CREATE INDEX idx_family_members_father_uid ON family_members(father_uid);
CREATE INDEX idx_family_members_name ON family_members(name);
CREATE INDEX idx_family_members_generation ON family_members(generation);

-- ========================================
-- 表结构完成！字段列表：
-- id (自增主键), updated_at (时间戳),
-- uid, name, generation, sibling_order, father_uid,
-- gender, is_alive, birth_date, death_date,
-- official_position, residence_place, bio, spouse
-- ========================================
