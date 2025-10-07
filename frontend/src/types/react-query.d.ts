// React Query types are properly exported from the package itself
// No need for additional type declarations

declare module '@tanstack/react-query-devtools' {
  export const ReactQueryDevtools: React.ComponentType<{
    initialIsOpen?: boolean;
  }>;
}
