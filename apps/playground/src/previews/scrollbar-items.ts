import { localized } from '../playground-content';

export const scrollbarItems = [
  {
    number: '01',
    label: localized('Canvas layers', '画布层'),
    detail: localized('Ambient light / surface / depth', '环境光 / 表面 / 深度'),
  },
  {
    number: '02',
    label: localized('Material surfaces', '材质表面'),
    detail: localized('Aurora Glass / opaque / overlay', '极光玻璃 / 不透明 / 覆盖层'),
  },
  {
    number: '03',
    label: localized('Type hierarchy', '文字层级'),
    detail: localized('Display / heading / body', '展示 / 标题 / 正文'),
  },
  {
    number: '04',
    label: localized('Interactive states', '交互状态'),
    detail: localized('Rest / hover / active', '静止 / 悬停 / 按下'),
  },
  {
    number: '05',
    label: localized('Focus treatment', '焦点处理'),
    detail: localized('Visible keyboard path', '可见的键盘路径'),
  },
  {
    number: '06',
    label: localized('Motion rhythm', '动效节奏'),
    detail: localized('Fast / standard / expressive', '快速 / 标准 / 表达'),
  },
  {
    number: '07',
    label: localized('Radius language', '圆角语言'),
    detail: localized('Control / card / panel', '控件 / 卡片 / 面板'),
  },
  {
    number: '08',
    label: localized('Shadow hierarchy', '阴影层级'),
    detail: localized('Control / raised / overlay', '控件 / 抬升 / 覆盖层'),
  },
  {
    number: '09',
    label: localized('Status signals', '状态信号'),
    detail: localized('Info / success / warning', '信息 / 成功 / 警告'),
  },
  {
    number: '10',
    label: localized('Responsive gutters', '响应式留白'),
    detail: localized('Inline / block / grid', '行内 / 块级 / 网格'),
  },
  {
    number: '11',
    label: localized('Navigation map', '导航地图'),
    detail: localized('Overview / modules / return', '总览 / 模块 / 返回'),
  },
  {
    number: '12',
    label: localized('Ready for the next layer', '准备进入下一层'),
    detail: localized('The canvas remains in view', '画布始终保持可见'),
  },
] as const;
