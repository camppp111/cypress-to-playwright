import { CommandTranslator } from './cypress-translator';
import { CypressChain } from './types';
export declare class CypressCommandProxy {
    private translator;
    private commandQueue;
    private isProcessing;
    private lastCommandPromise;
    private chainIdCounter;
    private currentSubject;
    private isCollecting;
    private collectedCommands;
    private collectionSubject;
    constructor(translator: CommandTranslator, page?: any);
    setTranslator(translator: CommandTranslator, page?: any): void;
    flush(): Promise<void>;
    private processQueue;
    private enqueueCommand;
    createCypressProxy(): CypressChain;
    private createChainableProxy;
    private createProxy;
}
