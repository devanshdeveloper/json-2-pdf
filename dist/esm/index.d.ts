import { ExtendedDOMJS } from "extendeddomjs";
interface PageOptions {
    size: string;
    styles: {
        height: string;
        width: string;
    };
    threshold: number;
}
interface DefineElement {
    name: string;
    iterator: string;
    elements: any[];
}
interface JSONToPDFOptions {
    page: PageOptions;
    pageContent: any;
    elements: any[];
    fixedElements?: any[];
    defineElements?: DefineElement[];
    payload?: any;
}
export declare class JSONToPDF {
    private jsonToHtml;
    private definedElements;
    private pagenumber;
    private ratio;
    private options;
    private pdfContainer;
    constructor(options: JSONToPDFOptions);
    createPageElement(): ExtendedDOMJS;
    createPageContentElement(): ExtendedDOMJS;
    addPage(): {
        pageElement: HTMLElement | null;
        pageContentElement: HTMLElement | null;
    };
    checkSpaceInPage(pageContentElement: HTMLElement): boolean;
    createElements(): void;
    paintPDFonScreen(pdfContainer: HTMLElement | null): void;
    download({ onProgress, // Provide default empty function to avoid errors
    onComplete, // Provide default empty function to avoid errors
    onError, // Provide default empty function to avoid errors
    filename, // Default filename
    resolution, }?: Partial<{
        onProgress: (percentage: number) => void;
        onComplete: () => void;
        onError: (error: any) => void;
        filename: string;
        resolution: number;
    }>): Promise<void>;
}
export {};
