describe('Element Properties', () => {
  it('should get element count with its length', () => {
    cy.visit('https://example.com');
    cy.get('p').its('length').should('be.gte', 1);
  });

  it('should check if element has class', () => {
    cy.visit('https://example.com');
    cy.get('body').hasClass('example').then((hasClass: boolean) => {
      expect(hasClass).to.be.a('boolean');
    });
  });

  it('should get element property with its', () => {
    cy.visit('https://example.com');
    cy.get('a').its('href').should('exist');
  });

  it('should check element text with its', () => {
    cy.visit('https://example.com');
    cy.get('h1').its('textContent').should('exist');
  });
});
