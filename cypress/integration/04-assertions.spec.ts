describe('Assertions', () => {
  it('should assert element exists', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('exist');
  });

  it('should assert element is visible', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('be.visible');
  });

  it('should assert element has text', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('have.text', 'Example Domain');
  });

  it('should assert element contains text', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('contain', 'Example');
  });

  it('should assert element has attribute', () => {
    cy.visit('https://example.com');
    cy.get('a').should('have.attr', 'href');
  });

  it('should use not assertion', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('not.have.class', 'hidden');
  });

  it('should chain assertions', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('exist').and('be.visible').and('have.text', 'Example Domain');
  });
});
