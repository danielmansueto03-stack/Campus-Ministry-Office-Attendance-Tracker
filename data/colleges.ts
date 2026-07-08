export type CollegeKey = "CHAP" | "CLASE" | "CABECS" | "COE" | "CCJE" | "BED";

export interface CollegeConfig {
  label: string;
  isBasicEd?: boolean;
  courses: string[];
}

export const COLLEGES: Record<string, CollegeConfig> = {
  CHAP: { label: "CHAP", courses: ["BSMT", "BSN", "BSPHARMA", "BSMIDWIFERY"] },
  CLASE: {
    label: "CLASE",
    courses: ["BSPSYCH", "BSED", "BAPOLSCI", "BSCHEM", "BSMATHEMATICS"],
  },
  CABECS: {
    label: "CABECS",
    courses: ["BSA", "BSAIS", "BSBA", "BSHM", "BSTM", "BSIT"],
  },
  COE: { label: "COE", courses: ["BSCE", "BSCHE", "BSME"] },
  CCJE: { label: "CCJE", courses: ["BSCRIM"] },
  BED: {
    label: "BED",
    isBasicEd: true,
    courses: ["G7", "G8", "G9", "G10", "G11", "G12"],
  },
};

export const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];