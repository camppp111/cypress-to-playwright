describe('Waiting', () => {
  it('should wait for a specific time', () => {
    cy.visit('https://example.com');
    cy.wait(1000);
  });

  it('should wait for element to exist', () => {
    cy.visit('https://example.com');
    cy.get('h1', { timeout: 5000 }).should('exist');
  });

  it('should wait for element to be visible', () => {
    cy.visit('https://example.com');
    cy.get('h1', { timeout: 5000 }).should('be.visible');
  });
});
