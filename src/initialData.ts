import { DailyPlan, ImportantDate, MonthPlan, PlannerData, TodoItem, WeekPlan, YearPlan } from './types';

const todo = (id: string, text: string, completed = false): TodoItem => ({
  id,
  text,
  completed,
});

const importantDate = (id: string, date: string, title: string): ImportantDate => ({
  id,
  date,
  title,
});

const yearPlan = (
  keyword: string,
  goals: TodoItem[],
  importantDates: ImportantDate[],
  review: string
): YearPlan => ({
  keyword,
  goals,
  importantDates,
  review,
});

const emptyEisenhower = () => ({
  urgentImportant: [],
  importantNotUrgent: [],
  urgentNotImportant: [],
  notUrgentNotImportant: [],
});

export const createEmptyYearPlan = (): YearPlan => ({
  keyword: '',
  goals: [],
  importantDates: [],
  review: '',
});

export const createEmptyMonthPlan = (): MonthPlan => ({
  goals: [],
  todos: [],
  dayNotes: {},
  review: '',
});

export const createEmptyWeekPlan = (): WeekPlan => ({
  focus: '',
  todos: [],
  days: {},
  habits: [],
  review: '',
});

export const createEmptyDailyPlan = (): DailyPlan => ({
  topPriority: '',
  mood: '',
  weather: '',
  todos: [],
  schedule: [],
  notes: '',
  diary: '',
  eisenhower: emptyEisenhower(),
});

