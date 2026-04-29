describe('Navigation', () => {
  it('should reload the page', () => {
    cy.visit('https://example.com');
    cy.reload();
    cy.url().should('include', 'example.com');
  });

  it('should go back', () => {
    cy.visit('https://example.com');
    cy.visit('https://example.com/about');
    cy.go('back');
    cy.url().should('not.include', '/about');
  });

  it('should go forward', () => {
    cy.visit('https://example.com');
    cy.visit('https://example.com/about');
    cy.go('back');
    cy.go('forward');
    cy.url().should('include', '/about');
  });

  it('should use go with direction numbers', () => {
    cy.visit('https://example.com');
    cy.visit('https://example.com/about');
    cy.go(-1); // back
    cy.url().should('not.include', '/about');
    cy.go(1); // forward
    cy.url().should('include', '/about');
  });
});
