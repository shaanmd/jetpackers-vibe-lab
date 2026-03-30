// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/lib/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: { jsx: 'react-jsx', moduleResolution: 'node' }
        }],
        '^.+\\.js$': ['ts-jest', {
          tsconfig: { jsx: 'react-jsx', moduleResolution: 'node' },
          diagnostics: false,
        }],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(nanoid)/)',
      ],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.test.tsx'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: { jsx: 'react-jsx', moduleResolution: 'node' }
        }],
      },
    },
  ],
}

export default config
