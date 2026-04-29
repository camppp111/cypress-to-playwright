describe('Element Selection', () => {
  it('should select elements with get', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('exist');
    cy.get('p').should('exist');
  });

  it('should select elements with find', () => {
    cy.visit('https://example.com');
    cy.get('body').find('h1').should('exist');
  });

  it('should select elements with contains', () => {
    cy.visit('https://example.com');
    cy.contains('Example').should('exist');
  });

  it('should select elements with contains and selector', () => {
    cy.visit('https://example.com');
    cy.contains('h1', 'Example').should('exist');
  });
});
