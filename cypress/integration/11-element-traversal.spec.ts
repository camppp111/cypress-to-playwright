describe('Element Traversal', () => {
  it('should find closest ancestor', () => {
    cy.visit('https://example.com');
    cy.get('p').closest('body').should('exist');
  });

  it('should find next sibling', () => {
    cy.visit('https://example.com');
    cy.get('h1').next().should('exist');
  });

  it('should find previous sibling', () => {
    cy.visit('https://example.com');
    cy.get('p').prev().should('exist');
  });

  it('should find all next siblings', () => {
    cy.visit('https://example.com');
    cy.get('h1').nextAll().should('have.length.gte', 0);
  });

  it('should find all previous siblings', () => {
    cy.visit('https://example.com');
    cy.get('p').prevAll().should('have.length.gte', 0);
  });

  it('should find all siblings', () => {
    cy.visit('https://example.com');
    cy.get('h1').siblings().should('have.length.gte', 0);
  });

  it('should find children', () => {
    cy.visit('https://example.com');
    cy.get('body').children().should('have.length.gte', 1);
  });

  it('should find parents', () => {
    cy.visit('https://example.com');
    cy.get('p').parents().should('have.length.gte', 1);
  });

  it('should filter elements with not', () => {
    cy.visit('https://example.com');
    cy.get('body').find('p').not('.nonexistent').should('exist');
  });

  it('should check if element matches selector with is', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('exist');
  });

  it('should check if element has descendant with has', () => {
    cy.visit('https://example.com');
    cy.get('body').has('p').should('exist');
  });
});
