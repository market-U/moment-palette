/** 単色調整画面が公開する、未確定の選択色と対象Areaを表す。 */
export type SolidColorFillState =
  | Readonly<{ phase: 'closed' }>
  | Readonly<{ phase: 'editing'; areaId: string; color: string }>
