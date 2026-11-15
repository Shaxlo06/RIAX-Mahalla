export type SmartJson = { [key: string]: SmartValue };
export type SmartValue = string | number | boolean | null | undefined | SmartValue[] | SmartJson;

export type SmartRecord = {
  id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: SmartValue;
};

export type FieldType = "text" | "textarea" | "date" | "number" | "select" | "url" | "email" | "file" | "checkbox";

export type SmartField = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  restricted?: boolean;
};

export type SmartModuleKey = "faculty" | "publications" | "teaching" | "quality" | "graduates";

