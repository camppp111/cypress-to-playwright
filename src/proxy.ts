import { CommandTranslator } from './cypress-translator';
import { CypressChain } from './types';

interface Command {
  name: string;
  args: any[];
  resolve: (value: any) => void;
  reject: (error: any) => void;
  subject?: any;
  chainId: number;
  parentPromise?: Promise<any>;
}

export class CypressCommandProxy {
  private translator: CommandTranslator;
  private commandQueue: Command[] = [];
  private isProcessing: boolean = false;
  private lastCommandPromise: Promise<any> = Promise.resolve();
  private chainIdCounter: number = 0;
  private currentSubject: any = undefined;
  private isCollecting: boolean = false;
  private collectedCommands: { name: string; args: any[]; subject?: any; parentPromise?: Promise<any> }[] = [];
  private collectionSubject: any = undefined;

  constructor(translator: CommandTranslator, page?: any) {
    this.translator = translator;
  }

  setTranslator(translator: CommandTranslator, page?: any): void {
    this.translator = translator;
  }

  async flush(): Promise<void> {
    while (this.commandQueue.length > 0 || this.isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await this.lastCommandPromise.catch(() => {});
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift()!;
      if (typeof command.name !== 'string') {
        command.reject(new Error('Symbol properties not supported'));
        continue;
      }

      await this.lastCommandPromise.catch(() => {});

      let subject = command.subject ?? this.currentSubject;
      if (command.parentPromise) {
        subject = await command.parentPromise.catch(() => this.currentSubject);
      }
      if (subject?.then) {
        subject = await subject.catch(() => this.currentSubject);
      }

      try {
        const customCommands = (globalThis as any).__cypressCustomCommands;
        const customFn = customCommands ? customCommands[command.name] : undefined;
        const originalCommand = customCommands ? (globalThis as any).__cypressOriginalCommands?.[command.name] : undefined;
        let result: any;

        if (customFn) {
          const commandOptions = (globalThis as any).__cypressCustomCommandOptions?.[command.name];
          const hasPrevSubject = commandOptions?.prevSubject !== undefined;
          let wrappedSubject = subject;
          if (hasPrevSubject && subject?.evaluate && !subject.__jquery) {
            wrappedSubject = await this.translator.createJQueryWrapper(subject);
          }

          if (originalCommand !== undefined && originalCommand !== null) {
            result = await customFn(originalCommand, wrappedSubject, ...command.args);
          } else if (originalCommand === null) {
            const originalFn = (...a: any[]) => this.translator.translate(String(command.name), a);
            result = await customFn(originalFn, ...command.args);
          } else if (hasPrevSubject) {
            result = await customFn(wrappedSubject, ...command.args);
          } else {
            result = await customFn(...command.args);
          }
        } else {
          result = await this.translator.translate(String(command.name), command.args, subject);
        }

        if (result === undefined && customFn) {
          result = this.translator.getCurrentSubject?.() ?? this.currentSubject;
        }
        this.currentSubject = result;
        command.resolve(result);
        this.lastCommandPromise = Promise.resolve(result);
      } catch (error) {
        command.reject(error);
        this.lastCommandPromise = Promise.reject(error);
      }
    }

    this.isProcessing = false;
    this.currentSubject = undefined;
  }

  private enqueueCommand(name: string, args: any[], subject?: any, parentPromise?: Promise<any>): Promise<any> {
    const chainId = ++this.chainIdCounter;
    // If in collection mode, collect the command instead of enqueuing
    if (this.isCollecting) {
      // Use collectionSubject if no explicit subject provided (for chained commands)
      const effectiveSubject = subject !== undefined ? subject : this.collectionSubject;
      this.collectedCommands.push({ name, args, subject: effectiveSubject, parentPromise });

      // Simulate subject update for chaining
      // Commands that yield a subject should update collectionSubject
      const subjectYieldingCommands = ['get', 'contains', 'findByTestId', 'findAllByTestId', 'findByText', 'findAllByText', 'findByRole', 'findAllByRole', 'find', 'eq', 'first', 'last'];
      if (subjectYieldingCommands.includes(name)) {
        this.collectionSubject = { __playwrightLocator: true }; // Dummy locator for chaining
      }

      // Return a chainable proxy that continues collecting
      return this.createProxy(Promise.resolve(), false) as any;
    }

    const promise = new Promise<any>((resolve, reject) => {
      this.commandQueue.push({ name, args, resolve, reject, subject, chainId, parentPromise });
      this.processQueue();
    });
    (promise as any).__chainId = chainId;
    return promise;
  }

