"use strict";
describe('Basic Navigation', () => {
    it('should visit a page and check url and title', () => {
        cy.visit('https://example.com');
        cy.url().should('include', 'example.com');
        cy.title().should('not.be.empty');
    });
    it('should visit multiple pages', () => {
        cy.visit('https://example.com');
        cy.url().should('include', 'example.com');
        cy.visit('https://example.com/about');
        cy.url().should('include', '/about');
    });
});
