describe('Custom Commands', () => {
  it('should use custom greeting command', () => {
    cy.greeting('World');
  });

  it('should use custom doubleClick command with subject', () => {
    cy.visit('https://example.com');
    cy.get('a').first().doubleClick();
  });

  it('should use overwritten visit command', () => {
    cy.visit('https://example.com');
    cy.url().should('include', 'example.com');
  });

  it('should chain custom commands', () => {
    cy.visit('https://example.com');
    cy.greeting('Test');
    cy.get('h1').should('exist');
  });
});