  createCypressProxy(): CypressChain {
    return this.createProxy(Promise.resolve(), true);
  }

  private createChainableProxy(promise: Promise<any>, chainId?: number): CypressChain {
    if (!(promise as any).__chainId) (promise as any).__chainId = chainId ?? 0;
    return this.createProxy(promise, false, chainId);
  }

  private createProxy(promise: Promise<any>, isRoot: boolean, explicitChainId?: number): CypressChain {
    const target = isRoot ? {} : promise;
    return new Proxy(target, {
      get: (_, prop: string | symbol) => {
        if (typeof prop === 'symbol') return isRoot ? undefined : (promise as any)[prop];
        if (prop === 'catch' || prop === 'finally') {
          return (isRoot ? this.lastCommandPromise : promise)[prop].bind(isRoot ? this.lastCommandPromise : promise);
        }
        if (prop === 'then') {
          return (callback: (value: any) => any) => {
            const resultPromise = promise.then(async (value) => {
              const result = await callback(value);
              this.currentSubject = result;
              return result;
            });
            return this.createChainableProxy(resultPromise);
          };
        }
        if (isRoot) {
          if (prop === '__waitForAllCommands') {
            return async () => {
              while (this.commandQueue.length > 0 || this.isProcessing) {
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            };
          }
          if (prop === '__resetQueue') {
            return () => {
              this.commandQueue = [];
              this.isProcessing = false;
              this.currentSubject = undefined;
              this.lastCommandPromise = Promise.resolve();
              this.chainIdCounter = 0;
            };
          }
          if (prop === 'config') {
            return () => ({ viewportWidth: 1280, viewportHeight: 720 });
          }
          if (prop === 'platform') return process.platform;
        }

        return (...args: any[]) => {
          let nextPromise: Promise<any>;

          // Handle commands that take callbacks (like within)
          const isCallbackCommand = prop === 'within' && typeof args[0] === 'function';

          if (isCallbackCommand) {
            const callback = args[0];

            // Enter collection mode
            this.isCollecting = true;
            this.collectedCommands = [];
            this.collectionSubject = this.currentSubject; // Initialize with current subject

            // Execute callback to collect commands
            try {
              callback(this.currentSubject);
            } catch (error) {
              console.error('Error collecting commands from callback:', error);
            }

            // Exit collection mode
            this.isCollecting = false;
            this.collectionSubject = undefined; // Reset
            const collected = [...this.collectedCommands];
            this.collectedCommands = [];

            // Enqueue the parent command (within marker)
            if (isRoot) {
              nextPromise = this.enqueueCommand(prop, [undefined], this.currentSubject);
              this.lastCommandPromise = nextPromise;
            } else {
              const cmdPromise = this.enqueueCommand(prop, [undefined], this.currentSubject, promise);
              nextPromise = promise.then(() => cmdPromise);
            }

            // Enqueue collected commands after the parent
            // For selector-based commands (get, contains, etc.), don't pass subject to use withinSubjectChain
            // For subject-based commands (check, click without args, etc.), pass the subject
            let lastPromise = nextPromise;
            collected.forEach(cmd => {
              const selectorBasedCommands = ['get', 'contains', 'findByTestId', 'findAllByTestId', 'findByText', 'findAllByText', 'findByRole', 'findAllByRole', 'find', 'eq', 'first', 'last', 'filter'];
              const shouldUseSubject = !selectorBasedCommands.includes(cmd.name);
              const cmdPromise = this.enqueueCommand(cmd.name, cmd.args, shouldUseSubject ? cmd.subject : undefined, lastPromise);
              lastPromise = cmdPromise;
            });

            // Enqueue resetWithinScope to clean up the scoping after the block
            const resetPromise = this.enqueueCommand('resetWithinScope', [], undefined, lastPromise);
            lastPromise = resetPromise;

            return this.createChainableProxy(lastPromise);
          }

          // Normal command handling
          if (isRoot) {
            nextPromise = this.enqueueCommand(prop, args);
            this.lastCommandPromise = nextPromise;
            return this.createChainableProxy(nextPromise);
          } else {
            const cmdPromise = this.enqueueCommand(prop, args, undefined, promise);
            const nextPromise = promise.then(() => cmdPromise);
            return this.createChainableProxy(nextPromise);
          }
        };
      },
    }) as any;
  }
}
