-- 创建家族成员表
CREATE TABLE family_members (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  uid text UNIQUE,
  father_uid text,
  generation integer,
  name text NOT NULL,
  gender text CHECK (gender = ANY (ARRAY['男'::text, '女'::text])),
  sibling_order integer,
  is_alive boolean DEFAULT true,
  birth_date integer,
  death_date integer,
  official_position text,
  residence_place text,
  bio text,
  spouse text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT family_members_pkey PRIMARY KEY (id)
);

-- 为字段添加注释
COMMENT ON TABLE family_members IS '家族成员信息表';
COMMENT ON COLUMN family_members.id IS '唯一标识 ID';
COMMENT ON COLUMN family_members.uid IS '成员唯一标识（如 G21-7zZJUY）';
COMMENT ON COLUMN family_members.father_uid IS '父亲的 uid';
COMMENT ON COLUMN family_members.generation IS '世代';
COMMENT ON COLUMN family_members.name IS '姓名';
COMMENT ON COLUMN family_members.gender IS '性别';
COMMENT ON COLUMN family_members.sibling_order IS '排行';
COMMENT ON COLUMN family_members.is_alive IS '是否在世';
COMMENT ON COLUMN family_members.birth_date IS '出生年份（YYYY）';
COMMENT ON COLUMN family_members.death_date IS '去世年份（YYYY）';
COMMENT ON COLUMN family_members.official_position IS '官职';
COMMENT ON COLUMN family_members.residence_place IS '居住地';
COMMENT ON COLUMN family_members.bio IS '生平事迹（富文本JSON格式）';
COMMENT ON COLUMN family_members.spouse IS '配偶姓名';
COMMENT ON COLUMN family_members.updated_at IS '最后更新时间';

-- 创建索引以优化查询速度
CREATE INDEX idx_family_members_uid ON family_members(uid);
CREATE INDEX idx_family_members_father_uid ON family_members(father_uid);
CREATE INDEX idx_family_members_name ON family_members(name);
