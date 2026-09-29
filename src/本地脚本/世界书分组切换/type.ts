
export interface SwitchGroup {
  label: string;
  match: RegExp | ((name: string) => boolean);
}
