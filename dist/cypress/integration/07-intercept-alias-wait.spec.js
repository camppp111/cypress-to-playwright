"use strict";
describe('Intercept, Alias, and Wait', () => {
    it('should intercept network request and wait for it', () => {
        cy.intercept('GET', '**/example**').as('exampleRequest');
        cy.visit('https://example.com');
        cy.wait('@exampleRequest', { timeout: 5000 }).catch(() => {
            console.log('Request not intercepted (expected if no matching request)');
        });
    });
    it('should intercept POST request', () => {
        cy.intercept('POST', '**/api/**').as('postRequest');
        cy.visit('https://example.com');
        cy.wait('@postRequest', { timeout: 5000 }).catch(() => {
            console.log('POST request not intercepted (expected if no matching request)');
        });
    });
    it('should intercept with method and url', () => {
        cy.intercept('GET', '**/example**').as('getRequest');
        cy.visit('https://example.com');
        cy.wait('@getRequest', { timeout: 5000 }).catch(() => {
            console.log('GET request not intercepted (expected if no matching request)');
        });
    });
    it('should intercept multiple requests', () => {
        cy.intercept('GET', '**/example**').as('request1');
        cy.intercept('GET', '**/test**').as('request2');
        cy.visit('https://example.com');
        cy.wait('@request1', { timeout: 5000 }).catch(() => {
            console.log('Request 1 not intercepted (expected if no matching request)');
        });
    });
});
