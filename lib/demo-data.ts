// 演示模式的家族成员数据
export const demoFamilyMembers = [
  {
    id: 1,
    uid: "G20-demo-001",
    father_uid: null,
    father_name: null,
    name: "刘德华",
    generation: 20,
    sibling_order: 1,
    gender: "男" as const,
    official_position: "知县",
    is_alive: false,
    spouse: "李美凤",
    bio: "祖籍广东，清朝知县，为人正直，深受百姓爱戴。",
    birth_date: 1850,
    death_date: 1920,
    residence_place: "广东省广州市",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    uid: "G21-demo-001",
    father_uid: "G20-demo-001",
    father_name: "刘德华",
    name: "刘建华",
    generation: 21,
    sibling_order: 1,
    gender: "男" as const,
    official_position: "商人",
    is_alive: false,
    spouse: "王淑芬",
    bio: "继承父业，经商有方，家业兴旺。",
    birth_date: 1875,
    death_date: 1945,
    residence_place: "广东省广州市",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 3,
    uid: "G22-demo-001",
    father_uid: "G21-demo-001",
    father_name: "刘建华",
    name: "刘明华",
    generation: 22,
    sibling_order: 1,
    gender: "男" as const,
    official_position: "教师",
    is_alive: true,
    spouse: "陈文静",
    bio: "现代教育家，致力于教育事业，桃李满天下。",
    birth_date: 1920,
    death_date: null,
    residence_place: "广东省广州市",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 4,
    uid: "G22-demo-002",
    father_uid: "G21-demo-001",
    father_name: "刘建华",
    name: "刘慧华",
    generation: 22,
    sibling_order: 2,
    gender: "女" as const,
    official_position: null,
    is_alive: true,
    spouse: "张志强",
    bio: "温柔贤惠，相夫教子，家庭和睦。",
    birth_date: 1925,
    death_date: null,
    residence_place: "广东省深圳市",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 5,
    uid: "G23-demo-001",
    father_uid: "G22-demo-001",
    father_name: "刘明华",
    name: "刘志华",
    generation: 23,
    sibling_order: 1,
    gender: "男" as const,
    official_position: "工程师",
    is_alive: true,
    spouse: "林雅琴",
    bio: "软件工程师，技术精湛，参与多个重要项目开发。",
    birth_date: 1985,
    death_date: null,
    residence_place: "广东省深圳市",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 6,
    uid: "G23-demo-002",
    father_uid: "G22-demo-001",
    father_name: "刘明华",
    name: "刘美华",
    generation: 23,
    sibling_order: 2,
    gender: "女" as const,
    official_position: "医生",
    is_alive: true,
    spouse: "黄俊杰",
    bio: "儿科医生，医术精湛，深受患者信赖。",
    birth_date: 1988,
    death_date: null,
    residence_place: "北京市海淀区",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

export function isDemoMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  return !supabaseUrl || !supabaseKey || 
         supabaseUrl === 'your_supabase_url_here' || 
         supabaseKey === 'your_supabase_anon_key_here';
}