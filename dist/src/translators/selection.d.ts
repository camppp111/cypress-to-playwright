import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorInteraction } from './interaction';
export declare class CommandTranslatorSelection extends CommandTranslatorInteraction {
    constructor(page: Page, context?: BrowserContext);
    private get;
    private find;
    private contains;
    private findByTestId;
    private findAllByTestId;
    private findByRole;
    private findAllByRole;
    private findAllByText;
    private findByText;
    private findByPlaceholderText;
    private findByLabelText;
    private eq;
    private first;
    private each;
    private last;
}
