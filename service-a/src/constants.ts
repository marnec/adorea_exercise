export const PrismaErrorCodes = {
  UNIQUE_CONSTRAINT_FAIL: 'P2002',
  OPEARATION_DEPENDS_ON_MISSING: 'P2025',
  INCONSISTENT_DATA: 'P2023'
} as const;

export const saltRounds = 10 as const;
