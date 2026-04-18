export const FighterName = {
  XiangShaoLong: 'xiang_shao_long',
  LianJin: 'lian_jin',
  WuTingFang: 'wu_ting_fang',
  ShanRou: 'shan_rou',
  YingZheng: 'ying_zheng',
} as const;

export type FighterNameType = (typeof FighterName)[keyof typeof FighterName];