export const getInitialState = (): PlannerData => {
  const monthPlan: MonthPlan = {
    goals: [
      'Deep Work & Mindfulness Rituals (深度工作与正念仪式)',
      'Autumn Garden Preparation (秋季花园准备工作)',
    ],
    todos: [
      todo('t1', 'Review Q3 Financials', true),
      todo('t2', 'Book Winter Retreat', true),
      todo('t3', 'Finalize Design System v2'),
      todo('t4', 'Order Bulbs for Spring'),
      todo('t5', 'Read 2 Books on Stillness'),
    ],
    dayNotes: {
      '2026-10-03': 'Design Sync',
      '2026-10-12': 'Planning Day',
      '2026-10-24': 'Garden Cleanup',
    },
    review: 'Successfully launched local state engine with linen page visualizers.\n\nNeed to allocate more time to digital off-grid stillness.',
  };

  const dailyPlans: Record<string, DailyPlan> = {
    '2024-10-24': {
      topPriority: '完成Project Alpha的草案',
      mood: '4',
      weather: 'sunny',
      schedule: [
        { id: 's1', time: '06:00', text: 'Morning meditation & Tea' },
        { id: 's2', time: '10:00', text: 'Deep Work Session: Project Alpha' },
        { id: 's3', time: '14:00', text: 'Lunch with Sarah' },
        { id: 's4', time: '18:00', text: 'Creative Writing' },
      ],
      eisenhower: {
        urgentImportant: ['提交季报 / Submit quarterly report'],
        importantNotUrgent: ['深度工作: Project Alpha / Deep Work'],
        urgentNotImportant: ['回复邮件 / Reply to emails'],
        notUrgentNotImportant: ['浏览资讯 / Browse feeds'],
      },
      todos: [
        todo('td1', '确认兽医预约 / Confirm veterinary appt'),
        todo('td2', '给室内植物浇水 / Water indoor plants'),
      ],
      notes: '提醒：要有意识地控制使用电子设备的时间。在深度工作期间，尝试把手机放在另一个房间。',
      diary: '今天感觉比平时轻松一些。清晨的阳光透过百叶窗洒进来，让我想起了“木漏れ日”（Komorebi）这个词——在摇曳阴影中的美丽。\n\n我想在下午4点前完成Project Alpha的草案，这样我就可以去公园读会儿书。今天的空气很清新，非常适合晚点去散步。',
    },
    '2026-05-31': {
      topPriority: '完成 Mine Planner 的本地数据结构',
      mood: '5',
      weather: 'sunny',
      schedule: [
        { id: 's5', time: '07:00', text: 'Daily Reflection & Quiet Tea Grid' },
        { id: 's6', time: '09:00', text: 'Review Weekly Mindset & Journal Setup' },
        { id: 's7', time: '11:00', text: 'Quiet Reading: Stillness is the Key' },
        { id: 's8', time: '15:00', text: 'Walk in the Park / Nature Contact' },
        { id: 's9', time: '19:00', text: 'Review Zenith Stationery Code & Design System' },
      ],
      eisenhower: {
        urgentImportant: ['Finalize local data structures', 'Water all terrace plants'],
        importantNotUrgent: ['Read 3 chapters of philosophy book', 'Reflect on 2026 keywords'],
        urgentNotImportant: ['Call parents in the evening'],
        notUrgentNotImportant: ['Skim calligraphy forums'],
      },
      todos: [
        todo('td3', 'Set up Mine Planner React app', true),
        todo('td4', 'Practice hand calligraphy for 30 minutes'),
        todo('td5', 'Log high-resolution paper overlay feedback', true),
      ],
      notes: '“蓄力”这个年度关键词写得很合心意。在未来的几个月里，努力做减法。让信息少一点，让思考深一些。',
      diary: '今天是星期日。坐在阳光饱满的书桌前画格子，数字手账的使用体验甚至要比纸质本子多出一种安心感——随时能改，随时能加，也不会有漏页或者错字划掉的丑陋痕迹。\n\n清茶的味道很好。',
    },
  };

  return {
    yearPlans: {
      '2024': yearPlan(
        '意图',
        [
          todo('yg1', '建立一个可持续的创作习惯 / Create a creative habit'),
          todo('yg2', '完成12次专注的数字排毒周末 / 12 Digital Detox Weekends'),
          todo('yg3', '掌握传统书法基础 / Calligraphy fundamentals'),
          todo('yg4', '在安静的空间中持续练习 / Stillness practice'),
        ],
        [
          importantDate('m1', 'MAR 14', 'Spring Reflection Trip'),
          importantDate('m2', 'JUN 21', 'Mid-Year Portfolio Review'),
          importantDate('m3', 'SEP 05', 'Annual Craft Fair'),
          importantDate('m4', 'DEC 20', 'Winter Solstice Retreat'),
        ],
        '回顾你最幸福的时刻... 与至爱之人在晚风中散步。\n\n成长发生在安静的空间里... Growth happens in the quiet spaces of unplugged retreats.'
      ),
      '2025': yearPlan(
        '平和',
        [
          todo('yg5', '保持每日正念冥想 / Daily Mindfulness Meditation'),
          todo('yg6', '阅读24本关于心智成长的书籍 / Read 24 growth books'),
          todo('yg7', '优化个人工作流设计 / Optimize workflow design'),
          todo('yg8', '加强户外徒步频率 / Regular hiking'),
        ],
        [
          importantDate('m5', 'APR 03', 'Cherry Blossom Forest Retreat'),
          importantDate('m6', 'JUL 15', 'Mountain Wilderness Hike'),
          importantDate('m7', 'OCT 12', 'Solitude Writing Fortnight'),
          importantDate('m8', 'DEC 22', 'Winter Solstice Review'),
        ],
        '完成了山林徒步，与大自然深度连接。\n\n过于频繁的电子通知会严重侵蚀专注力。'
      ),
      '2026': yearPlan(
        '蓄力',
        [
          todo('yg9', '深化系统性知识框架 / Deepen Knowledge Framework'),
          todo('yg10', '每日坚持手写复盘与输出 / Daily Handwritten Review'),
          todo('yg11', '极简数字生活实践 / Practice Minimalist Digital Life'),
          todo('yg12', '探索传统手工工艺 / Explore Traditional Crafts & Arts'),
        ],
        [
          importantDate('m9', 'MAR 12', 'Spring Seedling Planting'),
          importantDate('m10', 'JUN 21', 'Summer Solstice Reflection'),
          importantDate('m11', 'SEP 15', 'Harvest Moon Mindful Tea'),
          importantDate('m12', 'DEC 21', 'Winter Reflection Retreat'),
        ],
        '清晨百叶窗下的阳光与一杯慢煮咖啡。\n\n放慢脚步才能看清前行的本源。'
      ),
    },
    monthPlans: {
      '2024-10': {
        ...monthPlan,
        dayNotes: {
          '2024-10-03': 'Design Sync',
          '2024-10-12': 'Planning Day',
          '2024-10-24': 'Garden Cleanup',
        },
      },
      '2025-10': {
        ...monthPlan,
        dayNotes: {
          '2025-10-05': 'Mid-Term Mind Map',
          '2025-10-15': 'Studio Open Day',
        },
      },
      '2026-10': monthPlan,
    },
    weekPlans: {},
    dailyPlans,
    calendarEvents: {},
    settings: {
      themeColor: '#4c5d73',
      paperStyle: 'grid',
      language: 'zh',
    },
    lastSaved: new Date().toISOString(),
  };
};
