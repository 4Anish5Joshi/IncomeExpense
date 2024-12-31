declare module 'pdfjs-dist' {
  // Fixing the incorrect usage of generic `Uint8Array` in the package
  type Uint8Array = globalThis.Uint8Array;

  // Declare the necessary exports
  export function getDocument(params: any): any;

  // Declare GlobalWorkerOptions
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  // Declare version
  export const version: string;

  // Declare pdfjsLib to make it accessible
  export const pdfjsLib: {
    version: string;
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    getDocument: (params: any) => any;
    // Add other exports from pdfjs if needed
  };
}
