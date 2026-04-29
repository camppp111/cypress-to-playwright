"use strict";
describe('Within Scoping', () => {
    it('should use within to scope commands', () => {
        cy.visit('https://example.com');
        cy.get('body').within(() => {
            cy.get('h1').should('exist');
            cy.get('p').should('exist');
        });
    });
    it('should chain commands within within block', () => {
        cy.visit('https://example.com');
        cy.get('div').within(() => {
            cy.get('h1').should('exist');
            cy.contains('Example').should('exist');
        });
    });
    it('should use within with interactions', () => {
        cy.visit('https://example.com');
        cy.get('body').within(() => {
            cy.get('a').first().click();
        });
    });
});
