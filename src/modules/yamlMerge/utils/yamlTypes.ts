export type YamlPrimitive = string | number | boolean | null;
export type YamlValue = YamlPrimitive | YamlValue[] | { [key: string]: YamlValue };
export type YamlObject = { [key: string]: YamlValue };
