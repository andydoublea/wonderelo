import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Global test utilities
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        '.next/',
        'coverage/',
      ],
      // Coverage thresholds
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    
    // Include/exclude patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'coverage'],
    
    // Reporter configuration
    reporters: ['verbose', 'json', 'html'],
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Watch mode
    watch: false,
    
    // Parallel execution
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    
    // Snapshot configuration
    resolveSnapshotPath: (testPath, snapExtension) => {
      return path.join(
        path.dirname(testPath),
        '__snapshots__',
        path.basename(testPath) + snapExtension
      );
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@utils': path.resolve(__dirname, './utils'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@stores': path.resolve(__dirname, './stores'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
